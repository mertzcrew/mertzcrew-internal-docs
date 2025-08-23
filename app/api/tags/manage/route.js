import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '../../../../components/lib/mongodb';
import Tag from '../../../../models/Tag';

// GET all tags for management
export async function GET(request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const tags = await Tag.find({ is_active: true })
      .sort({ usage_count: -1, name: 1 })
      .select('name color description usage_count created_at');

    return NextResponse.json(
      { success: true, data: tags },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create new tag
export async function POST(request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, color, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, message: 'Tag name is required' },
        { status: 400 }
      );
    }

    if (!color || !/^#[0-9A-F]{6}$/i.test(color)) {
      return NextResponse.json(
        { success: false, message: 'Valid color is required' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim().toLowerCase();
    
    // Check if tag already exists
    const existingTag = await Tag.findOne({ name: trimmedName });
    if (existingTag) {
      return NextResponse.json(
        { success: false, message: 'Tag already exists' },
        { status: 400 }
      );
    }

    const tag = new Tag({
      name: trimmedName,
      color,
      description: description?.trim() || undefined,
      created_by: session.user.id,
      usage_count: 0
    });

    await tag.save();

    return NextResponse.json(
      { 
        success: true, 
        data: {
          _id: tag._id,
          name: tag.name,
          color: tag.color,
          description: tag.description,
          usage_count: tag.usage_count,
          created_at: tag.createdAt
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating tag:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 