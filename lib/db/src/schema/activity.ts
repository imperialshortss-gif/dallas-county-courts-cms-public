import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const activityTable = pgTable("activity", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull(),
  caseNumber: text("case_number").notNull(),
  action: text("action").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  user: text("user").notNull(),
  details: text("details"),
});

export const insertActivitySchema = createInsertSchema(activityTable).omit({ id: true });
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activityTable.$inferSelect;
