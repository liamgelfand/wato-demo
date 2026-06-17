import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export interface StorageProvider {
  uploadFile(buffer: Buffer, filePath: string, contentType: string): Promise<string>
  deleteFile(filePath: string): Promise<void>
  getSignedUrl(filePath: string, expiresIn: number): Promise<string>
}

class LocalStorageProvider implements StorageProvider {
  private uploadsDir =
    process.env.UPLOADS_DIR?.trim() || path.join(process.cwd(), 'public', 'uploads')

  async uploadFile(buffer: Buffer, filePath: string, contentType: string): Promise<string> {
    await this.ensureUploadsDir()

    const fullPath = path.join(this.uploadsDir, filePath)
    const dir = path.dirname(fullPath)

    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true })
    }

    try {
      await writeFile(fullPath, buffer)
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code
      if (code === 'EACCES' || code === 'EPERM') {
        throw new Error(
          `Cannot write to uploads directory (${this.uploadsDir}). Check filesystem permissions.`
        )
      }
      throw error
    }
    
    // Return public URL path
    return `/uploads/${filePath}`
  }

  async deleteFile(filePath: string): Promise<void> {
    const fullPath = path.join(this.uploadsDir, filePath)
    
    try {
      await unlink(fullPath)
    } catch (error) {
      // Ignore if file doesn't exist
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error
      }
    }
  }

  async getSignedUrl(filePath: string, expiresIn: number): Promise<string> {
    // For local storage, just return the public URL (no signed URLs needed)
    return `/uploads/${filePath}`
  }

  private async ensureUploadsDir(): Promise<void> {
    if (!existsSync(this.uploadsDir)) {
      await mkdir(this.uploadsDir, { recursive: true })
    }
  }
}

class S3StorageProvider implements StorageProvider {
  private s3Client: S3Client
  private bucket: string

  constructor() {
    const region = process.env.AWS_S3_REGION || 'us-east-1'
    const endpoint = process.env.S3_ENDPOINT
    
    this.s3Client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
      forcePathStyle: !!endpoint, // Required for S3-compatible services like MinIO
    })
    
    this.bucket = process.env.AWS_S3_BUCKET || ''
    
    if (!this.bucket) {
      throw new Error('AWS_S3_BUCKET environment variable is required for S3 storage')
    }
  }

  async uploadFile(buffer: Buffer, filePath: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: filePath,
      Body: buffer,
      ContentType: contentType,
    })

    await this.s3Client.send(command)
    
    // Return the S3 URL or custom endpoint URL
    if (process.env.S3_ENDPOINT) {
      return `${process.env.S3_ENDPOINT}/${this.bucket}/${filePath}`
    }
    
    return `https://${this.bucket}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${filePath}`
  }

  async deleteFile(filePath: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: filePath,
    })

    await this.s3Client.send(command)
  }

  async getSignedUrl(filePath: string, expiresIn: number): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: filePath,
    })

    return await getSignedUrl(this.s3Client, command, { expiresIn })
  }
}

// Factory function to get the appropriate storage provider
export function getStorageProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER || 'local'
  
  switch (provider.toLowerCase()) {
    case 's3':
      return new S3StorageProvider()
    case 'local':
    default:
      return new LocalStorageProvider()
  }
}

// Singleton instance
let storageInstance: StorageProvider | null = null

export function storage(): StorageProvider {
  if (!storageInstance) {
    storageInstance = getStorageProvider()
  }
  return storageInstance
}
