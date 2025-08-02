"use client"

import React from 'react'
import FileUploadExample from '../../components/ui/FileUploadExample'
import { FileUploadResult } from '../../components/lib/fileUpload'

export default function FileUploadTestPage() {
  const handleFileUploaded = (result: FileUploadResult) => {
    console.log('File uploaded successfully:', result)
    // You can save the file information to your database here
  }

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <h1 className="mb-4">File Upload Test</h1>
          <p className="text-muted mb-4">
            This page demonstrates the Supabase Storage file upload functionality.
            You can upload PDFs, Word documents, Excel files, and other supported formats.
          </p>
          
          <div className="row">
            <div className="col-md-8">
              <div className="card">
                <div className="card-body">
                  <FileUploadExample 
                    folder="test-uploads"
                    onFileUploaded={handleFileUploaded}
                  />
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Upload Information</h5>
                </div>
                <div className="card-body">
                  <h6>Supported File Types:</h6>
                  <ul className="list-unstyled">
                    <li>📄 PDF files (.pdf)</li>
                    <li>📝 Word documents (.doc, .docx)</li>
                    <li>📊 Excel spreadsheets (.xls, .xlsx)</li>
                    <li>📈 PowerPoint presentations (.ppt, .pptx)</li>
                    <li>📄 Text files (.txt)</li>
                    <li>📄 CSV files (.csv)</li>
                  </ul>
                  
                  <h6>File Size Limit:</h6>
                  <p className="text-muted">Maximum 10MB per file</p>
                  
                  <h6>Features:</h6>
                  <ul className="list-unstyled">
                    <li>✅ Drag & drop upload</li>
                    <li>✅ File validation</li>
                    <li>✅ Progress tracking</li>
                    <li>✅ File preview</li>
                    <li>✅ Download & delete</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 