# Supabase Storage Setup Guide

This guide will help you set up Supabase Storage for handling file uploads in your Next.js application.

## Prerequisites

1. A Supabase project (create one at [supabase.com](https://supabase.com))
2. Your Supabase project URL and anon key

## Step 1: Environment Variables

Create or update your `.env.local` file in the root of your project:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace `your_supabase_project_url` and `your_supabase_anon_key` with your actual Supabase credentials.

## Step 2: Create Storage Bucket

1. Go to your Supabase dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Set the bucket name to `documents` (or update the `STORAGE_BUCKET` constant in `components/lib/supabase.ts`)
5. Choose **Public** for public access (files will be publicly accessible)
6. Click **Create bucket**

## Step 3: Configure Storage Policies

In your Supabase dashboard, go to **Storage > Policies** and add the following policies:

### For the `documents` bucket:

#### Policy 1: Allow authenticated users to upload files
```sql
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated'
);
```

#### Policy 2: Allow public read access
```sql
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'documents');
```

#### Policy 3: Allow authenticated users to delete their files
```sql
CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated'
);
```

## Step 4: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to a page where you want to use file uploads

3. Import and use the `FileUploadExample` component:
   ```tsx
   import FileUploadExample from '../components/ui/FileUploadExample'
   
   export default function YourPage() {
     return (
       <div>
         <h1>File Upload Test</h1>
         <FileUploadExample 
           folder="test"
           onFileUploaded={(result) => {
             console.log('File uploaded:', result)
           }}
         />
       </div>
     )
   }
   ```

## Step 5: Integration with Your Models

To store file references in your MongoDB models, update your schemas to include file information:

### Example: Update Policy Model

```javascript
// models/Policy.js
const policySchema = new mongoose.Schema({
  // ... existing fields
  attachments: [{
    fileName: String,
    filePath: String,
    fileUrl: String,
    fileSize: Number,
    fileType: String,
    uploadedAt: { type: Date, default: Date.now }
  }]
})
```

### Example: Update Document Model

```javascript
// models/Document.js
const documentSchema = new mongoose.Schema({
  // ... existing fields
  file: {
    fileName: String,
    filePath: String,
    fileUrl: String,
    fileSize: Number,
    fileType: String,
    uploadedAt: { type: Date, default: Date.now }
  }
})
```

## Usage Examples

### Basic File Upload
```tsx
import { useFileUpload } from '../components/lib/useFileUpload'

function MyComponent() {
  const { uploadFile, isUploading, error } = useFileUpload({
    onSuccess: (result) => {
      console.log('Upload successful:', result.fileUrl)
    }
  })

  const handleFileSelect = async (file: File) => {
    await uploadFile(file, 'policies')
  }

  return (
    <FileUpload onFileSelect={handleFileSelect} />
  )
}
```

### File Upload with Custom Hook
```tsx
import { useFileUpload } from '../components/lib/useFileUpload'

function MyComponent() {
  const { uploadFile, isUploading, progress } = useFileUpload()

  const handleUpload = async (file: File) => {
    const result = await uploadFile(file, 'documents', 'custom-name')
    if (result.success) {
      // Save file info to database
      await saveFileToDatabase(result)
    }
  }

  return (
    <div>
      {isUploading && <div>Uploading... {progress}%</div>}
      {/* Your upload UI */}
    </div>
  )
}
```

## Supported File Types

The system supports the following file types:
- PDF files (.pdf)
- Word documents (.doc, .docx)
- Excel spreadsheets (.xls, .xlsx)
- PowerPoint presentations (.ppt, .pptx)
- Text files (.txt)
- CSV files (.csv)

## File Size Limits

- Maximum file size: 10MB (configurable in `components/lib/fileUpload.ts`)
- You can adjust this limit by modifying the `MAX_FILE_SIZE` constant

## Security Considerations

1. **File Validation**: All files are validated for type and size before upload
2. **Authentication**: Upload endpoints require authentication
3. **File Naming**: Files are renamed with timestamps to prevent conflicts
4. **Access Control**: Configure storage policies to control who can upload/access files

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Ensure your `.env.local` file has the correct Supabase URL and anon key
   - Restart your development server after adding environment variables

2. **"Upload failed"**
   - Check your Supabase storage policies
   - Verify the bucket name matches your configuration
   - Check the browser console for detailed error messages

3. **"File type not allowed"**
   - Verify the file type is in the `ALLOWED_FILE_TYPES` array
   - Check that the file extension is in the `ALLOWED_EXTENSIONS` array

4. **"File size too large"**
   - Reduce the file size or increase the `MAX_FILE_SIZE` limit
   - Consider implementing client-side compression for large files

### Getting Help

- Check the Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
- Review the browser console for error messages
- Verify your Supabase project settings and policies

## Next Steps

1. Integrate file uploads into your existing forms
2. Add file management features (rename, move, organize)
3. Implement file preview functionality
4. Add bulk upload capabilities
5. Set up file versioning if needed 