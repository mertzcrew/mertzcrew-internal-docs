const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });
const dbConnect = require('../components/lib/mongodb.js');

// Import the Event model
const Event = require('../models/Event');

async function clearAllEvents() {
  try {
    // Connect to MongoDB
    await dbConnect();
    console.log('Connected to MongoDB');

    // Count events before deletion
    const eventCount = await Event.countDocuments({});
    console.log(`Found ${eventCount} events in the database`);

    if (eventCount === 0) {
      console.log('No events to delete. Database is already clean.');
      return;
    }

    // Delete all events
    const result = await Event.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} events from the database`);

    // Verify deletion
    const remainingEvents = await Event.countDocuments({});
    console.log(`Remaining events: ${remainingEvents}`);

    if (remainingEvents === 0) {
      console.log('🎉 Database cleared successfully!');
    } else {
      console.log('⚠️  Some events may still remain');
    }

  } catch (error) {
    console.error('❌ Error clearing events:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the cleanup
clearAllEvents(); 