"use client"

import React, { useState, useRef, useCallback } from 'react'
import { Upload, X, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { 
  validateFile, 
  formatFileSize, 
  getFileIcon, 
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE 
} from '../lib/fileUpload'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  onFileRemove?: () => void
  selectedFile?: File | null
  folder?: string
  customFileName?: string
  disabled?: boolean
  className?: string
}

export default function FileUpload({
  onFileSelect,
  onFileRemove,
  selectedFile,
  folder = 'general',
  customFileName,
  disabled = false,
  className = ''
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileValidation = useCallback((file: File) => {
    const validation = validateFile(file)
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file')
      return false
    }
    setError(null)
    return true
  }, [])

  const handleFileSelect = useCallback((file: File) => {
    if (handleFileValidation(file)) {
      onFileSelect(file)
    }
  }, [handleFileValidation, onFileSelect])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleRemoveFile = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setError(null)
    onFileRemove?.()
  }, [onFileRemove])

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return (
    <div className={`file-upload-container ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_FILE_TYPES.join(',')}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      {!selectedFile ? (
        <div
          className={`upload-area ${isDragOver ? 'drag-over' : ''} ${disabled ? 'disabled' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={!disabled ? openFileDialog : undefined}
        >
          <Upload size={48} className="upload-icon" />
          <div className="upload-text">
            <h4>Drop your file here</h4>
            <p>or click to browse</p>
            <div className="file-types">
              <small>
                Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV
              </small>
              <br />
              <small>Max size: {formatFileSize(MAX_FILE_SIZE)}</small>
            </div>
          </div>
        </div>
      ) : (
        <div className="selected-file">
          <div className="file-info">
            <span className="file-icon">{getFileIcon(selectedFile.type)}</span>
            <div className="file-details">
              <h5>{selectedFile.name}</h5>
              <p>{formatFileSize(selectedFile.size)}</p>
            </div>
            <CheckCircle size={20} className="success-icon" />
          </div>
          <button
            type="button"
            className="remove-file-btn"
            onClick={handleRemoveFile}
            disabled={disabled}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="error-message">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <style jsx>{`
        .file-upload-container {
          width: 100%;
        }

        .upload-area {
          border: 2px dashed #d1d5db;
          border-radius: 8px;
          padding: 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          background-color: #f9fafb;
        }

        .upload-area:hover:not(.disabled) {
          border-color: #3b82f6;
          background-color: #eff6ff;
        }

        .upload-area.drag-over {
          border-color: #3b82f6;
          background-color: #eff6ff;
          transform: scale(1.02);
        }

        .upload-area.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .upload-icon {
          color: #6b7280;
          margin-bottom: 1rem;
        }

        .upload-text h4 {
          margin: 0 0 0.5rem 0;
          color: #374151;
          font-size: 1.125rem;
          font-weight: 600;
        }

        .upload-text p {
          margin: 0 0 1rem 0;
          color: #6b7280;
        }

        .file-types {
          color: #9ca3af;
        }

        .selected-file {
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 1rem;
          background-color: #f9fafb;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .file-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex: 1;
        }

        .file-icon {
          font-size: 1.5rem;
        }

        .file-details h5 {
          margin: 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }

        .file-details p {
          margin: 0;
          font-size: 0.75rem;
          color: #6b7280;
        }

        .success-icon {
          color: #10b981;
        }

        .remove-file-btn {
          background: none;
          border: none;
          color: #ef4444;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 4px;
          transition: background-color 0.2s ease;
        }

        .remove-file-btn:hover:not(:disabled) {
          background-color: #fef2f2;
        }

        .remove-file-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #ef4444;
          font-size: 0.875rem;
          margin-top: 0.5rem;
          padding: 0.5rem;
          background-color: #fef2f2;
          border-radius: 4px;
        }
      `}</style>
    </div>
  )
} 