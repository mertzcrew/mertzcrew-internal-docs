"use client"

import React, { useState, useEffect } from 'react'
import { supabase, STORAGE_BUCKET } from '../../components/lib/supabase'

export default function SupabaseTestPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [bucketInfo, setBucketInfo] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [allBuckets, setAllBuckets] = useState<any[]>([])

  useEffect(() => {
    checkSupabaseConnection()
  }, [])

  const checkSupabaseConnection = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('Testing Supabase connection...')
      console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log('Bucket:', STORAGE_BUCKET)

      // Test bucket access - try to list buckets first
      const { data, error } = await supabase.storage.listBuckets()
      
      if (error) {
        console.error('Error listing buckets:', error)
        console.log('This is normal - anon key may not have permission to list buckets')
        setAllBuckets([])
        
        // Even if we can't list buckets, try to access the specific bucket directly
        console.log('Trying direct bucket access...')
      } else {
        console.log('Available buckets:', data)
        setAllBuckets(data || [])
        
        // Check if our bucket exists in the list
        const bucketExists = data?.some(bucket => bucket.name === STORAGE_BUCKET)
        
        if (!bucketExists) {
          console.log(`Bucket '${STORAGE_BUCKET}' not found in list. Available buckets: ${data?.map(b => b.name).join(', ')}`)
          console.log('This is normal - anon key may not see all buckets')
          // Continue to try direct access anyway
        }
      }

      // Test listing files in the bucket
      const { data: files, error: filesError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list()

      if (filesError) {
        console.error('Error listing files:', filesError)
        setError(`Error accessing bucket '${STORAGE_BUCKET}': ${filesError.message}`)
        return
      }

      setBucketInfo({
        bucketName: STORAGE_BUCKET,
        exists: true,
        fileCount: files?.length || 0,
        files: files || [],
        accessible: true
      })

      // Test file upload
      console.log('Testing file upload...')
      const testContent = 'This is a test file from the web interface'
      const testFile = new Blob([testContent], { type: 'text/plain' })
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload('test-web-upload.txt', testFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload test failed:', uploadError)
        setError(`Upload test failed: ${uploadError.message}`)
        return
      }

      console.log('Upload test successful:', uploadData)

      // Clean up - delete the test file
      const { error: deleteError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove(['test-web-upload.txt'])

      if (deleteError) {
        console.log('Warning: Could not delete test file:', deleteError.message)
      } else {
        console.log('Test file cleaned up successfully')
      }

    } catch (err) {
      console.error('Error testing Supabase:', err)
      setError(`Error testing Supabase: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mt-4">
      <h1>Supabase Connection Test</h1>
      
      <div className="mb-4">
        <h3>Environment Variables</h3>
        <p><strong>NEXT_PUBLIC_SUPABASE_URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set'}</p>
        <p><strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'}</p>
        <p><strong>Storage Bucket:</strong> {STORAGE_BUCKET}</p>
      </div>

      {loading && (
        <div className="alert alert-info">
          Testing Supabase connection...
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          <strong>Error:</strong> {error}
        </div>
      )}

      {allBuckets.length > 0 && (
        <div className="alert alert-warning">
          <h4>Available Buckets:</h4>
          <ul>
            {allBuckets.map((bucket, index) => (
              <li key={index}>
                <strong>{bucket.name}</strong> - {bucket.public ? 'Public' : 'Private'}
              </li>
            ))}
          </ul>
          <p className="mt-2">
            <strong>Note:</strong> The code is looking for a bucket named &apos;{STORAGE_BUCKET}&apos;. 
            If you want to use a different bucket, update the STORAGE_BUCKET constant in components/lib/supabase.ts
          </p>
        </div>
      )}

      {bucketInfo && (
        <div className="alert alert-success">
          <h4>✅ Supabase Connection Successful!</h4>
          <p><strong>Bucket:</strong> {bucketInfo.bucketName}</p>
          <p><strong>File Count:</strong> {bucketInfo.fileCount}</p>
          {bucketInfo.files.length > 0 && (
            <div>
              <strong>Files:</strong>
              <ul>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {bucketInfo.files.map((file: any, index: number) => (
                  <li key={index}>{file.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <button 
        className="btn btn-primary" 
        onClick={checkSupabaseConnection}
        disabled={loading}
      >
        Test Connection Again
      </button>
    </div>
  )
} 