"use client"

import React, { useState } from 'react'
import { Upload, X, FileText, AlertCircle, CheckCircle, Trash2, Download, ExternalLink } from 'lucide-react'
import { useFileUpload } from '../lib/useFileUpload'
import { FileUploadResult, formatFileSize, getFileIcon } from '../lib/fileUpload'
import { useSession } from 'next-auth/react'

interface PolicyAttachment {
  fileName: string
  filePath: string
  fileUrl: string
  fileSize: number
  fileType: string
  uploadedBy?: string
  uploadedAt: Date | string
  description?: string
}

interface PolicyFileUploadProps {
  attachments: PolicyAttachment[]
  onAttachmentsChange: (attachments: PolicyAttachment[]) => void
  disabled?: boolean
  className?: string
}

export default function PolicyFileUpload({
  attachments,
  onAttachmentsChange,
  disabled = false,
  className = ''
}: PolicyFileUploadProps) {
  const { data: session, status } = useSession()
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set())
  const [uploadedFiles, setUploadedFiles] = useState<Map<string, PolicyAttachment>>(new Map())

  console.log('=== PolicyFileUpload RENDER ===')
  console.log('Props:', { attachments, disabled, className })
  console.log('State:', { selectedFiles: selectedFiles.length, uploadingFiles: uploadingFiles.size })
  console.log('Session:', { status, user: session?.user?.email })

  const { uploadFile, isUploading, error, clearError } = useFileUpload()

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return
    
    const newFiles = Array.from(files)
    console.log('=== FILE SELECTION ===')
    console.log('PolicyFileUpload - Files selected:', newFiles.map(f => ({ name: f.name, size: f.size, type: f.type })))
    
    // Check if user is authenticated
    if (!session || status !== 'authenticated') {
      console.error('User must be authenticated to upload files')
      alert('You must be logged in to upload files')
      return
    }

    // Upload each file immediately
    for (const file of newFiles) {
      console.log('Auto-uploading file:', file.name);
      setUploadingFiles(prev => new Set(prev).add(file.name))
      
      try {
        const result = await uploadFile(file, 'policies')
        console.log('Auto-upload result for', file.name, ':', result);
        
        if (result.success && result.filePath && result.fileUrl) {
          console.log('✅ Auto-upload successful for file:', file.name);
          
          // Create attachment directly from the result
          const newAttachment: PolicyAttachment = {
            fileName: file.name,
            filePath: result.filePath,
            fileUrl: result.fileUrl,
            fileSize: file.size,
            fileType: file.type,
            uploadedAt: new Date().toISOString()
            // Note: uploadedBy will be set by the API when the policy is saved
          }
          
          console.log('Created attachment:', newAttachment);
          console.log('Current attachments before update:', attachments);
          
          const updatedAttachments = [...attachments, newAttachment];
          console.log('Updated attachments array:', updatedAttachments);
          
          console.log('Calling onAttachmentsChange with:', updatedAttachments);
          onAttachmentsChange(updatedAttachments)
          
          console.log('onAttachmentsChange called successfully');
        } else {
          console.error('❌ Auto-upload failed for', file.name, ':', result);
        }
      } catch (error) {
        console.error('Error auto-uploading file:', file.name, error);
      } finally {
        setUploadingFiles(prev => {
          const newSet = new Set(prev)
          newSet.delete(file.name)
          return newSet
        })
      }
    }
    
    clearError()
  }

  const handleRemoveSelectedFile = (fileToRemove: File) => {
    setSelectedFiles(prev => prev.filter(f => f !== fileToRemove))
  }

  const handleUploadSelectedFiles = async () => {
    console.log('=== UPLOAD PROCESS START ===');
    console.log('Selected files count:', selectedFiles.length);
    console.log('Selected files:', selectedFiles);
    console.log('Current attachments:', attachments);
    console.log('User session:', session);
    console.log('Authentication status:', status);
    
    // Check if user is authenticated
    if (!session || status !== 'authenticated') {
      console.error('User must be authenticated to upload files')
      alert('You must be logged in to upload files')
      return
    }

    if (selectedFiles.length === 0) {
      console.error('No files selected for upload')
      alert('Please select files to upload')
      return
    }
    
    for (const file of selectedFiles) {
      console.log('Uploading file:', file.name);
      setUploadingFiles(prev => new Set(prev).add(file.name))
      
      try {
        const result = await uploadFile(file, 'policies')
        console.log('Upload result for', file.name, ':', result);
        
        if (result.success && result.filePath && result.fileUrl) {
          console.log('✅ Upload successful for file:', file.name);
          
          // Create attachment directly from the result
          const newAttachment: PolicyAttachment = {
            fileName: file.name,
            filePath: result.filePath,
            fileUrl: result.fileUrl,
            fileSize: file.size,
            fileType: file.type,
            uploadedAt: new Date().toISOString()
            // Note: uploadedBy will be set by the API when the policy is saved
          }
          
          console.log('Created attachment:', newAttachment);
          console.log('Current attachments before update:', attachments);
          
          const updatedAttachments = [...attachments, newAttachment];
          console.log('Updated attachments array:', updatedAttachments);
          
          console.log('Calling onAttachmentsChange with:', updatedAttachments);
          onAttachmentsChange(updatedAttachments)
          
          console.log('onAttachmentsChange called successfully');
        } else {
          console.error('❌ Upload failed for', file.name, ':', result);
        }
      } catch (error) {
        console.error('Error uploading file:', file.name, error);
      } finally {
        setUploadingFiles(prev => {
          const newSet = new Set(prev)
          newSet.delete(file.name)
          return newSet
        })
      }
    }
    
    console.log('=== UPLOAD PROCESS END ===');
    console.log('Final attachments state:', attachments);
    
    // Clear selected files after upload attempt
    setSelectedFiles([])
  }

  const handleRemoveAttachment = async (attachment: PolicyAttachment) => {
    try {
      const response = await fetch('/api/files/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath: attachment.filePath
        }),
      })

      if (response.ok) {
        onAttachmentsChange(attachments.filter(a => a.filePath !== attachment.filePath))
      } else {
        console.error('Failed to delete file')
      }
    } catch (error) {
      console.error('Error deleting file:', error)
    }
  }

  const handleDownload = (attachment: PolicyAttachment) => {
    const link = document.createElement('a')
    link.href = attachment.fileUrl
    link.download = attachment.fileName
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleOpenInNewTab = (attachment: PolicyAttachment) => {
    window.open(attachment.fileUrl, '_blank')
  }

  const hasSelectedFiles = selectedFiles.length > 0
  const hasAttachments = attachments.length > 0

  return (
    <div className={`policy-file-upload ${className}`}>
      <div className="upload-section">
        <h5 className="mb-3">Attachments</h5>
        <p className="text-muted small mb-3">
          Select PDFs, Word documents, Excel files, and other supported formats. 
          Files will be uploaded automatically when selected. You can select multiple files.
        </p>
        
        {status === 'loading' && (
          <div className="alert alert-info">
            Checking authentication...
          </div>
        )}
        
        {status === 'unauthenticated' && (
          <div className="alert alert-warning">
            You must be logged in to upload files.
          </div>
        )}

        {/* File Input */}
        <div className="file-input-container mb-3">
                      <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
              onChange={(e) => handleFileSelect(e.target.files)}
              disabled={disabled || status !== 'authenticated'}
              style={{ display: 'none' }}
              id="policy-file-input"
            />
          <label 
            htmlFor="policy-file-input" 
            className={`file-input-label ${disabled || status !== 'authenticated' ? 'disabled' : ''}`}
          >
            <Upload size={20} />
            <span>Select Files (Auto-upload)</span>
          </label>
        </div>

        {/* Upload Progress */}
        {uploadingFiles.size > 0 && (
          <div className="upload-progress mb-3">
            <div className="alert alert-info">
              <div className="d-flex align-items-center">
                <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                <span>Uploading {uploadingFiles.size} file{uploadingFiles.size > 1 ? 's' : ''}...</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Existing Attachments */}
      {hasAttachments && (
        <div className="attachments-section">
          <h6 className="mb-3">Uploaded Files:</h6>
          <div className="attachments-list">
            {attachments.map((attachment, index) => (
              <div key={index} className="attachment-item">
                <div className="attachment-info">
                  <span className="file-icon">{getFileIcon(attachment.fileType)}</span>
                  <div className="attachment-details">
                    <span className="file-name">{attachment.fileName}</span>
                    <span className="file-size">{formatFileSize(attachment.fileSize)}</span>
                    <span className="upload-date">
                      {new Date(attachment.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="attachment-actions">
                  <button
                    type="button"
                    className="action-btn download-btn"
                    onClick={() => handleDownload(attachment)}
                    title="Download file"
                  >
                    <Download size={16} />
                  </button>
                  
                  <button
                    type="button"
                    className="action-btn open-btn"
                    onClick={() => handleOpenInNewTab(attachment)}
                    title="Open in new tab"
                  >
                    <ExternalLink size={16} />
                  </button>

                  <button
                    type="button"
                    className="action-btn delete-btn"
                    onClick={() => handleRemoveAttachment(attachment)}
                    title="Delete file"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .policy-file-upload {
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 1.5rem;
          background-color: #f9fafb;
        }

        .file-input-container {
          text-align: center;
        }

        .file-input-label {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background-color: #ffffff;
          border: 2px dashed #d1d5db;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #374151;
          font-weight: 500;
        }

        .file-input-label:hover:not(.disabled) {
          border-color: #3b82f6;
          background-color: #eff6ff;
          color: #3b82f6;
        }

        .file-input-label.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .selected-files {
          background-color: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 1rem;
        }

        .selected-file-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem;
          border-bottom: 1px solid #f3f4f6;
        }

        .selected-file-item:last-child {
          border-bottom: none;
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

        .file-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .file-name {
          font-weight: 500;
          color: #374151;
        }

        .file-size {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .uploading-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #3b82f6;
          font-size: 0.875rem;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #3b82f6;
          border-top: 2px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .remove-btn {
          background: none;
          border: none;
          color: #ef4444;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 4px;
          transition: background-color 0.2s ease;
        }

        .remove-btn:hover:not(:disabled) {
          background-color: #fef2f2;
        }

        .remove-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #ef4444;
          font-size: 0.875rem;
          padding: 0.75rem;
          background-color: #fef2f2;
          border-radius: 6px;
          border: 1px solid #fecaca;
        }

        .attachments-section {
          margin-top: 1.5rem;
        }

        .attachments-list {
          background-color: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          overflow: hidden;
        }

        .attachment-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          border-bottom: 1px solid #f3f4f6;
        }

        .attachment-item:last-child {
          border-bottom: none;
        }

        .attachment-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex: 1;
        }

        .attachment-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .upload-date {
          font-size: 0.75rem;
          color: #9ca3af;
        }

        .attachment-actions {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          background: none;
          border: none;
          padding: 0.5rem;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .download-btn {
          color: #3b82f6;
        }

        .download-btn:hover {
          background-color: #eff6ff;
        }

        .open-btn {
          color: #10b981;
        }

        .open-btn:hover {
          background-color: #f0fdf4;
        }

        .delete-btn {
          color: #ef4444;
        }

        .delete-btn:hover {
          background-color: #fef2f2;
        }
      `}</style>
    </div>
  )
} 