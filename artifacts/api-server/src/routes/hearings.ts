import { Router } from "express";
import { db } from "@workspace/db";
import { hearingsTable, casesTable, activityTable } from "@workspace/db";
import { eq, sql, gte } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/hearings", async (req, res) => {
  try {
    const { caseId, upcoming } = req.query as Record<string, string>;
    let conditions: any[] = [];

    if (caseId) conditions.push(eq(hearingsTable.caseId, parseInt(caseId, 10)));
    if (upcoming === "true") {
      const today = new Date().toISOString().split("T")[0];
      conditions.push(gte(hearingsTable.hearingDate, today));
    }

    const whereClause = conditions.length > 0 ? conditions.reduce((a, b) => sql`${a} AND ${b}`) : sql`1=1`;
    const hearings = await db.select().from(hearingsTable).where(whereClause).orderBy(hearingsTable.hearingDate);
    res.json(hearings);
  } catch (err) {
    req.log.error({ err }, "Error listing hearings");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/hearings", requireAuth, async (req, res) => {
  try {
    const { caseId, caseNumber, caseTitle, hearingDate, hearingType, courtRoom, result, notes } = req.body;

    const [hearing] = await db.insert(hearingsTable).values({
      caseId, caseNumber, caseTitle, hearingDate, hearingType, courtRoom, result, notes,
    }).returning();

    // Update case lastCourtDate and optionally nextCourtDate
    const today = new Date().toISOString().split("T")[0];
    const isPast = hearingDate <= today;
    if (isPast) {
      await db.update(casesTable).set({ lastCourtDate: hearingDate }).where(eq(casesTable.id, caseId));
    } else {
      await db.update(casesTable).set({ nextCourtDate: hearingDate }).where(eq(casesTable.id, caseId));
    }

    // Auto-log activity
    await db.insert(activityTable).values({
      caseId,
      caseNumber,
      action: "Hearing Recorded",
      user: req.body.updatedBy || "Court Staff",
      details: `${hearingType} on ${hearingDate} – ${result}`,
    });

    res.status(201).json(hearing);
  } catch (err) {
    req.log.error({ err }, "Error creating hearing");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
