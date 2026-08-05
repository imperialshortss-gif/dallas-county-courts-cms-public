import { Router } from "express";
import { db } from "@workspace/db";
import { partiesTable, casesTable, activityTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/parties", async (req, res) => {
  try {
    const { caseId, role } = req.query as Record<string, string>;
    let conditions: any[] = [];

    if (caseId) conditions.push(eq(partiesTable.caseId, parseInt(caseId, 10)));
    if (role) conditions.push(eq(partiesTable.role, role));

    const whereClause = conditions.length > 0 ? conditions.reduce((a, b) => sql`${a} AND ${b}`) : sql`1=1`;
    const parties = await db.select().from(partiesTable).where(whereClause);
    res.json(parties);
  } catch (err) {
    req.log.error({ err }, "Error listing parties");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/parties", requireAuth, async (req, res) => {
  try {
    const { caseId, name, role, advocate, contactInfo } = req.body;

    const [party] = await db.insert(partiesTable).values({
      caseId, name, role, advocate, contactInfo: contactInfo || null,
    }).returning();

    // Auto-log activity
    const caseRow = await db.select({ caseNumber: casesTable.caseNumber }).from(casesTable).where(eq(casesTable.id, caseId));
    const caseNumber = caseRow[0]?.caseNumber ?? "";
    await db.insert(activityTable).values({
      caseId,
      caseNumber,
      action: "Party Added",
      user: req.body.updatedBy || "Court Staff",
      details: `${name} added as ${role}`,
    });

    res.status(201).json(party);
  } catch (err) {
    req.log.error({ err }, "Error creating party");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
