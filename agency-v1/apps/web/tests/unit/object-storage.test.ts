import { describe, it, expect, beforeEach } from 'vitest';
import { ObjectStorageEngine } from '../../lib/storage/object-storage-engine';

describe('Enterprise Object Storage Engine & Metadata Transmission Tests', () => {
  let engine: ObjectStorageEngine;

  beforeEach(() => {
    engine = new ObjectStorageEngine();
  });

  it('1. should detect correct categories for voice notes, videos, images, and documents', () => {
    expect(engine.getCategory('audio/ogg', 'voice-note.ogg')).toBe('audio');
    expect(engine.getCategory('audio/webm', 'audio.webm')).toBe('audio');
    expect(engine.getCategory('application/pdf', 'contract.pdf')).toBe('document');
    expect(engine.getCategory('image/png', 'screenshot.png')).toBe('image');
    expect(engine.getCategory('video/mp4', 'demo.mp4')).toBe('video');
  });

  it('2. should generate structured storage key with company ID and category date path', () => {
    const key = engine.generateStorageKey('comp-test-123', 'audio', 'voice-note-1.ogg');
    expect(key).toContain('companies/comp-test-123/audio/');
    expect(key).toContain('voice-note-1.ogg');
  });

  it('3. should generate presigned upload result with lightweight metadata reference', () => {
    const result = engine.generatePresignedUploadUrl(
      'heavy_presentation.pdf',
      'application/pdf',
      25 * 1024 * 1024,
      'company-hq-99',
      { author: 'Sales Team' }
    );

    expect(result.uploadUrl).toBeDefined();
    expect(result.storageKey).toContain('companies/company-hq-99/document/');
    expect(result.metadataReference).toBeDefined();
    expect(result.metadataReference.fileName).toBe('heavy_presentation.pdf');
    expect(result.metadataReference.sizeBytes).toBe(25 * 1024 * 1024);
    expect(result.metadataReference.category).toBe('document');
  });

  it('4. should format lightweight message attachment reference for messaging engine', () => {
    const presigned = engine.generatePresignedUploadUrl(
      'voice_recording.ogg',
      'audio/ogg',
      1.5 * 1024 * 1024,
      'company-latam',
      { duration: 42 }
    );

    const attachmentRef = engine.formatLightweightMessageAttachment(presigned.metadataReference);

    expect(attachmentRef.fileName).toBe('voice_recording.ogg');
    expect(attachmentRef.mediaType).toBe('AUDIO');
    expect(attachmentRef.fileSize).toBe(1.5 * 1024 * 1024);
    expect(attachmentRef.metadata.storageKey).toBeDefined();
    expect(attachmentRef.metadata.duration).toBe(42);
  });

  it('5. should generate valid presigned download URL', () => {
    const download = engine.generatePresignedDownloadUrl('companies/comp-1/audio/2026/07/20/audio_1.ogg', 1800);
    expect(download.downloadUrl).toBeDefined();
    expect(download.expiresInSeconds).toBe(1800);
  });
});
