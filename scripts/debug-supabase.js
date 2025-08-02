// Comprehensive Supabase debug script
// Run this with: node scripts/debug-supabase.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('=== Supabase Debug Information ===')
console.log('URL:', supabaseUrl)
console.log('Anon Key (first 20 chars):', supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'Not set')
console.log('')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugSupabase() {
  try {
    console.log('1. Testing basic connection...')
    
    // Test basic connection by trying to get user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('User:', user ? 'Authenticated' : 'Not authenticated')
    if (userError) console.log('User error:', userError.message)
    
    console.log('')
    console.log('2. Testing storage connection...')
    
    // Test storage connection
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError)
      console.log('Error details:', {
        message: bucketsError.message,
        status: bucketsError.status,
        statusCode: bucketsError.statusCode
      })
    } else {
      console.log('✅ Successfully connected to storage')
      console.log('Available buckets:', buckets ? buckets.length : 0)
      
      if (buckets && buckets.length > 0) {
        buckets.forEach(bucket => {
          console.log(`  - ${bucket.name} (${bucket.public ? 'Public' : 'Private'})`)
        })
      } else {
        console.log('  No buckets found')
      }
    }
    
    console.log('')
    console.log('3. Testing documents bucket specifically...')
    
    // Try to access documents bucket directly
    const { data: files, error: filesError } = await supabase.storage
      .from('documents')
      .list()
    
    if (filesError) {
      console.error('❌ Error accessing documents bucket:', filesError)
      console.log('Error details:', {
        message: filesError.message,
        status: filesError.status,
        statusCode: filesError.statusCode
      })
    } else {
      console.log('✅ Successfully accessed documents bucket')
      console.log('Files in bucket:', files ? files.length : 0)
      if (files && files.length > 0) {
        files.forEach(file => {
          console.log(`  - ${file.name} (${file.metadata?.size || 'unknown size'} bytes)`)
        })
      }
    }
    
    console.log('')
    console.log('4. Testing file upload permission...')
    
    // Create a test file
    const testContent = 'This is a test file for debugging'
    const testFile = new Blob([testContent], { type: 'text/plain' })
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload('test-debug.txt', testFile, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (uploadError) {
      console.error('❌ Error uploading test file:', uploadError)
      console.log('Error details:', {
        message: uploadError.message,
        status: uploadError.status,
        statusCode: uploadError.statusCode
      })
    } else {
      console.log('✅ Successfully uploaded test file')
      console.log('Upload data:', uploadData)
      
      // Clean up - delete the test file
      const { error: deleteError } = await supabase.storage
        .from('documents')
        .remove(['test-debug.txt'])
      
      if (deleteError) {
        console.log('Warning: Could not delete test file:', deleteError.message)
      } else {
        console.log('✅ Successfully deleted test file')
      }
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

debugSupabase() 