import { pgTable, serial, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const casesTable = pgTable("cases", {
  id: serial("id").primaryKey(),
  caseNumber: text("case_number").notNull().unique(),
  fileNumber: text("file_number").notNull().default(""),
  title: text("title").notNull(),
  caseType: text("case_type").notNull().default(""),
  courtName: text("court_name").notNull().default(""),
  presidingOfficer: text("presiding_officer").notNull().default(""),
  caseCategory: text("case_category").notNull().default(""),
  filingDate: text("filing_date").notNull().default(""),
  status: text("status").notNull().default("Pending"),
  stage: text("stage").notNull().default(""),
  courtRoom: text("court_room"),
  notes: text("notes"),
  lastCourtDate: text("last_court_date"),
  nextCourtDate: text("next_court_date"),
  lastPaidFee: numeric("last_paid_fee"),
  lastPaidFeeDate: text("last_paid_fee_date"),
  pendingFees: numeric("pending_fees").notNull().default("0"),
  lastNotice: text("last_notice"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCaseSchema = createInsertSchema(casesTable).omit({ id: true, createdAt: true });
export type InsertCase = z.infer<typeof insertCaseSchema>;
export type Case = typeof casesTable.$inferSelect;
