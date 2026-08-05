import { pgTable, serial, text, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const feesTable = pgTable("fees", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull(),
  description: text("description").notNull(),
  amount: numeric("amount").notNull(),
  status: text("status").notNull().default("pending"),
  dueDate: text("due_date").notNull(),
  paidDate: text("paid_date"),
  receiptNumber: text("receipt_number"),
});

export const insertFeeSchema = createInsertSchema(feesTable).omit({ id: true });
export type InsertFee = z.infer<typeof insertFeeSchema>;
export type Fee = typeof feesTable.$inferSelect;
