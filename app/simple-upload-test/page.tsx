"use client"

import React, { useState } from 'react'
import { uploadFile } from '../../components/lib/fileUpload'

export default function SimpleUploadTestPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setError(null)
      setUploadResult(null)
      console.log('File selected:', file.name, file.size, file.type)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    
    setIsUploading(true)
    setError(null)
    setUploadResult(null)
    
    try {
      console.log('Starting direct upload...')
      const result = await uploadFile(selectedFile, 'test')
      console.log('Upload completed:', result)
      
      if (result.success) {
        setUploadResult(result)
      } else {
        setError(result.error || 'Upload failed')
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="container mt-4">
      <h1>Simple Upload Test</h1>
      <p>This page tests the basic file upload functionality without any complex components.</p>
      
      <div className="mb-3">
        <label className="form-label">Select a file:</label>
        <input
          type="file"
          className="form-control"
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
        />
      </div>

      {selectedFile && (
        <div className="mb-3">
          <p><strong>Selected file:</strong> {selectedFile.name}</p>
          <p><strong>Size:</strong> {selectedFile.size} bytes</p>
          <p><strong>Type:</strong> {selectedFile.type}</p>
        </div>
      )}

      <div className="mb-3">
        <button
          className="btn btn-primary"
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload File'}
        </button>
      </div>

      {error && (
        <div className="alert alert-danger">
          <strong>Error:</strong> {error}
        </div>
      )}

      {uploadResult && (
        <div className="alert alert-success">
          <strong>Upload successful!</strong>
          <pre>{JSON.stringify(uploadResult, null, 2)}</pre>
        </div>
      )}

      <div className="mt-4">
        <h3>Environment Check</h3>
        <p><strong>NEXT_PUBLIC_SUPABASE_URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set'}</p>
        <p><strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'}</p>
      </div>
    </div>
  )
} 