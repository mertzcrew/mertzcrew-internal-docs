import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import Event from '@/models/Event';
import { connectDB } from '@/components/lib/mongodb';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { eventId } = await params;
    
    // Handle recurring instance IDs (e.g., originalId_occurrenceNumber)
    let actualEventId = eventId;
    if (eventId.includes('_')) {
      actualEventId = eventId.split('_')[0];
    }

    const event = await Event.findById(actualEventId);

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (! session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { eventId } = await params;
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
      reminders,
      updateType
    } = body;

    // Validate required fields
    if (!title || !start_date || !end_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Handle recurring instance IDs
    let actualEventId = eventId;
    if (eventId.includes('_')) {
      actualEventId = eventId.split('_')[0];
    }

    const event = await Event.findById(actualEventId);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if user has permission to edit this event
    if (event.created_by.toString() !== session.user.id && event.privacy !== 'public') {
      return NextResponse.json({ error: 'Not authorized to edit this event' }, { status: 403 });
    }

    if (event.recurring?.is_recurring && updateType === 'single') {
      // Update single instance - create a new modified instance
      const modifiedInstanceData = {
        title: title.trim(),
        description: description?.trim() || '',
        location: location?.trim() || '',
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        all_day: all_day || false,
        privacy: privacy || 'private',
        created_by: event.created_by,
        invited_users: invited_users || event.invited_users,
        color: color || event.color,
        reminders: reminders || event.reminders,
        is_modified_instance: true,
        original_event_id: event._id
      };

      const modifiedInstance = new Event(modifiedInstanceData);
      await modifiedInstance.save();

      console.log('Created modified instance:', {
        originalEventId: event._id,
        modifiedInstanceId: modifiedInstance._id,
        date: start_date
      });

      // Return the modified instance (without population to avoid User model issues)
      return NextResponse.json({
        success: true,
        message: 'Single event instance updated successfully',
        event: modifiedInstance
      });
    } else if (event.recurring?.is_recurring && updateType === 'future') {
      // Update this and all future events
      // First, update the original event
      event.title = title.trim();
      event.description = description?.trim() || '';
      event.location = location?.trim() || '';
      event.start_date = new Date(start_date);
      event.end_date = new Date(end_date);
      event.all_day = all_day || false;
      event.privacy = privacy || 'private';
      event.invited_users = invited_users || event.invited_users;
      event.color = color || event.color;
      event.reminders = reminders || event.reminders;

      await event.save();

      // Regenerate all recurring instances
      await event.updateRecurringInstances();

      console.log('Updated recurring event and regenerated instances:', event._id);

      // Return the updated event (without population to avoid User model issues)
      return NextResponse.json({
        success: true,
        message: 'Recurring event updated successfully',
        event: event
      });
    } else {
      // Update non-recurring event or single instance
      event.title = title.trim();
      event.description = description?.trim() || '';
      event.location = location?.trim() || '';
      event.start_date = new Date(start_date);
      event.end_date = new Date(end_date);
      event.all_day = all_day || false;
      event.privacy = privacy || 'private';
      event.invited_users = invited_users || event.invited_users;
      event.color = color || event.color;
      event.reminders = reminders || event.reminders;

      await event.save();

      // Return the updated event (without population to avoid User model issues)
      return NextResponse.json({
        success: true,
        message: 'Event updated successfully',
        event: event
      });
    }
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { eventId } = await params;
    
    // Get delete type from request body
    let deleteType = 'single';
    try {
      const body = await request.json();
      deleteType = body?.deleteType || 'single';
    } catch (e) {
      // No body sent, use default
      deleteType = 'single';
    }

    // Handle recurring instance IDs
    let actualEventId = eventId;
    if (eventId.includes('_')) {
      actualEventId = eventId.split('_')[0];
    }

    const event = await Event.findById(actualEventId);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if user has permission to delete this event
    // Compare by email since user IDs are from different systems
    // For new events with created_by_email, check ownership
    // For old events without created_by_email, allow deletion for now (temporary)
    let hasPermission = false;
    if (event.created_by_email) {
      // New event - check email ownership
      hasPermission = event.created_by_email === session.user.email || event.privacy === 'public';
    } else {
      // Old event - temporarily allow deletion (we'll implement proper user lookup later)
      hasPermission = true;
    }
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Not authorized to delete this event' }, { status: 403 });
    }

    // Check if this is a recurring event (either original or instance)
    const isRecurringEvent = event.recurring?.is_recurring === true || event.is_recurring_instance === true;
    
    if (isRecurringEvent && deleteType === 'series') {
      // Delete this and all future events
      // For recurring instances, we need to find the original event first
      let originalEventId = event._id;
      if (event.is_recurring_instance && event.original_event_id) {
        originalEventId = event.original_event_id;
      }

      // Find and delete all related instances
      const instancesToDelete = await Event.find({
        $or: [
          { _id: originalEventId }, // The original event
          { original_event_id: originalEventId }, // All instances
          { 
            // Also find instances by matching the recurring pattern
            'recurring.is_recurring': true,
            start_date: { $gte: event.start_date } // Future instances from THIS event's date
          }
        ]
      });

      // Filter to only delete current event and future events
      const eventsToActuallyDelete = instancesToDelete.filter(instance => 
        instance.start_date >= event.start_date // Only delete from current event's date forward
      );

      // Delete all found instances
      for (const instance of eventsToActuallyDelete) {
        await Event.findByIdAndDelete(instance._id);
      }

      return NextResponse.json({
        success: true,
        message: `Recurring event series deleted successfully. Deleted ${eventsToActuallyDelete.length} events (current + future). Past events were preserved.`
      });
    } else if (isRecurringEvent && deleteType === 'single') {
      // Delete single instance - actually delete the event
      
      // Actually delete the event instead of creating a marker
      await Event.findByIdAndDelete(event._id);

      return NextResponse.json({
        success: true,
        message: 'Single event instance deleted successfully'
      });
    } else {
      // Delete non-recurring event
      await Event.findByIdAndDelete(event._id);

      return NextResponse.json({
        success: true,
        message: 'Event deleted successfully'
      });
    }
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
} 