import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import dbConnect from '../../../components/lib/mongodb';
import Tag from '../../../models/Tag';

// GET tags with optional search query
export async function GET(request) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get query parameter for filtering
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    let tags;
    
    if (query.trim()) {
      // Use the searchTags static method
      tags = await Tag.searchTags(query.trim());
    } else {
      // Get all active tags sorted by usage count
      tags = await Tag.find({ is_active: true })
        .sort({ usage_count: -1, name: 1 })
        .limit(20);
    }

    // Extract just the tag names for backward compatibility
    const tagNames = tags.map(tag => tag.name);

    return NextResponse.json({
      success: true,
      data: tagNames
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 