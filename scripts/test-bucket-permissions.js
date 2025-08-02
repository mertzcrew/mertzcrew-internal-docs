// Test different bucket access methods
// Run this with: node scripts/test-bucket-permissions.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('=== Testing Bucket Permissions ===')
console.log('URL:', supabaseUrl)
console.log('Anon Key (first 20 chars):', supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'Not set')
console.log('')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testBucketPermissions() {
  try {
    console.log('1. Testing listBuckets()...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError)
    } else {
      console.log('✅ Successfully listed buckets')
      console.log('Buckets found:', buckets ? buckets.length : 0)
      if (buckets && buckets.length > 0) {
        buckets.forEach(bucket => {
          console.log(`  - ${bucket.name} (${bucket.public ? 'Public' : 'Private'})`)
        })
      } else {
        console.log('  No buckets visible to anon key')
      }
    }
    
    console.log('')
    console.log('2. Testing direct bucket access...')
    
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
    console.log('3. Testing file upload...')
    
    // Create a test file
    const testContent = 'This is a test file for permissions'
    const testFile = new Blob([testContent], { type: 'text/plain' })
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload('test-permissions.txt', testFile, {
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
        .remove(['test-permissions.txt'])
      
      if (deleteError) {
        console.log('⚠️  Warning: Could not delete test file:', deleteError.message)
      } else {
        console.log('✅ Successfully deleted test file')
      }
    }
    
    console.log('')
    console.log('4. Testing bucket info...')
    
    // Try to get bucket info
    const { data: bucketInfo, error: bucketInfoError } = await supabase.storage
      .getBucket('documents')
    
    if (bucketInfoError) {
      console.error('❌ Error getting bucket info:', bucketInfoError)
    } else {
      console.log('✅ Successfully got bucket info')
      console.log('Bucket info:', bucketInfo)
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

testBucketPermissions() 