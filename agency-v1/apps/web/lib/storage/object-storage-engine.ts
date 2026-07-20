import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';

export type StorageProviderType = 'S3' | 'MINIO' | 'R2' | 'DO_SPACES' | 'LOCAL';

export interface FileMetadataReference {
  id: string;
  storageKey: string;
  bucket: string;
  provider: StorageProviderType;
  cdnUrl: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  category: 'audio' | 'video' | 'document' | 'image' | 'other';
  checksum?: string;
  duration?: number;
  width?: number;
  height?: number;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface PresignedUploadResult {
  uploadUrl: string;
  storageKey: string;
  cdnUrl: string;
  expiresInSeconds: number;
  metadataReference: FileMetadataReference;
}

export interface PresignedDownloadResult {
  downloadUrl: string;
  expiresInSeconds: number;
}

export class ObjectStorageEngine {
  private provider: StorageProviderType;
  private bucket: string;
  private endpoint: string;
  private cdnBaseUrl: string;

  constructor() {
    this.provider = (process.env.STORAGE_PROVIDER as StorageProviderType) || 'LOCAL';
    this.bucket = process.env.STORAGE_BUCKET || 'legacymark-media';
    this.endpoint = process.env.STORAGE_ENDPOINT || 'http://localhost:9000';
    this.cdnBaseUrl = process.env.STORAGE_CDN_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }

  public getProvider(): StorageProviderType {
    return this.provider;
  }

  public getBucket(): string {
    return this.bucket;
  }

  public getCategory(mimeType: string, fileName: string): 'audio' | 'video' | 'document' | 'image' | 'other' {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (mimeType.startsWith('audio/') || ['mp3', 'ogg', 'wav', 'm4a', 'aac', 'webm', 'opus'].includes(ext)) {
      return 'audio';
    }
    if (mimeType.startsWith('video/') || ['mp4', 'mov', 'webm', 'avi', 'mkv'].includes(ext)) {
      return 'video';
    }
    if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)) {
      return 'image';
    }
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt', 'zip', 'rar'].includes(ext)) {
      return 'document';
    }
    return 'other';
  }

  public generateStorageKey(companyId: string, category: string, fileName: string): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '/'); // YYYY/MM/DD
    const safeName = fileName.toLowerCase().replace(/[^a-z0-9.]/g, '-').slice(0, 50);
    const uniqueId = uuidv4().split('-')[0];
    return `companies/${companyId}/${category}/${dateStr}/${uniqueId}_${safeName}`;
  }

  public generatePresignedUploadUrl(
    fileName: string,
    mimeType: string,
    sizeBytes: number,
    companyId: string = 'default-company',
    extraMetadata: Record<string, any> = {}
  ): PresignedUploadResult {
    const category = this.getCategory(mimeType, fileName);
    const storageKey = this.generateStorageKey(companyId, category, fileName);
    const assetId = `obj_${uuidv4().replace(/-/g, '').slice(0, 16)}`;

    // Build public accessible CDN URL
    let cdnUrl = '';
    if (this.provider === 'LOCAL') {
      cdnUrl = `${this.cdnBaseUrl}/api/serve/${storageKey}`;
    } else {
      cdnUrl = `${this.cdnBaseUrl}/${storageKey}`;
    }

    // In S3/MinIO/R2, uploadUrl would be a signed PUT URL. In LOCAL, it points to local upload API.
    const uploadUrl = this.provider === 'LOCAL'
      ? `${this.cdnBaseUrl}/api/storage/upload?key=${encodeURIComponent(storageKey)}`
      : `${this.endpoint}/${this.bucket}/${storageKey}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=3600`;

    const metadataReference: FileMetadataReference = {
      id: assetId,
      storageKey,
      bucket: this.bucket,
      provider: this.provider,
      cdnUrl,
      fileName,
      originalName: fileName,
      mimeType,
      sizeBytes,
      category,
      checksum: extraMetadata.checksum || createHash('md5').update(`${fileName}-${sizeBytes}-${Date.now()}`).digest('hex'),
      duration: extraMetadata.duration,
      width: extraMetadata.width,
      height: extraMetadata.height,
      metadata: extraMetadata,
      createdAt: new Date().toISOString(),
    };

    return {
      uploadUrl,
      storageKey,
      cdnUrl,
      expiresInSeconds: 3600,
      metadataReference,
    };
  }

  public generatePresignedDownloadUrl(storageKey: string, expiresInSeconds: number = 3600): PresignedDownloadResult {
    let downloadUrl = '';
    if (this.provider === 'LOCAL') {
      downloadUrl = `${this.cdnBaseUrl}/api/serve/${storageKey}`;
    } else {
      downloadUrl = `${this.endpoint}/${this.bucket}/${storageKey}?X-Amz-Expires=${expiresInSeconds}`;
    }

    return {
      downloadUrl,
      expiresInSeconds,
    };
  }

  public formatLightweightMessageAttachment(ref: FileMetadataReference): {
    fileName: string;
    mediaUrl: string;
    mediaType: string;
    fileSize: number;
    metadata: Record<string, any>;
  } {
    return {
      fileName: ref.fileName,
      mediaUrl: ref.cdnUrl,
      mediaType: ref.category === 'audio' ? 'AUDIO' : (ref.category === 'image' ? 'IMAGE' : 'DOCUMENT'),
      fileSize: ref.sizeBytes,
      metadata: {
        storageKey: ref.storageKey,
        bucket: ref.bucket,
        provider: ref.provider,
        checksum: ref.checksum,
        duration: ref.duration,
        mimeType: ref.mimeType,
      },
    };
  }
}

export const objectStorageEngine = new ObjectStorageEngine();
