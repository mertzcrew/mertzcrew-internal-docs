// Script to check existing buckets and their policies
// Run this with: node scripts/check-buckets.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkBuckets() {
  try {
    console.log('Checking existing buckets...')
    
    // List all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError)
      return
    }

    console.log('✅ Available buckets:')
    buckets.forEach(bucket => {
      console.log(`- ${bucket.name} (${bucket.public ? 'Public' : 'Private'})`)
    })

    // Check if documents bucket exists
    const documentsBucket = buckets.find(b => b.name === 'documents')
    if (documentsBucket) {
      console.log('\n✅ Documents bucket found!')
      console.log('Bucket details:', documentsBucket)
      
      // Try to list files in the documents bucket
      console.log('\nTrying to list files in documents bucket...')
      const { data: files, error: filesError } = await supabase.storage
        .from('documents')
        .list()

      if (filesError) {
        console.error('❌ Error listing files:', filesError)
        console.log('\nThis suggests an RLS (Row Level Security) policy issue.')
        console.log('You need to configure storage policies in your Supabase dashboard.')
      } else {
        console.log('✅ Successfully listed files in documents bucket')
        console.log('Files:', files)
      }
    } else {
      console.log('\n❌ Documents bucket not found')
    }
    
  } catch (err) {
    console.error('Error:', err)
  }
}

checkBuckets() 