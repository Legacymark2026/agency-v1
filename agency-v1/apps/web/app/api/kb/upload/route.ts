import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { writeFile, unlink, readFile } from "fs/promises";
import path from "path";
import os from "os";
import { generateEmbedding } from "@/lib/embeddings";

// ─────────────────────────────────────────────────────────────────────────────
// P2-B: Text Content Extractor
// Extrae texto real de PDF/TXT para que el RAG semántico opere sobre
// el contenido del documento, no solo su nombre o descripción.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extracts readable text from a file for RAG embedding.
 * Returns null for binary formats that don't support text extraction.
 */
async function extractTextContent(
    filePath: string,
    mimeType: string,
    fileName: string
): Promise<string | null> {
    try {
        // Plain text formats — read directly
        if (
            mimeType === "text/plain" ||
            mimeType === "text/markdown" ||
            mimeType === "text/csv" ||
            fileName.endsWith(".txt") ||
            fileName.endsWith(".md") ||
            fileName.endsWith(".csv")
        ) {
            const buffer = await readFile(filePath);
            return buffer.toString("utf-8").slice(0, 100_000); // Limit: 100k chars
        }

        // PDF — dynamic import to avoid breaking if pdf-parse not installed
        if (mimeType === "application/pdf" || fileName.endsWith(".pdf")) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const pdfParse = require("pdf-parse");
                const buffer = await readFile(filePath);
                const data = await pdfParse(buffer);
                const text = (data.text as string).trim();
                if (text.length > 0) {
                    console.log(`[KB Upload] Extracted ${text.length} chars from PDF: ${fileName}`);
                    // Limit to 100k chars to stay within embedding model limits
                    return text.slice(0, 100_000);
                }
            } catch (pdfErr) {
                console.warn(
                    "[KB Upload] pdf-parse not available or failed. " +
                    "Run: npm install pdf-parse  — to enable PDF text extraction.",
                    pdfErr
                );
            }
        }

        // JSON files — readable as text
        if (mimeType === "application/json" || fileName.endsWith(".json")) {
            const buffer = await readFile(filePath);
            return buffer.toString("utf-8").slice(0, 100_000);
        }

        // For other formats (audio, video, image) — no text extraction
        return null;
    } catch (err) {
        console.error("[KB Upload] Text extraction failed:", err);
        return null;
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const companyUser = await prisma.companyUser.findFirst({
            where: { userId: session.user.id }
        });
        if (!companyUser) return NextResponse.json({ error: "No company" }, { status: 403 });

        const formData = await req.formData();
        const file = formData.get("file") as File;
        const name = formData.get("name") as string;
        const description = formData.get("description") as string || "";

        const kbId = formData.get("kbId") as string | null;

        if (!file && !kbId) {
            return NextResponse.json({ error: "Missing file" }, { status: 400 });
        }

        // Limit to 50MB for Safety on Vercel Node.js Serverless Function
        if (file.size > 50 * 1024 * 1024) {
            return NextResponse.json({ error: "File exceeds 50MB limit" }, { status: 400 });
        }

        // Determine Source Type
        let sourceType = "TEXT";
        if (file.type.startsWith("audio/")) sourceType = "AUDIO";
        else if (file.type.startsWith("video/")) sourceType = "VIDEO";
        else if (file.type === "application/pdf") sourceType = "PDF";

        // Save to /tmp
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const tempFilePath = path.join(os.tmpdir(), `upload-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`);
        await writeFile(tempFilePath, buffer);

        // P2-B: Extract real text content for RAG before cleanup
        let extractedText: string | null = null;
        try {
            extractedText = await extractTextContent(tempFilePath, file.type, file.name);
            if (extractedText) {
                console.log(`[KB Upload] Text extracted for RAG: ${extractedText.length} chars`);
            }
        } catch (extractErr) {
            console.warn("[KB Upload] Text extraction failed, falling back to metadata only.", extractErr);
        }

        let fileUri: string | null = null;
        let mimeType = file.type;

        try {
            // Upload to Gemini File API
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) throw new Error("GEMINI_API_KEY no detectado");

            const fileManager = new GoogleAIFileManager(apiKey);
            const uploadResponse = await fileManager.uploadFile(tempFilePath, {
                mimeType: file.type,
                displayName: name,
            });

            fileUri = uploadResponse.file.uri;
            console.log(`[KB Upload] File ${uploadResponse.file.name} uploaded to Gemini. URI: ${fileUri}`);

            // Wait for processing if it's a video (Gemini requires it)
            if (sourceType === "VIDEO") {
                let state = uploadResponse.file.state;
                while (state === "PROCESSING") {
                    await new Promise((resolve) => setTimeout(resolve, 5000));
                    const getResponse = await fileManager.getFile(uploadResponse.file.name);
                    state = getResponse.state;
                }
                if (state === "FAILED") throw new Error("Video processing failed in Gemini");
            }
        } finally {
            // Clean up tmp file
            try { await unlink(tempFilePath); } catch (e) { console.error("Could not delete tmp file", e); }
        }

        // Vectorize content — P2-B: prefer real extracted text over name/description
        let vectorEmbedding: number[] | null = null;
        try {
            const apiKey = process.env.GEMINI_API_KEY;
            if (apiKey) {
                // Priority: real document text > description > name
                const textToEmbed = extractedText
                    ? `${name}\n\n${extractedText}`
                    : description
                    ? `${name}\n\n${description}`
                    : name;
                vectorEmbedding = await generateEmbedding(textToEmbed, apiKey);
            }
        } catch (e) {
            console.error("Could not generate embedding for KB item", e);
        }

        // Determine final content to store in DB
        // If we have real extracted text → store it for full-text search fallback
        // Otherwise store the Gemini URI reference
        const finalContent = extractedText
            ? extractedText
            : `[Contenido Multimedia Adjunto. URI: ${fileUri}]`;

        // Save to Database
        let kb;
        if (kbId) {
            kb = await prisma.knowledgeBase.update({
                where: { id: kbId },
                data: {
                    name,
                    description,
                    sourceType,
                    mimeType,
                    fileUri,
                    content: finalContent,
                }
            });
            if (vectorEmbedding) {
                // Update embedding with raw SQL since Prisma doesn't directly map array to vector in update() easily
                await prisma.$executeRaw`UPDATE knowledge_bases SET embedding = ${vectorEmbedding}::vector WHERE id = ${kbId}`;
            }
        } else {
            // Cannot insert `Unsupported` type directly in Prisma's `create`, must use raw SQL.
            const newKbId = require("crypto").randomUUID();
            await prisma.$executeRaw`
                INSERT INTO knowledge_bases (id, company_id, name, description, source_type, mime_type, file_uri, content, is_active, created_at, updated_at)
                VALUES (${newKbId}, ${companyUser.companyId}, ${name}, ${description}, ${sourceType}, ${mimeType}, ${fileUri}, ${finalContent}, true, NOW(), NOW())
            `;
            if (vectorEmbedding) {
                await prisma.$executeRaw`UPDATE knowledge_bases SET embedding = ${vectorEmbedding}::vector WHERE id = ${newKbId}`;
            }
            kb = await prisma.knowledgeBase.findUnique({ where: { id: newKbId } });
        }

        return NextResponse.json({ success: true, kb });

    } catch (error: any) {
        console.error("[KB Upload API] Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
