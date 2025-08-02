"use client"

import React, { useState } from 'react'
import { AlertCircle, CheckCircle, Upload } from 'lucide-react'
import FileUpload from './FileUpload'
import FileViewer from './FileViewer'
import { useFileUpload } from '../lib/useFileUpload'
import { FileUploadResult } from '../lib/fileUpload'

interface FileUploadExampleProps {
  folder?: string
  onFileUploaded?: (result: FileUploadResult) => void
  className?: string
}

export default function FileUploadExample({
  folder = 'general',
  onFileUploaded,
  className = ''
}: FileUploadExampleProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadedFile, setUploadedFile] = useState<{
    fileName: string
    fileUrl: string
    fileSize: number
    fileType: string
  } | null>(null)

  const { uploadFile, isUploading, progress, error, clearError } = useFileUpload({
    onSuccess: (result) => {
      if (result.filePath && result.fileUrl && selectedFile) {
        setUploadedFile({
          fileName: selectedFile.name,
          fileUrl: result.fileUrl,
          fileSize: selectedFile.size,
          fileType: selectedFile.type
        })
        onFileUploaded?.(result)
      }
    },
    onError: (errorMessage) => {
      console.error('Upload error:', errorMessage)
    }
  })

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    clearError()
  }

  const handleFileRemove = () => {
    setSelectedFile(null)
    setUploadedFile(null)
    clearError()
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    await uploadFile(selectedFile, folder)
  }

  const handleDeleteUploadedFile = async () => {
    if (!uploadedFile) return

    try {
      const response = await fetch('/api/files/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath: uploadedFile.fileUrl.split('/').pop() // Extract file path from URL
        }),
      })

      if (response.ok) {
        setUploadedFile(null)
        setSelectedFile(null)
      } else {
        console.error('Failed to delete file')
      }
    } catch (error) {
      console.error('Error deleting file:', error)
    }
  }

  return (
    <div className={`file-upload-example ${className}`}>
      <div className="upload-section">
        <h3>Upload Document</h3>
        <p className="section-description">
          Upload PDFs, Word documents, Excel files, and other supported formats.
        </p>

        <FileUpload
          onFileSelect={handleFileSelect}
          onFileRemove={handleFileRemove}
          selectedFile={selectedFile}
          folder={folder}
          disabled={isUploading}
        />

        {selectedFile && !uploadedFile && (
          <div className="upload-actions">
            <button
              type="button"
              className="btn btn-primary upload-btn"
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <div className="spinner"></div>
                  Uploading... {progress}%
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Upload File
                </>
              )}
            </button>
          </div>
        )}

        {error && (
          <div className="error-alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {isUploading && (
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="progress-text">{progress}%</span>
          </div>
        )}
      </div>

      {uploadedFile && (
        <div className="uploaded-file-section">
          <div className="success-message">
            <CheckCircle size={16} />
            <span>File uploaded successfully!</span>
          </div>
          
          <FileViewer
            fileName={uploadedFile.fileName}
            fileUrl={uploadedFile.fileUrl}
            fileSize={uploadedFile.fileSize}
            fileType={uploadedFile.fileType}
            onDelete={handleDeleteUploadedFile}
            showDelete={true}
          />
        </div>
      )}

      <style jsx>{`
        .file-upload-example {
          max-width: 600px;
          margin: 0 auto;
        }

        .upload-section {
          margin-bottom: 2rem;
        }

        .upload-section h3 {
          margin: 0 0 0.5rem 0;
          color: #374151;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .section-description {
          margin: 0 0 1.5rem 0;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .upload-actions {
          margin-top: 1rem;
          display: flex;
          gap: 0.75rem;
        }

        .upload-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .upload-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #ffffff;
          border-top: 2px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-alert {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #ef4444;
          font-size: 0.875rem;
          margin-top: 1rem;
          padding: 0.75rem;
          background-color: #fef2f2;
          border-radius: 6px;
          border: 1px solid #fecaca;
        }

        .progress-container {
          margin-top: 1rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .progress-bar {
          flex: 1;
          height: 8px;
          background-color: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background-color: #3b82f6;
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 0.875rem;
          color: #6b7280;
          min-width: 40px;
        }

        .uploaded-file-section {
          margin-top: 2rem;
        }

        .success-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #10b981;
          font-size: 0.875rem;
          margin-bottom: 1rem;
          padding: 0.75rem;
          background-color: #f0fdf4;
          border-radius: 6px;
          border: 1px solid #bbf7d0;
        }
      `}</style>
    </div>
  )
} 