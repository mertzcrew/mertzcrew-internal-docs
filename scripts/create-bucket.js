// Script to create the documents bucket in Supabase
// Run this with: node scripts/create-bucket.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createBucket() {
  try {
    console.log('Creating documents bucket...')
    
    const { data, error } = await supabase.storage.createBucket('documents', {
      public: true,
      allowedMimeTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv'
      ]
    })

    if (error) {
      console.error('Error creating bucket:', error)
      return
    }

    console.log('✅ Bucket created successfully!')
    console.log('Bucket data:', data)
    
  } catch (err) {
    console.error('Error:', err)
  }
}

createBucket() 