import { Router } from "express";
import { db } from "@workspace/db";
import { activityTable } from "@workspace/db";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/activity", requireAuth, async (req, res) => {
  try {
    const { caseId, caseNumber, action, user, details } = req.body;

    const [entry] = await db.insert(activityTable).values({
      caseId, caseNumber, action,
      user: user || "Court Staff",
      details: details || null,
    }).returning();

    res.status(201).json({
      ...entry,
      timestamp: entry.timestamp?.toISOString() ?? new Date().toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error creating activity");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
