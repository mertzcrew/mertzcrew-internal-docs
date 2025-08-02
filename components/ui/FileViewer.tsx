"use client"

import React from 'react'
import { Download, ExternalLink, FileText, Trash2 } from 'lucide-react'
import { getFileIcon, formatFileSize } from '../lib/fileUpload'

interface FileViewerProps {
  fileName: string
  fileUrl: string
  fileSize?: number
  fileType?: string
  onDelete?: () => void
  showDelete?: boolean
  className?: string
}

export default function FileViewer({
  fileName,
  fileUrl,
  fileSize,
  fileType,
  onDelete,
  showDelete = false,
  className = ''
}: FileViewerProps) {
  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = fileName
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleOpenInNewTab = () => {
    window.open(fileUrl, '_blank')
  }

  const isImage = fileType?.startsWith('image/')
  const isPDF = fileType === 'application/pdf'

  return (
    <div className={`file-viewer ${className}`}>
      <div className="file-preview">
        {isImage ? (
          <img 
            src={fileUrl} 
            alt={fileName} 
            className="file-image"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : isPDF ? (
          <iframe
            src={fileUrl}
            title={fileName}
            className="file-pdf"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div className="file-placeholder">
            <span className="file-icon">{getFileIcon(fileType || '')}</span>
            <span className="file-name">{fileName}</span>
          </div>
        )}
      </div>

      <div className="file-info">
        <div className="file-details">
          <h5>{fileName}</h5>
          {fileSize && <p>{formatFileSize(fileSize)}</p>}
          {fileType && <p className="file-type">{fileType}</p>}
        </div>

        <div className="file-actions">
          <button
            type="button"
            className="action-btn download-btn"
            onClick={handleDownload}
            title="Download file"
          >
            <Download size={16} />
          </button>
          
          <button
            type="button"
            className="action-btn open-btn"
            onClick={handleOpenInNewTab}
            title="Open in new tab"
          >
            <ExternalLink size={16} />
          </button>

          {showDelete && onDelete && (
            <button
              type="button"
              className="action-btn delete-btn"
              onClick={onDelete}
              title="Delete file"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .file-viewer {
          border: 1px solid #d1d5db;
          border-radius: 8px;
          overflow: hidden;
          background-color: #ffffff;
        }

        .file-preview {
          background-color: #f9fafb;
          min-height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .file-image {
          max-width: 100%;
          max-height: 200px;
          object-fit: contain;
        }

        .file-pdf {
          width: 100%;
          height: 200px;
          border: none;
        }

        .file-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 2rem;
          text-align: center;
        }

        .file-icon {
          font-size: 3rem;
        }

        .file-name {
          font-size: 0.875rem;
          color: #6b7280;
          word-break: break-word;
          max-width: 200px;
        }

        .file-info {
          padding: 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .file-details {
          flex: 1;
          min-width: 0;
        }

        .file-details h5 {
          margin: 0 0 0.25rem 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          word-break: break-word;
        }

        .file-details p {
          margin: 0;
          font-size: 0.75rem;
          color: #6b7280;
        }

        .file-type {
          text-transform: uppercase;
          font-size: 0.625rem;
          letter-spacing: 0.05em;
        }

        .file-actions {
          display: flex;
          gap: 0.5rem;
          flex-shrink: 0;
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

        @media (max-width: 640px) {
          .file-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }

          .file-actions {
            width: 100%;
            justify-content: flex-end;
          }
        }
      `}</style>
    </div>
  )
} 