import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { uploadFile } from '../../../../components/lib/fileUpload'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'general'
    const customFileName = formData.get('customFileName') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Upload file
    const result = await uploadFile(file, folder, customFileName)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      filePath: result.filePath,
      fileUrl: result.fileUrl
    })
  } catch (error) {
    console.error('File upload API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 