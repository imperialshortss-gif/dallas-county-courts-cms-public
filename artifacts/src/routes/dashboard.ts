import { Router } from "express";
import { db } from "@workspace/db";
import { casesTable, hearingsTable, feesTable, activityTable } from "@workspace/db";
import { eq, sql, gte, lte } from "drizzle-orm";

const router = Router();

// GET /dashboard/summary
router.get("/dashboard/summary", async (req, res) => {
  try {
    const [counts, pendingFeesResult, statusBreakdown, categoryBreakdown] = await Promise.all([
      db.select({
        total: sql<number>`count(*)`,
        active: sql<number>`count(*) filter (where status = 'Active')`,
        pending: sql<number>`count(*) filter (where status = 'Pending')`,
        closed: sql<number>`count(*) filter (where status = 'Closed')`,
      }).from(casesTable),
      db.select({ total: sql<number>`coalesce(sum(amount), 0)` })
        .from(feesTable)
        .where(eq(feesTable.status, "pending")),
      db.select({ status: casesTable.status, count: sql<number>`count(*)` })
        .from(casesTable)
        .groupBy(casesTable.status),
      db.select({ category: casesTable.caseCategory, count: sql<number>`count(*)` })
        .from(casesTable)
        .groupBy(casesTable.caseCategory),
    ]);

    const today = new Date().toISOString().split("T")[0];
    const weekOut = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const [upcomingHearings, recentFilings] = await Promise.all([
      db.select({ count: sql<number>`count(*)` })
        .from(hearingsTable)
        .where(sql`hearing_date >= ${today} AND hearing_date <= ${weekOut}`),
      db.select({ count: sql<number>`count(*)` })
        .from(casesTable)
        .where(sql`filing_date >= ${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}`),
    ]);

    res.json({
      totalCases: Number(counts[0].total),
      activeCases: Number(counts[0].active),
      pendingCases: Number(counts[0].pending),
      closedCases: Number(counts[0].closed),
      totalPendingFees: Number(pendingFeesResult[0].total),
      upcomingHearingsCount: Number(upcomingHearings[0].count),
      recentFilingsCount: Number(recentFilings[0].count),
      statusBreakdown: statusBreakdown.map((s) => ({ status: s.status, count: Number(s.count) })),
      categoryBreakdown: categoryBreakdown.map((c) => ({ category: c.category, count: Number(c.count) })),
    });
  } catch (err) {
    req.log.error({ err }, "Error getting dashboard summary");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /dashboard/recent-activity
router.get("/dashboard/recent-activity", async (req, res) => {
  try {
    const activity = await db
      .select()
      .from(activityTable)
      .orderBy(sql`timestamp desc`)
      .limit(20);

    res.json(
      activity.map((a) => ({
        ...a,
        timestamp: a.timestamp?.toISOString() ?? new Date().toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Error getting recent activity");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /dashboard/upcoming-hearings
router.get("/dashboard/upcoming-hearings", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const hearings = await db
      .select()
      .from(hearingsTable)
      .where(gte(hearingsTable.hearingDate, today))
      .orderBy(hearingsTable.hearingDate)
      .limit(10);

    res.json(hearings);
  } catch (err) {
    req.log.error({ err }, "Error getting upcoming hearings");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /dashboard/pending-fees
router.get("/dashboard/pending-fees", async (req, res) => {
  try {
    const fees = await db
      .select()
      .from(feesTable)
      .where(eq(feesTable.status, "pending"))
      .orderBy(sql`due_date asc`)
      .limit(50);

    const totalResult = await db
      .select({ total: sql<number>`coalesce(sum(amount), 0)`, caseCount: sql<number>`count(distinct case_id)` })
      .from(feesTable)
      .where(eq(feesTable.status, "pending"));

    res.json({
      totalAmount: Number(totalResult[0].total),
      casesWithPendingFees: Number(totalResult[0].caseCount),
      fees: fees.map((f) => ({ ...f, amount: Number(f.amount) })),
    });
  } catch (err) {
    req.log.error({ err }, "Error getting pending fees");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
