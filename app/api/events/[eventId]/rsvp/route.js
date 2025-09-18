import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { connectDB } from '../../../../../components/lib/mongodb';
import Event from '../../../../../models/Event';
import User from '../../../../../models/User';

// POST to respond to an event invitation
export async function POST(request, { params }) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { eventId } = await params;
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { rsvp } = body;

    if (!rsvp || !['accepted', 'declined', 'maybe'].includes(rsvp)) {
      return NextResponse.json(
        { success: false, message: 'Valid RSVP (accepted, declined, or maybe) is required' },
        { status: 400 }
      );
    }

    // Handle recurring event instances - extract original event ID
    let actualEventId = eventId;
    if (eventId.includes('_')) {
      // This is a recurring event instance, extract the original event ID
      actualEventId = eventId.split('_')[0];
    }

    const event = await Event.findById(actualEventId)
      .populate('created_by', 'first_name last_name email')
      .populate('invited_users.user', 'first_name last_name email');

    if (!event) {
      return NextResponse.json(
        { success: false, message: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if user is invited to this event
    const invitation = event.invited_users.find(
      invite => invite.user._id.toString() === user._id.toString()
    );

    if (!invitation) {
      return NextResponse.json(
        { success: false, message: 'You are not invited to this event' },
        { status: 403 }
      );
    }

    // Update the RSVP status
    invitation.rsvp = rsvp;
    invitation.responded_at = new Date();

    await event.save();

    return NextResponse.json({
      success: true,
      message: `Event invitation ${rsvp} successfully`,
      event
    });

  } catch (error) {
    console.error('Error updating RSVP:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 