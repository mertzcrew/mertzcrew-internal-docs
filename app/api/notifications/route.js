import { NextResponse } from 'next/server';
import dbConnect from '../../../components/lib/mongodb.js';
import Notification from '../../../models/Notification.js';
import User from '../../../models/User.js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route.js';

// GET /api/notifications - Fetch notifications for the authenticated user
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
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const unreadOnly = searchParams.get('unread') === 'true';

    const skip = (page - 1) * limit;

    // Build query
    const query = { user_id: user._id };
    if (unreadOnly) {
      query.is_read = false;
    }

    // Fetch notifications
    const notifications = await Notification.find(query)
      .populate('policy_id', 'title category organization')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count and unread count
    const totalCount = await Notification.countDocuments({ user_id: user._id });
    const unreadCount = await Notification.getUnreadCount(user._id);

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        },
        unreadCount
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(request) {
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

    const body = await request.json();
    const { notificationId, markAllAsRead } = body;

    if (markAllAsRead) {
      // Mark all notifications as read
      await Notification.markAllAsRead(user._id);
      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read'
      }, { status: 200 });
    } else if (notificationId) {
      // Mark specific notification as read
      const updatedNotification = await Notification.markAsRead(notificationId, user._id);
      if (!updatedNotification) {
        return NextResponse.json(
          { success: false, message: 'Notification not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: updatedNotification
      }, { status: 200 });
    } else {
      return NextResponse.json(
        { success: false, message: 'notificationId or markAllAsRead is required' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 