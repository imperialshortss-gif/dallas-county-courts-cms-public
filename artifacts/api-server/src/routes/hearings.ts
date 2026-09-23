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

    const today = new Date().toISOString().split("T")[0];
    const isPast = hearingDate <= today;
    if (isPast) {
      await db.update(casesTable).set({ lastCourtDate: hearingDate }).where(eq(casesTable.id, caseId));
    } else {
      await db.update(casesTable).set({ nextCourtDate: hearingDate }).where(eq(casesTable.id, caseId));
    }

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

router.put("/hearings/:id", requireAuth, async (req, res) => {
  try {
    const hearingId = parseInt(req.params.id, 10);
    if (!Number.isInteger(hearingId)) {
      return res.status(400).json({ error: "Invalid hearing ID" });
    }

    const { caseId, caseNumber, caseTitle, hearingDate, hearingType, courtRoom, result, notes } = req.body;

    const [existing] = await db.select().from(hearingsTable).where(eq(hearingsTable.id, hearingId)).limit(1);
    if (!existing) {
      return res.status(404).json({ error: "Hearing not found" });
    }

    const updateValues = {
      caseId: caseId ?? existing.caseId,
      caseNumber: caseNumber ?? existing.caseNumber,
      caseTitle: caseTitle ?? existing.caseTitle,
      hearingDate: hearingDate ?? existing.hearingDate,
      hearingType: hearingType ?? existing.hearingType,
      courtRoom: courtRoom ?? existing.courtRoom,
      result: result ?? existing.result,
      notes: notes ?? existing.notes,
    };

    const [hearing] = await db.update(hearingsTable)
      .set(updateValues)
      .where(eq(hearingsTable.id, hearingId))
      .returning();

    const updatedCaseId = updateValues.caseId;
    const updatedHearingDate = updateValues.hearingDate;
    const today = new Date().toISOString().split("T")[0];

    if (updatedCaseId && updatedHearingDate) {
      if (updatedHearingDate <= today) {
        await db.update(casesTable)
          .set({ lastCourtDate: updatedHearingDate })
          .where(eq(casesTable.id, updatedCaseId));
      } else {
        await db.update(casesTable)
          .set({ nextCourtDate: updatedHearingDate })
          .where(eq(casesTable.id, updatedCaseId));
      }
    }

    await db.insert(activityTable).values({
      caseId: updatedCaseId,
      caseNumber: updateValues.caseNumber,
      action: "Hearing Updated",
      user: req.body.updatedBy || "Court Staff",
      details: `${updateValues.hearingType} on ${updatedHearingDate} – ${updateValues.result ?? ""}`,
    });

    res.json(hearing);
  } catch (err) {
    req.log.error({ err }, "Error updating hearing");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
