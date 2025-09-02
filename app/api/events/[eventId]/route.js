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
    if (!session) {
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


    let hasPermission = false;
    if (event.created_by_email) {
      hasPermission = event.created_by_email === session.user.email || event.privacy === 'public';
    } else {
      hasPermission = true;
    }
    if (!hasPermission) {
      return NextResponse.json({ error: 'Not authorized to edit this event' }, { status: 403 });
    }

    // Check if this is a recurring event (either original or instance)
    const isRecurringEvent = event.recurring?.is_recurring === true || event.is_recurring_instance === true;

    if (isRecurringEvent && updateType === 'future') {
      	console.log('Updating recurring event series:', {
        eventId: event._id,
        updateType: updateType,
        isRecurring: event.recurring?.is_recurring,
        isRecurringInstance: event.is_recurring_instance
      });
      let originalEventId = event._id;
      if (event.is_recurring_instance && event.original_event_id) {
        originalEventId = event.original_event_id;
        console.log('This is a recurring instance, using original event ID:', originalEventId);
      }

      // Find the original event
      const originalEvent = await Event.findById(originalEventId);
      if (!originalEvent) {
        return NextResponse.json({ error: 'Original recurring event not found' }, { status: 404 });
      }

      // Update the original event with new data
		originalEvent.title = title;
		originalEvent.description = description || '';
		originalEvent.location = location || '';
		originalEvent.start_date = new Date(start_date);
		originalEvent.end_date = new Date(end_date);
		originalEvent.all_day = all_day || false;
		originalEvent.privacy = privacy || 'private';
		originalEvent.color = color || '#3788d8';
		originalEvent.reminders = reminders || [{ type: 'email', minutes_before: 15 }];
		originalEvent.recurring = recurring || originalEvent.recurring;
      	await originalEvent.save();
		const futureInstances = await Event.find({
			$or: [
			{ _id: originalEventId }, // The original event
			{ original_event_id: originalEventId } // All instances
			],
			start_date: { $gte: new Date(start_date) } // From current event's date forward
		});

      	console.log('Found future instances to update:', futureInstances.length);

		for (const instance of futureInstances) {
			if (instance._id.toString() !== originalEventId.toString()) {
				await Event.findByIdAndUpdate(instance._id, {
					title: originalEvent.title,
					description: originalEvent.description,
					location: originalEvent.location,
					all_day: originalEvent.all_day,
					privacy: originalEvent.privacy,
					color: originalEvent.color,
					reminders: originalEvent.reminders,
					recurring: originalEvent.recurring,
				});
			}
		}
		if (originalEvent.recurring.is_recurring) {
			// Set the start date to the current event's date
			const newStartDate = new Date(start_date);
			originalEvent.start_date = newStartDate;
			await originalEvent.save();

			// Generate new instances from the current date forward
			const newInstances = await originalEvent.generateRecurringInstances();
			console.log('Generated new instances:', newInstances.length);
		}

		return NextResponse.json({
			success: true,
			message: `Recurring event series updated successfully. Updated ${futureInstances.length} events.`
		});

    } else if (isRecurringEvent && updateType === 'single') {
		// Update single instance - create a modified instance
		console.log('Updating single recurring instance:', event._id);

		// Create a modified instance with the new data
		const originalEvent = await Event.findById(eventId);
		if (!originalEvent) {
			return NextResponse.json({ error: 'Original recurring event not found' }, { status: 404 });
		}

		// Update the original event with new data
		originalEvent.title = title;
		originalEvent.description = description || '';
		originalEvent.location = location || '';
		originalEvent.start_date = new Date(start_date);
		originalEvent.end_date = new Date(end_date);
		originalEvent.all_day = all_day || false;
		originalEvent.privacy = privacy || 'private';
		originalEvent.color = color || '#3788d8';
		originalEvent.reminders = reminders || [{ type: 'email', minutes_before: 15 }];
		originalEvent.recurring = recurring || originalEvent.recurring;
		await originalEvent.save();
		return NextResponse.json({
			success: true,
			message: 'Single event instance updated successfully'
		});

    } else {
      // Regular update for non-recurring events or new events
      console.log('Performing regular event update:', event._id);

      // Update the event
      event.title = title;
      event.description = description || '';
      event.location = location || '';
      event.start_date = new Date(start_date);
      event.end_date = new Date(end_date);
      event.all_day = all_day || false;
      event.privacy = privacy || 'private';
      event.color = color || '#3788d8';
      event.reminders = reminders || [{ type: 'email', minutes_before: 15 }];
      event.recurring = recurring || event.recurring;

      await event.save();

      console.log('Event updated successfully:', event._id);

      return NextResponse.json({
        success: true,
        message: 'Event updated successfully'
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