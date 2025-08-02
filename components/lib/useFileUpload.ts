import { useState, useCallback } from 'react'
import { FileUploadResult, uploadFile as uploadFileDirect } from './fileUpload'

interface UseFileUploadOptions {
  onSuccess?: (result: FileUploadResult) => void
  onError?: (error: string) => void
  onProgress?: (progress: number) => void
}

interface UseFileUploadReturn {
  uploadFile: (file: File, folder?: string, customFileName?: string) => Promise<FileUploadResult>
  isUploading: boolean
  progress: number
  error: string | null
  clearError: () => void
}

export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const uploadFile = useCallback(async (
    file: File,
    folder: string = 'general',
    customFileName?: string
  ): Promise<FileUploadResult> => {
    setIsUploading(true)
    setProgress(0)
    setError(null)

    try {
      console.log('useFileUpload - Starting upload for file:', file.name);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 100)

      // Use direct Supabase upload instead of API endpoint
      const result = await uploadFileDirect(file, folder, customFileName)

      clearInterval(progressInterval)
      setProgress(100)

      console.log('useFileUpload - Upload result:', result);
      
      if (result.success) {
        options.onSuccess?.(result)
        return result
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      console.error('useFileUpload - Error:', errorMessage);
      setError(errorMessage)
      options.onError?.(errorMessage)
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setIsUploading(false)
      // Reset progress after a delay
      setTimeout(() => setProgress(0), 1000)
    }
  }, [options])

  return {
    uploadFile,
    isUploading,
    progress,
    error,
    clearError
  }
} 