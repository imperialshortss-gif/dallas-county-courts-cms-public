import { Router } from "express";
import { db } from "@workspace/db";
import { casesTable, partiesTable, hearingsTable, feesTable, noticesTable, documentsTable, activityTable } from "@workspace/db";
import { eq, ilike, or, sql } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

const router = Router();

// GET /cases
router.get("/cases", async (req, res) => {
  try {
    const { query, searchType, status, page = "1", pageSize = "20" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSizeNum = Math.min(100, parseInt(pageSize, 10) || 20);
    const offset = (pageNum - 1) * pageSizeNum;

    let conditions: any[] = [];

    if (query && query.trim()) {
      const q = `%${query.trim()}%`;
      if (searchType === "caseNumber") {
        conditions.push(ilike(casesTable.caseNumber, q));
      } else if (searchType === "fileNumber") {
        conditions.push(ilike(casesTable.fileNumber, q));
      } else if (searchType === "partyName") {
        // Get case IDs from parties matching name
        const matchingParties = await db
          .select({ caseId: partiesTable.caseId })
          .from(partiesTable)
          .where(ilike(partiesTable.name, q));
        const caseIds = matchingParties.map((p) => p.caseId);
        if (caseIds.length > 0) {
          conditions.push(sql`${casesTable.id} = ANY(${caseIds})`);
        } else {
          res.json({ cases: [], total: 0, page: pageNum, pageSize: pageSizeNum });
          return;
        }
      } else {
        // Default: search across case number, file number, title
        conditions.push(
          or(
            ilike(casesTable.caseNumber, q),
            ilike(casesTable.fileNumber, q),
            ilike(casesTable.title, q)
          )!
        );
      }
    }

    if (status) {
      conditions.push(eq(casesTable.status, status));
    }

    const whereClause = conditions.length > 0 ? conditions.reduce((a, b) => sql`${a} AND ${b}`) : sql`1=1`;

    const [allCases, countResult] = await Promise.all([
      db.select().from(casesTable).where(whereClause).limit(pageSizeNum).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(casesTable).where(whereClause),
    ]);

    res.json({
      cases: allCases.map(normalizeCase),
      total: Number(countResult[0].count),
      page: pageNum,
      pageSize: pageSizeNum,
    });
  } catch (err) {
    req.log.error({ err }, "Error listing cases");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /cases
router.post("/cases", requireAuth, async (req, res) => {
  try {
    const body = req.body;
    const values = {
      caseNumber: body.caseNumber,
      fileNumber: body.fileNumber ?? "",
      title: body.title,
      caseType: body.caseType ?? "",
      courtName: body.courtName ?? body.court ?? "",
      presidingOfficer: body.presidingOfficer ?? body.judgeName ?? "",
      caseCategory: body.caseCategory ?? "",
      filingDate: body.filingDate ?? "",
      status: body.status ?? "Pending",
      stage: body.stage ?? "",
      courtRoom: body.courtRoom ?? null,
      notes: body.notes ?? null,
    };
    const [created] = await db.insert(casesTable).values(values).returning();
    res.status(201).json(normalizeCase(created));
  } catch (err) {
    req.log.error({ err }, "Error creating case");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /cases/:id
router.get("/cases/:id", async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const [caseRow] = await db.select().from(casesTable).where(eq(casesTable.id, id));
    if (!caseRow) {
      res.status(404).json({ error: "Case not found" });
      return;
    }

    const [parties, hearings, fees, notices, documents, activity] = await Promise.all([
      db.select().from(partiesTable).where(eq(partiesTable.caseId, id)),
      db.select().from(hearingsTable).where(eq(hearingsTable.caseId, id)).orderBy(hearingsTable.hearingDate),
      db.select().from(feesTable).where(eq(feesTable.caseId, id)),
      db.select().from(noticesTable).where(eq(noticesTable.caseId, id)),
      db.select().from(documentsTable).where(eq(documentsTable.caseId, id)),
      db.select().from(activityTable).where(eq(activityTable.caseId, id)).orderBy(activityTable.timestamp),
    ]);

    res.json({
      ...normalizeCase(caseRow),
      parties,
      hearings,
      fees: fees.map((f) => ({ ...f, amount: Number(f.amount) })),
      notices,
      documents,
      activity,
    });
  } catch (err) {
    req.log.error({ err }, "Error getting case");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /cases/:id
router.patch("/cases/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const [updated] = await db.update(casesTable).set(req.body).where(eq(casesTable.id, id)).returning();
    if (!updated) {
      res.status(404).json({ error: "Case not found" });
      return;
    }
    res.json(normalizeCase(updated));
  } catch (err) {
    req.log.error({ err }, "Error updating case");
    res.status(500).json({ error: "Internal server error" });
  }
});

function normalizeCase(c: any) {
  return {
    ...c,
    lastPaidFee: c.lastPaidFee != null ? Number(c.lastPaidFee) : null,
    pendingFees: Number(c.pendingFees),
  };
}

export default router;
