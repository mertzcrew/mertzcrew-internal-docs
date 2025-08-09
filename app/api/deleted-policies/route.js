import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '../../../components/lib/mongodb';
import DeletedPolicy from '../../../models/DeletedPolicy';
import User from '../../../models/User';

// GET /api/deleted-policies - Fetch deleted policies (admin only)
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

    // Only admins can view deleted policies
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions to view deleted policies' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const sort = searchParams.get('sort') || 'deleted_at:desc';

    const skip = (page - 1) * limit;

    // Parse sort parameter
    const [sortField, sortOrder] = sort.split(':');
    const sortObject = {};
    sortObject[sortField] = sortOrder === 'desc' ? -1 : 1;

    // Fetch deleted policies
    const deletedPolicies = await DeletedPolicy.find({})
      .populate('created_by', 'first_name last_name email')
      .populate('deleted_by', 'first_name last_name email')
      .populate('assigned_users', 'first_name last_name email')
      .sort(sortObject)
      .skip(skip)
      .limit(limit);

    // Get total count
    const totalCount = await DeletedPolicy.countDocuments({});

    return NextResponse.json({
      success: true,
      data: {
        deletedPolicies,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching deleted policies:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 