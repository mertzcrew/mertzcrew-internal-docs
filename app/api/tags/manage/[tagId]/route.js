import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import dbConnect from '../../../../../components/lib/mongodb';
import Tag from '../../../../../models/Tag';
import Policy from '../../../../../models/Policy';

// PUT update tag
export async function PUT(request, { params }) {
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

    const { tagId } = params;
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

    const tag = await Tag.findById(tagId);
    if (!tag) {
      return NextResponse.json(
        { success: false, message: 'Tag not found' },
        { status: 404 }
      );
    }

    const trimmedName = name.trim().toLowerCase();
    
    // Check if new name conflicts with existing tag (excluding current tag)
    const existingTag = await Tag.findOne({ 
      name: trimmedName, 
      _id: { $ne: tagId } 
    });
    if (existingTag) {
      return NextResponse.json(
        { success: false, message: 'Tag name already exists' },
        { status: 400 }
      );
    }

    // Update tag
    tag.name = trimmedName;
    tag.color = color;
    tag.description = description?.trim() || undefined;
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
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating tag:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE tag
export async function DELETE(request, { params }) {
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

    const { tagId } = params;

    const tag = await Tag.findById(tagId);
    if (!tag) {
      return NextResponse.json(
        { success: false, message: 'Tag not found' },
        { status: 404 }
      );
    }

    // Remove tag from all policies that use it
    await Policy.updateMany(
      { tags: tagId },
      { $pull: { tags: tagId } }
    );

    // Also remove from pending_changes if they exist
    await Policy.updateMany(
      { 'pending_changes.tags': tagId },
      { $pull: { 'pending_changes.tags': tagId } }
    );

    // Delete the tag
    await Tag.findByIdAndDelete(tagId);

    return NextResponse.json(
      { success: true, message: 'Tag deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 