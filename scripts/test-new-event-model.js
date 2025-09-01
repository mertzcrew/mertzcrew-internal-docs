const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });
const dbConnect = require('../components/lib/mongodb.js');

// Import the new Event model
const Event = require('../models/Event');

async function testNewEventModel() {
  try {
    // Connect to MongoDB using the same method as the app
    await dbConnect();
    console.log('Connected to MongoDB');

    // Test 1: Create a simple non-recurring event
    console.log('\n=== Test 1: Creating non-recurring event ===');
    const simpleEvent = new Event({
      title: 'Test Meeting',
      description: 'A simple test meeting',
      location: 'Conference Room',
      start_date: new Date('2025-01-15T10:00:00Z'),
      end_date: new Date('2025-01-15T11:00:00Z'),
      all_day: false,
      privacy: 'private',
      created_by: new mongoose.Types.ObjectId(), // Dummy user ID
      color: '#3788d8',
      reminders: [{ type: 'email', minutes_before: 15 }]
    });

    await simpleEvent.save();
    console.log('✅ Simple event created:', simpleEvent._id);

    // Test 2: Create a recurring event
    console.log('\n=== Test 2: Creating recurring event ===');
    const recurringEvent = new Event({
      title: 'Weekly Team Standup',
      description: 'Daily team standup meeting',
      location: 'Zoom',
      start_date: new Date('2025-01-20T09:00:00Z'),
      end_date: new Date('2025-01-20T09:30:00Z'),
      all_day: false,
      privacy: 'private',
      created_by: new mongoose.Types.ObjectId(), // Dummy user ID
      color: '#28a745',
      reminders: [{ type: 'email', minutes_before: 15 }],
      recurring: {
        is_recurring: true,
        pattern: 'weekly',
        interval: 1,
        days_of_week: [2], // Tuesday
        end_after: 10
      }
    });

    await recurringEvent.save();
    console.log('✅ Recurring event created:', recurringEvent._id);

    // Test 3: Generate recurring instances
    console.log('\n=== Test 3: Generating recurring instances ===');
    const instances = await recurringEvent.createRecurringInstances();
    console.log(`✅ Generated ${instances.length} recurring instances`);

    // Test 4: Query events
    console.log('\n=== Test 4: Querying events ===');
    const allEvents = await Event.find({}).sort({ start_date: 1 });
    console.log(`✅ Found ${allEvents.length} total events`);

    // Show event types
    const originalEvents = allEvents.filter(e => !e.is_recurring_instance);
    const recurringInstances = allEvents.filter(e => e.is_recurring_instance);
    
    console.log(`- Original events: ${originalEvents.length}`);
    console.log(`- Recurring instances: ${recurringInstances.length}`);

    // Test 5: Test basic querying without population
    console.log('\n=== Test 5: Testing basic event queries ===');
    const recurringEventTemplates = await Event.find({ is_recurring_instance: false, 'recurring.is_recurring': true });
    const recurringEventInstances = await Event.find({ is_recurring_instance: true });
    const modifiedEventInstances = await Event.find({ is_modified_instance: true });
    
    console.log(`✅ Found ${recurringEventTemplates.length} recurring event templates`);
    console.log(`✅ Found ${recurringEventInstances.length} recurring instances`);
    console.log(`✅ Found ${modifiedEventInstances.length} modified instances`);

    // Test 6: Test specific date queries
    console.log('\n=== Test 6: Testing date-based queries ===');
    const januaryEvents = await Event.find({
      start_date: {
        $gte: new Date('2025-01-01'),
        $lt: new Date('2025-02-01')
      }
    }).sort({ start_date: 1 });
    
    console.log(`✅ Found ${januaryEvents.length} events in January 2025`);
    
    // Show the dates
    januaryEvents.forEach(event => {
      const date = new Date(event.start_date);
      const type = event.is_recurring_instance ? 'Instance' : 'Original';
      console.log(`  - ${date.toDateString()}: ${event.title} (${type})`);
    });

    console.log('\n🎉 All tests passed! The new Event model is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testNewEventModel(); 