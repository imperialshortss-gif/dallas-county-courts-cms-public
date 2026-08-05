import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const documentsTable = pgTable("documents", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  uploadedBy: text("uploaded_by").notNull(),
  uploadedDate: text("uploaded_date").notNull(),
  category: text("category").notNull(),
  sizeKb: integer("size_kb").notNull(),
});

export const insertDocumentSchema = createInsertSchema(documentsTable).omit({ id: true });
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documentsTable.$inferSelect;
