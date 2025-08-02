# Supabase Storage Setup Guide

## Current Issue
The file upload is failing because of Row Level Security (RLS) policies in Supabase Storage. Here's how to fix it:

## Step 1: Check Your Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Storage** in the left sidebar

## Step 2: Create the Documents Bucket (if it doesn't exist)

1. Click **Create a new bucket**
2. Set bucket name: `documents`
3. Choose **Public** (this allows public read access)
4. Click **Create bucket**

## Step 3: Configure Storage Policies

After creating the bucket, you need to set up RLS policies. Go to **Storage > Policies** and add these policies:

### Policy 1: Allow public read access
```sql
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'documents');
```

### Policy 2: Allow authenticated users to upload files
```sql
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated'
);
```

### Policy 3: Allow authenticated users to update their files
```sql
CREATE POLICY "Allow authenticated updates" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated'
);
```

### Policy 4: Allow authenticated users to delete their files
```sql
CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated'
);
```

## Step 4: Alternative - Disable RLS (for testing)

If you want to quickly test without setting up policies:

1. Go to **Storage > Policies**
2. Find the `documents` bucket
3. Click the toggle to **disable RLS** for this bucket
4. **Note**: This is not recommended for production

## Step 5: Test the Setup

After setting up the policies, test with:

1. Visit `/supabase-test` in your app
2. Visit `/simple-upload-test` to test file upload
3. Check the browser console for any errors

## Troubleshooting

### If you still get "bucket not found":
- Make sure the bucket name is exactly `documents` (lowercase)
- Check that you're in the correct Supabase project
- Verify your environment variables are correct

### If you get RLS policy errors:
- Make sure you've added the policies above
- Check that the bucket is set to "Public"
- Try disabling RLS temporarily for testing

### If file uploads fail:
- Check the browser console for specific error messages
- Verify the file size is under 10MB
- Make sure the file type is allowed

## Quick Test Commands

Run these to test your setup:

```bash
# Check buckets
node scripts/check-buckets.js

# Test file upload
npm run dev
# Then visit /simple-upload-test
```

## Next Steps

Once storage is working:
1. Test file upload on `/simple-upload-test`
2. Test policy creation with attachments on `/new_policy`
3. Verify files appear in your Supabase Storage dashboard 