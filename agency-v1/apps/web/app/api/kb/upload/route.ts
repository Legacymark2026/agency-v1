import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import os from "os";
import { generateEmbedding } from "@/lib/embeddings";

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

        let fileUri: string | null = null;
        let mimeType = file.type;

        try {
            // Upload to Gemini
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

        // Vectorize content
        let vectorEmbedding: number[] | null = null;
        try {
            const apiKey = process.env.GEMINI_API_KEY;
            const textToEmbed = description ? `${name}\n\n${description}` : name;
            if (apiKey) {
                vectorEmbedding = await generateEmbedding(textToEmbed, apiKey);
            }
        } catch (e) {
            console.error("Could not generate embedding for KB item", e);
        }

        // Save to Database
        let kb;
        const finalContent = `[Contenido Multimedia Adjunto. URI: ${fileUri}]`;

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
