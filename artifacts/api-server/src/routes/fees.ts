import { Router } from "express";
import { db } from "@workspace/db";
import { feesTable, casesTable, activityTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/fees", async (req, res) => {
  try {
    const { caseId, status } = req.query as Record<string, string>;
    let conditions: any[] = [];
    if (caseId) conditions.push(eq(feesTable.caseId, parseInt(caseId, 10)));
    if (status) conditions.push(eq(feesTable.status, status));
    const whereClause =
      conditions.length > 0
        ? conditions.reduce((a, b) => sql`${a} AND ${b}`)
        : sql`1=1`;
    const fees = await db.select().from(feesTable).where(whereClause);
    res.json(fees.map((f) => ({ ...f, amount: Number(f.amount) })));
  } catch (err) {
    req.log.error({ err }, "Error listing fees");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/fees", requireAuth, async (req, res) => {
  try {
    const {
      caseId,
      description,
      amount,
      status,
      dueDate,
      paidDate,
      receiptNumber,
    } = req.body;

    let fee;

    if (status === "paid") {
      const existingFee = await db
        .select()
        .from(feesTable)
        .where(sql`case_id = ${caseId} AND status = 'pending'`)
        .limit(1);

      if (existingFee.length > 0) {
        [fee] = await db
          .update(feesTable)
          .set({
            status: "paid",
            description: description,
            amount: String(amount),
            paidDate: paidDate || null,
            receiptNumber: receiptNumber || null,
          })
          .where(eq(feesTable.id, existingFee[0].id))
          .returning();
      } else {
        [fee] = await db
          .insert(feesTable)
          .values({
            caseId,
            description,
            amount: String(amount),
            status: "paid",
            dueDate,
            paidDate: paidDate || null,
            receiptNumber: receiptNumber || null,
          })
          .returning();
      }
    } else {
      [fee] = await db
        .insert(feesTable)
        .values({
          caseId,
          description,
          amount: String(amount),
          status,
          dueDate,
          paidDate: paidDate || null,
          receiptNumber: receiptNumber || null,
        })
        .returning();
    }

    // Update the case's fee summary. Keep this separate from the fee record itself
    // so a summary/activity problem cannot make an otherwise successful payment look failed.
    try {
      const pendingResult = await db
        .select({ total: sql<string>`coalesce(sum(amount), 0)` })
        .from(feesTable)
        .where(sql`case_id = ${caseId} AND status = 'pending'`);
      const pendingTotal = pendingResult[0]?.total ?? "0";
      const updateFields: Record<string, any> = { pendingFees: pendingTotal };
      if (status === "paid" && paidDate) {
        updateFields.lastPaidFee = String(amount);
        updateFields.lastPaidFeeDate = paidDate;
      }
      await db
        .update(casesTable)
        .set(updateFields)
        .where(eq(casesTable.id, caseId));
    } catch (summaryErr) {
      req.log.error({ err: summaryErr, caseId }, "Fee saved but case fee summary could not be updated");
    }

    // Activity logging is best-effort. It must not turn a successfully saved
    // fee/payment into a 500 response.
    try {
      const caseRow = await db
        .select({ caseNumber: casesTable.caseNumber })
        .from(casesTable)
        .where(eq(casesTable.id, caseId));
      const caseNumber = caseRow[0]?.caseNumber ?? "";
      await db.insert(activityTable).values({
        caseId,
        caseNumber,
        action: status === "paid" ? "Fee Payment Recorded" : "Fee Assessed",
        user: req.body.updatedBy || "Court Staff",
        details: `${description} – ${Number(amount).toFixed(2)} (${status})${receiptNumber ? ` – Receipt: ${receiptNumber}` : ""}`,
      });
    } catch (activityErr) {
      req.log.error({ err: activityErr, caseId }, "Fee saved but activity log could not be recorded");
    }

    res.status(201).json({ ...fee, amount: Number(fee.amount) });
  } catch (err) {
    req.log.error({ err }, "Error creating fee");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
