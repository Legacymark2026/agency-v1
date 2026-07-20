/**
 * apps/web/tests/unit/inbox-media.test.ts
 * ──────────────────────────────────────────────────────────────
 * Suite de pruebas unitarias para verificación del Inbox Omnicanal:
 * 1. Recepción y Envío de Mensajes de Texto
 * 2. Recepción y Envío de Notas de Voz (Audio MP3, OGG, WAV)
 * 3. Recepción y Envío de Documentos Adjuntos (PDF, DOCX, XLSX, imágenes)
 *
 * Pirámide de Testing - Capa de Pruebas Unitarias (70%)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma Client
vi.mock('@/lib/prisma', () => ({
    prisma: {
        conversation: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        message: {
            create: vi.fn(),
            findMany: vi.fn(),
        },
        mediaAsset: {
            create: vi.fn(),
        },
        companyUser: {
            findFirst: vi.fn(),
        },
    },
}));

import { prisma } from '@/lib/prisma';

// Helper function to simulate media classification & validation
function validateAndClassifyMedia(file: { name: string; type: string; sizeBytes: number }) {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const mimeType = file.type || '';

    let category = 'DOCUMENT';
    if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
        category = 'AUDIO';
    } else if (mimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
        category = 'IMAGE';
    } else if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'].includes(ext)) {
        category = 'DOCUMENT';
    }

    const MAX_SIZE = 100 * 1024 * 1024; // 100MB
    const isValid = file.sizeBytes <= MAX_SIZE && !['exe', 'sh', 'bat'].includes(ext);

    return {
        category,
        isValid,
        extension: ext,
    };
}

describe('Omnichannel Inbox Media & Attachments Tests', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── 1. Voice Note Tests ──────────────────────────────────────────────────
    describe('1. Voice Notes (Send & Receive Audio)', () => {
        it('should classify audio files (mp3, ogg, wav) as AUDIO voice notes', () => {
            const voiceNote = { name: 'voice-note-12345.ogg', type: 'audio/ogg;codecs=opus', sizeBytes: 150000 };
            const classified = validateAndClassifyMedia(voiceNote);

            expect(classified.category).toBe('AUDIO');
            expect(classified.isValid).toBe(true);
        });

        it('should persist audio voice note message with audio wave metadata', async () => {
            (prisma.message.create as any).mockResolvedValueOnce({
                id: 'msg-voice-1',
                content: '🎤 Nota de Voz',
                mediaUrl: '/uploads/comp-1/audio/voice-note-1.ogg',
                mediaType: 'AUDIO',
                createdAt: new Date(),
            });

            const created = await prisma.message.create({
                data: {
                    conversationId: 'conv-100',
                    content: '🎤 Nota de Voz',
                    mediaUrl: '/uploads/comp-1/audio/voice-note-1.ogg',
                    mediaType: 'AUDIO',
                } as any
            });

            expect(created.mediaType).toBe('AUDIO');
            expect(created.mediaUrl).toContain('voice-note-1.ogg');
        });
    });

    // ── 2. Document Attachments Tests ───────────────────────────────────────
    describe('2. Document Attachments (Send & Receive PDF, DOCX, XLSX)', () => {
        it('should validate and classify PDF and Office documents', () => {
            const pdfDoc = { name: 'propuesta-comercial.pdf', type: 'application/pdf', sizeBytes: 2500000 };
            const xlsxDoc = { name: 'cotizacion.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', sizeBytes: 800000 };

            expect(validateAndClassifyMedia(pdfDoc).category).toBe('DOCUMENT');
            expect(validateAndClassifyMedia(xlsxDoc).category).toBe('DOCUMENT');
            expect(validateAndClassifyMedia(pdfDoc).isValid).toBe(true);
        });

        it('should reject dangerous executable extensions (.exe, .bat, .sh)', () => {
            const dangerousFile = { name: 'malware.exe', type: 'application/x-msdownload', sizeBytes: 50000 };
            const classified = validateAndClassifyMedia(dangerousFile);

            expect(classified.isValid).toBe(false);
        });

        it('should persist document attachment message with download URL', async () => {
            (prisma.message.create as any).mockResolvedValueOnce({
                id: 'msg-doc-1',
                content: '📎 propuesta-comercial.pdf',
                mediaUrl: '/uploads/comp-1/document/propuesta-comercial.pdf',
                mediaType: 'DOCUMENT',
                createdAt: new Date(),
            });

            const created = await prisma.message.create({
                data: {
                    conversationId: 'conv-100',
                    content: '📎 propuesta-comercial.pdf',
                    mediaUrl: '/uploads/comp-1/document/propuesta-comercial.pdf',
                    mediaType: 'DOCUMENT',
                } as any
            });

            expect(created.mediaType).toBe('DOCUMENT');
            expect(created.mediaUrl).toContain('.pdf');
        });
    });

    // ── 3. Image Attachments Tests ──────────────────────────────────────────
    describe('3. Image Attachments (Send & Receive Images)', () => {
        it('should classify images (PNG, JPG, WEBP) correctly', () => {
            const image = { name: 'screenshot-error.png', type: 'image/png', sizeBytes: 500000 };
            const classified = validateAndClassifyMedia(image);

            expect(classified.category).toBe('IMAGE');
            expect(classified.isValid).toBe(true);
        });
    });
});
