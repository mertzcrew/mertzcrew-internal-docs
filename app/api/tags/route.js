import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '../../../components/lib/mongodb';
import Policy from '../../../models/Policy';

// GET all unique tags from policies
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

    // Aggregate to get all unique tags
    const pipeline = [
      // Unwind the tags array to get individual tags
      { $unwind: '$tags' },
      // Group by tag to get unique tags
      { $group: { _id: '$tags' } },
      // Sort alphabetically
      { $sort: { _id: 1 } },
      // Project to get just the tag name
      { $project: { tag: '$_id', _id: 0 } }
    ];

    // Add text search if query is provided
    if (query.trim()) {
      pipeline.unshift({
        $match: {
          tags: { $regex: query, $options: 'i' }
        }
      });
    }

    const tags = await Policy.aggregate(pipeline);

    // Extract just the tag names
    const tagNames = tags.map(item => item.tag);

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