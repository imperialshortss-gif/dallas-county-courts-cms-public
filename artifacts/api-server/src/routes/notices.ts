import { Router } from "express";
import { db } from "@workspace/db";
import { noticesTable, casesTable, activityTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/notices", async (req, res) => {
  try {
    const { caseId } = req.query as Record<string, string>;
    let conditions: any[] = [];

    if (caseId) conditions.push(eq(noticesTable.caseId, parseInt(caseId, 10)));

    const whereClause = conditions.length > 0 ? conditions.reduce((a, b) => sql`${a} AND ${b}`) : sql`1=1`;
    const notices = await db.select().from(noticesTable).where(whereClause).orderBy(sql`issued_date desc`);
    res.json(notices);
  } catch (err) {
    req.log.error({ err }, "Error listing notices");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/notices", requireAuth, async (req, res) => {
  try {
    const { caseId, title, issuedDate, noticeType, issuedBy, content } = req.body;

    const [notice] = await db.insert(noticesTable).values({
      caseId, title, issuedDate, noticeType, issuedBy, content: content || null,
    }).returning();

    // Update lastNotice on the case
    await db.update(casesTable).set({ lastNotice: title }).where(eq(casesTable.id, caseId));

    // Auto-log activity
    const caseRow = await db.select({ caseNumber: casesTable.caseNumber }).from(casesTable).where(eq(casesTable.id, caseId));
    const caseNumber = caseRow[0]?.caseNumber ?? "";
    await db.insert(activityTable).values({
      caseId,
      caseNumber,
      action: "Notice Issued",
      user: req.body.updatedBy || "Court Staff",
      details: `${noticeType}: ${title}`,
    });

    res.status(201).json(notice);
  } catch (err) {
    req.log.error({ err }, "Error creating notice");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
