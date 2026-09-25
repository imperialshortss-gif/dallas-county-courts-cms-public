import { Router } from "express";
import { db } from "@workspace/db";
import { documentsTable, casesTable, activityTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/documents", async (req, res) => {
  try {
    const { caseId } = req.query as Record<string, string>;
    let conditions: any[] = [];

    if (caseId) conditions.push(eq(documentsTable.caseId, parseInt(caseId, 10)));

    const whereClause = conditions.length > 0 ? conditions.reduce((a, b) => sql`${a} AND ${b}`) : sql`1=1`;
    const documents = await db
      .select({
        id: documentsTable.id,
        caseId: documentsTable.caseId,
        fileName: documentsTable.fileName,
        fileType: documentsTable.fileType,
        uploadedBy: documentsTable.uploadedBy,
        uploadedDate: documentsTable.uploadedDate,
        category: documentsTable.category,
        sizeKb: documentsTable.sizeKb,
        mimeType: documentsTable.mimeType,
      })
      .from(documentsTable)
      .where(whereClause)
      .orderBy(sql`uploaded_date desc`);

    res.json(documents);
  } catch (err) {
    req.log.error({ err }, "Error listing documents");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Public file access: a person viewing a case can open/download an uploaded file.
router.get("/documents/:id/file", async (req, res) => {
  try {
    const documentId = parseInt(req.params.id, 10);
    if (!Number.isInteger(documentId)) {
      return res.status(400).json({ error: "Invalid document ID" });
    }

    const [document] = await db
      .select({
        id: documentsTable.id,
        fileName: documentsTable.fileName,
        fileType: documentsTable.fileType,
        mimeType: documentsTable.mimeType,
        fileData: documentsTable.fileData,
      })
      .from(documentsTable)
      .where(eq(documentsTable.id, documentId))
      .limit(1);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    if (!document.fileData) {
      return res.status(404).json({ error: "No file is attached to this document" });
    }

    const buffer = Buffer.from(document.fileData, "base64");
    const mimeType = document.mimeType || "application/octet-stream";

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Length", buffer.length.toString());
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${String(document.fileName).replace(/["\\\r\n]/g, "_")}"`
    );
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.send(buffer);
  } catch (err) {
    req.log.error({ err }, "Error serving document file");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/documents", requireAuth, async (req, res) => {
  try {
    const {
      caseId,
      fileName,
      fileType,
      uploadedBy,
      uploadedDate,
      category,
      sizeKb,
      mimeType,
      fileData,
    } = req.body;

    if (!fileName || !category || !uploadedBy) {
      return res.status(400).json({ error: "File name, category, and uploaded by are required" });
    }

    if (fileData && typeof fileData !== "string") {
      return res.status(400).json({ error: "Invalid file data" });
    }

    // Keep database-stored uploads reasonably small for the serverless API.
    if (fileData && fileData.length > 6_000_000) {
      return res.status(413).json({ error: "File is too large. Please upload a file smaller than 4 MB." });
    }

    const [document] = await db.insert(documentsTable).values({
      caseId,
      fileName,
      fileType,
      uploadedBy,
      uploadedDate,
      category,
      sizeKb,
      mimeType: mimeType || null,
      fileData: fileData || null,
    }).returning();

    const caseRow = await db
      .select({ caseNumber: casesTable.caseNumber })
      .from(casesTable)
      .where(eq(casesTable.id, caseId));

    const caseNumber = caseRow[0]?.caseNumber ?? "";
    await db.insert(activityTable).values({
      caseId,
      caseNumber,
      action: "Document Uploaded",
      user: uploadedBy || "Court Staff",
      details: `${fileName} (${category})`,
    });

    const { fileData: _fileData, ...safeDocument } = document;
    res.status(201).json(safeDocument);
  } catch (err) {
    req.log.error({ err }, "Error creating document");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
