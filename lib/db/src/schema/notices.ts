import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const noticesTable = pgTable("notices", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull(),
  title: text("title").notNull(),
  issuedDate: text("issued_date").notNull(),
  noticeType: text("notice_type").notNull(),
  issuedBy: text("issued_by").notNull(),
  content: text("content"),
});

export const insertNoticeSchema = createInsertSchema(noticesTable).omit({ id: true });
export type InsertNotice = z.infer<typeof insertNoticeSchema>;
export type Notice = typeof noticesTable.$inferSelect;
