import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const hearingsTable = pgTable("hearings", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull(),
  caseNumber: text("case_number").notNull(),
  caseTitle: text("case_title").notNull(),
  hearingDate: text("hearing_date").notNull(),
  hearingType: text("hearing_type").notNull(),
  courtRoom: text("court_room").notNull(),
  result: text("result").notNull(),
  notes: text("notes"),
});

export const insertHearingSchema = createInsertSchema(hearingsTable).omit({ id: true });
export type InsertHearing = z.infer<typeof insertHearingSchema>;
export type Hearing = typeof hearingsTable.$inferSelect;
