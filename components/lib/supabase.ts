import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Storage bucket name - you can change this to match your bucket name
export const STORAGE_BUCKET = 'documents'

// Debug Supabase configuration
console.log('Supabase configuration:')
console.log('URL:', supabaseUrl)
console.log('Bucket:', STORAGE_BUCKET)
console.log('Client created:', !!supabase) 