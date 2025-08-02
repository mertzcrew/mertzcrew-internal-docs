import { supabase, STORAGE_BUCKET } from './supabase'

export interface FileUploadResult {
  success: boolean
  filePath?: string
  error?: string
  fileUrl?: string
}

export interface FileMetadata {
  name: string
  size: number
  type: string
  lastModified: number
}

// Allowed file types for document uploads
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv'
]

// File type extensions for validation
export const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.txt',
  '.csv'
]

// Maximum file size (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024

export function validateFile(file: File): { isValid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    }
  }

  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: 'File type not allowed. Please upload PDF, Word, Excel, PowerPoint, or text files.'
    }
  }

  // Check file extension
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
    return {
      isValid: false,
      error: 'File extension not allowed.'
    }
  }

  return { isValid: true }
}

export async function uploadFile(
  file: File,
  folder: string = 'general',
  customFileName?: string
): Promise<FileUploadResult> {
  try {
    console.log('uploadFile - Starting upload for file:', file.name);
    console.log('uploadFile - File size:', file.size);
    console.log('uploadFile - File type:', file.type);
    
    // Validate file
    const validation = validateFile(file)
    if (!validation.isValid) {
      console.log('uploadFile - Validation failed:', validation.error);
      return {
        success: false,
        error: validation.error
      }
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = '.' + file.name.split('.').pop()
    const fileName = customFileName 
      ? `${customFileName}_${timestamp}${fileExtension}`
      : `${file.name.replace(fileExtension, '')}_${timestamp}${fileExtension}`
    
    const filePath = `${folder}/${fileName}`
    console.log('uploadFile - Generated file path:', filePath);

    // Check Supabase configuration
    console.log('uploadFile - Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('uploadFile - Storage bucket:', STORAGE_BUCKET);

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('uploadFile - Upload error:', error)
      return {
        success: false,
        error: error.message
      }
    }

    console.log('uploadFile - Upload successful, data:', data);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath)

    console.log('uploadFile - Public URL data:', urlData);

    const result = {
      success: true,
      filePath: data.path,
      fileUrl: urlData.publicUrl
    };

    console.log('uploadFile - Returning result:', result);
    return result;
  } catch (error) {
    console.error('File upload error:', error)
    return {
      success: false,
      error: 'Failed to upload file'
    }
  }
}

export async function deleteFile(filePath: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath])

    if (error) {
      console.error('Delete error:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return { success: true }
  } catch (error) {
    console.error('File deletion error:', error)
    return {
      success: false,
      error: 'Failed to delete file'
    }
  }
}

export async function getFileUrl(filePath: string): Promise<string | null> {
  try {
    const { data } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath)

    return data.publicUrl
  } catch (error) {
    console.error('Get file URL error:', error)
    return null
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getFileIcon(fileType: string): string {
  switch (fileType) {
    case 'application/pdf':
      return '📄'
    case 'application/msword':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return '📝'
    case 'application/vnd.ms-excel':
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      return '📊'
    case 'application/vnd.ms-powerpoint':
    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      return '📈'
    case 'text/plain':
    case 'text/csv':
      return '📄'
    default:
      return '📎'
  }
} 