'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Upload, X, Image as ImageIcon, Video, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { resolveProofMimeType } from '@/lib/proof-files'

interface ProofUploaderProps {
  attemptId: string
}

export function ProofUploader({ attemptId }: ProofUploaderProps) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback((selectedFile: File) => {
    const mimeType = resolveProofMimeType(selectedFile.name, selectedFile.type)
    if (!mimeType) {
      toast.error('Invalid file type. Please upload an image or video.')
      return
    }
    if (selectedFile.size > 50 * 1024 * 1024) {
      toast.error('File is too large. Maximum size is 50MB.')
      return
    }

    setFile(selectedFile)
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result as string)
    reader.readAsDataURL(selectedFile)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) processFile(selectedFile)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) processFile(droppedFile)
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('attemptId', attemptId)

      const response = await fetch('/api/attempts/upload-proof', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Upload failed')
      }

      toast.success('Proof uploaded! Waiting for moderator review.')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed')
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setFile(null)
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const isVideo = file?.type.startsWith('video/')

  return (
    <div className="space-y-4">
      {!file ? (
        <Card
          className={`border-2 border-dashed transition-colors cursor-pointer ${
            dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center p-12">
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Upload Proof</p>
            <p className="text-sm text-muted-foreground mb-4">
              Click or drag and drop your file here
            </p>
            <p className="text-xs text-muted-foreground">
              Images (JPG, PNG, GIF, WebP) or Videos (MP4, MOV, WebM) up to 50MB
            </p>
          </div>
        </Card>
      ) : (
        <Card className="p-4">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              {isVideo ? (
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                  <video src={preview || undefined} controls className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                  <img src={preview || undefined} alt="Proof preview" className="w-full h-full object-contain" />
                </div>
              )}
              <div className="mt-2 flex items-center gap-2 text-sm">
                {isVideo ? (
                  <Video className="h-4 w-4 text-primary" />
                ) : (
                  <ImageIcon className="h-4 w-4 text-primary" />
                )}
                <span className="font-medium">{file.name}</span>
                <span className="text-muted-foreground">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemove}
              disabled={uploading}
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {file && (
        <Button onClick={handleUpload} disabled={uploading} className="w-full" size="lg">
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            'Submit for Verification'
          )}
        </Button>
      )}
    </div>
  )
}
