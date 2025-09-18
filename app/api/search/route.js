import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import dbConnect from '../../../components/lib/mongodb';
import Policy from '../../../models/Policy';
import User from '../../../models/User';
import Tag from '../../../models/Tag';

// GET /api/search - Global search for policies
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

    // Find the user by email
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;

    if (!query.trim()) {
      return NextResponse.json({
        success: true,
        data: {
          policies: [],
          pagination: {
            page,
            limit,
            totalCount: 0,
            totalPages: 0
          }
        }
      }, { status: 200 });
    }

    const skip = (page - 1) * limit;

    // Find matching tags for the search query
    const matchingTags = await Tag.find({
      name: { $regex: query, $options: 'i' }
    }).select('_id');

    const matchingTagIds = matchingTags.map(tag => tag._id);

    // Build search query based on user permissions
    let searchQuery = {};

    if (user.role === 'admin') {
      // Admins can search all policies (published and unpublished)
      searchQuery = {
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { content: { $regex: query, $options: 'i' } },
          { category: { $regex: query, $options: 'i' } },
          ...(matchingTagIds.length > 0 ? [{ tags: { $in: matchingTagIds } }] : [])
        ]
      };
    } else {
      // Non-admin users can search:
      // 1. Published policies with organization "all" or matching their organization
      // 2. Unpublished policies assigned to them
      searchQuery = {
        $and: [
          {
            $or: [
              { title: { $regex: query, $options: 'i' } },
              { description: { $regex: query, $options: 'i' } },
              { content: { $regex: query, $options: 'i' } },
              { category: { $regex: query, $options: 'i' } },
              ...(matchingTagIds.length > 0 ? [{ tags: { $in: matchingTagIds } }] : [])
            ]
          },
          {
            $or: [
              // Published policies for "all" organizations
              { status: 'active', organization: 'all' },
              // Published policies for user's organization
              { status: 'active', organization: user.organization },
              // Unpublished policies assigned to the user
              { status: 'draft', assigned_users: user._id }
            ]
          }
        ]
      };
    }

    // Execute search
    const policies = await Policy.find(searchQuery)
      .populate('created_by', 'first_name last_name email')
      .populate('updated_by', 'first_name last_name email')
      .populate('assigned_users', 'first_name last_name email')
      .populate('tags', 'name color')
      .sort({ updated_at: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalCount = await Policy.countDocuments(searchQuery);

    return NextResponse.json({
      success: true,
      data: {
        policies,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error performing global search:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 