import { Router } from "express";
import { db } from "@workspace/db";
import { documentsTable, casesTable, activityTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/documents", async (req, res) => {
  try {
    const { caseId } = req.query as Record<string, string>;
    let conditions: any[] = [];

    if (caseId) conditions.push(eq(documentsTable.caseId, parseInt(caseId, 10)));

    const whereClause = conditions.length > 0 ? conditions.reduce((a, b) => sql`${a} AND ${b}`) : sql`1=1`;
    const documents = await db.select().from(documentsTable).where(whereClause).orderBy(sql`uploaded_date desc`);
    res.json(documents);
  } catch (err) {
    req.log.error({ err }, "Error listing documents");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/documents", requireAuth, async (req, res) => {
  try {
    const { caseId, fileName, fileType, uploadedBy, uploadedDate, category, sizeKb } = req.body;

    const [document] = await db.insert(documentsTable).values({
      caseId, fileName, fileType, uploadedBy, uploadedDate, category, sizeKb,
    }).returning();

    // Auto-log activity
    const caseRow = await db.select({ caseNumber: casesTable.caseNumber }).from(casesTable).where(eq(casesTable.id, caseId));
    const caseNumber = caseRow[0]?.caseNumber ?? "";
    await db.insert(activityTable).values({
      caseId,
      caseNumber,
      action: "Document Uploaded",
      user: uploadedBy || "Court Staff",
      details: `${fileName} (${category})`,
    });

    res.status(201).json(document);
  } catch (err) {
    req.log.error({ err }, "Error creating document");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
