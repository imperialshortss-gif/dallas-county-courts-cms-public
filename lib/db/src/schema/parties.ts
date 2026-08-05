import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const partiesTable = pgTable("parties", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  advocate: text("advocate").notNull(),
  contactInfo: text("contact_info"),
});

export const insertPartySchema = createInsertSchema(partiesTable).omit({ id: true });
export type InsertParty = z.infer<typeof insertPartySchema>;
export type Party = typeof partiesTable.$inferSelect;
