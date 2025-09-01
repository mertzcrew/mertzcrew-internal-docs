import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import Event from '../../../models/Event';
import User from '../../../models/User';
import { connectDB } from '../../../components/lib/mongodb';
import { sendEventInvitationEmail } from '../../../lib/emailService';
import mongoose from 'mongoose';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get date range from query params (extended range for recurring events)
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Fetch events using the new model
    const events = await Event.getEventsForUser(session.user.email, startDate, endDate);

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Session user data:', {
      id: session.user.id,
      idType: typeof session.user.id,
      email: session.user.email,
      fullSession: JSON.stringify(session.user, null, 2)
    });

    await connectDB();

    const body = await request.json();
    const {
      title,
      description,
      location,
      start_date,
      end_date,
      all_day,
      privacy,
      invited_users,
      recurring,
      color,
      reminders
    } = body;

    // Validate required fields
    if (!title || !start_date || !end_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find the user by email to get their MongoDB ObjectId
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('Found user:', {
      _id: user._id,
      email: user.email,
      name: user.first_name + ' ' + user.last_name
    });

    // Convert invited_users string IDs to ObjectIds
    const processedInvitedUsers = (invited_users || []).map(invite => {
      try {
        const userId = invite.user || invite;
        if (userId && /^[0-9a-fA-F]{24}$/.test(userId)) {
          return {
            user: new mongoose.Types.ObjectId(userId),
            rsvp: 'pending'
          };
        } else {
          console.warn('Skipping invalid user ID:', userId);
          return null;
        }
      } catch (error) {
        console.warn('Error processing invited user ID:', userId, error);
        return null;
      }
    }).filter(Boolean); // Remove null entries

    // Create the event
    const eventData = {
      title: title.trim(),
      description: description?.trim() || '',
      location: location?.trim() || '',
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      all_day: all_day || false,
      privacy: privacy || 'private',
      created_by: user._id, // Use the MongoDB ObjectId from the found user
      created_by_email: user.email, // Store email for easy comparison
      invited_users: processedInvitedUsers,
      recurring: recurring || { is_recurring: false },
      color: color || '#3788d8',
      reminders: reminders || [{ type: 'email', minutes_before: 15 }]
    };

    const event = new Event(eventData);
    await event.save();

    // If this is a recurring event, create all instances and mark original as template
    if (event.recurring.is_recurring) {
      console.log('Creating recurring instances for event:', event._id);
      
      // Mark the original event as a recurring template (not displayed)
      event.is_recurring_instance = false; // This is the template
      event.is_active = false; // Hide the template from display
      await event.save();
      
      // Create all recurring instances
      await event.createRecurringInstances();
    }

    // Send invitation emails if there are invited users
    if (invited_users && invited_users.length > 0) {
      for (const invite of invited_users) {
        if (invite.user && invite.user.email) {
          try {
            await sendEventInvitationEmail(
              invite.user.email,
              invite.user.first_name || 'User', // userName
              session.user.first_name || 'User', // fromUserName
              event.title, // eventTitle
              event.start_date, // eventDate
              event._id.toString() // eventId
            );
          } catch (emailError) {
            console.error('Failed to send invitation email:', emailError);
          }
        }
      }
    }

    // Return the created event (without population to avoid User model issues)
    return NextResponse.json({
      success: true,
      message: 'Event created successfully',
      event: event
    });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
} 