const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  // Basic event information
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  location: {
    type: String,
    trim: true,
    default: ''
  },
  start_date: {
    type: Date,
    required: true
  },
  end_date: {
    type: Date,
    required: true
  },
  all_day: {
    type: Boolean,
    default: false
  },
  
  // Privacy and access control
  privacy: {
    type: String,
    enum: ['public', 'private', 'invite-only'],
    default: 'private'
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  created_by_email: {
    type: String,
    required: true
  },
  invited_users: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rsvp: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'maybe'],
      default: 'pending'
    },
    responded_at: Date
  }],
  
  // Recurring event configuration
  recurring: {
    is_recurring: {
      type: Boolean,
      default: false
    },
    pattern: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly', 'weekdays', 'custom'],
      default: 'daily'
    },
    interval: {
      type: Number,
      min: 1,
      default: 1
    },
    end_after: {
      type: Number,
      min: 1
    },
    end_date: Date,
    days_of_week: [{
      type: Number, // 0 = Sunday, 1 = Monday, etc.
      min: 0,
      max: 6
    }],
    day_of_month: {
      type: Number,
      min: 1,
      max: 31
    },
    month_of_year: {
      type: Number,
      min: 1,
      max: 12
    }
  },
  
  // Event styling and reminders
  color: {
    type: String,
    default: '#3788d8'
  },
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'push', 'sms'],
      default: 'email'
    },
    minutes_before: {
      type: Number,
      min: 0,
      default: 15
    }
  }],
  
  // Instance management
  is_recurring_instance: {
    type: Boolean,
    default: false
  },
  original_event_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  is_modified_instance: {
    type: Boolean,
    default: false
  },
  is_deleted: {
    type: Boolean,
    default: false
  },
  
  // Metadata
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for performance
EventSchema.index({ start_date: 1 });
EventSchema.index({ end_date: 1 });
EventSchema.index({ created_by: 1 });
EventSchema.index({ 'invited_users.user': 1 });
EventSchema.index({ privacy: 1 });
EventSchema.index({ original_event_id: 1 });
EventSchema.index({ is_recurring_instance: 1 });
EventSchema.index({ is_modified_instance: 1 });
EventSchema.index({ is_deleted: 1 });

// Virtual to check if event is currently happening
EventSchema.virtual('is_current').get(function() {
  const now = new Date();
  return this.start_date <= now && this.end_date >= now;
});

// Method to generate recurring instances
EventSchema.methods.generateRecurringInstances = async function() {
  if (!this.recurring.is_recurring) {
    return [];
  }

  const instances = [];
  let currentDate = new Date(this.start_date);
  const endDate = this.recurring.end_date || new Date(currentDate.getFullYear() + 2, currentDate.getMonth(), currentDate.getDate());
  const maxOccurrences = this.recurring.end_after || 1000; // Default to 1000 occurrences
  let occurrenceCount = 0;

  console.log('Generating recurring instances:', {
    pattern: this.recurring.pattern,
    interval: this.recurring.interval,
    startDate: this.start_date,
    endDate: endDate,
    maxOccurrences: maxOccurrences
  });

  while (currentDate <= endDate && occurrenceCount < maxOccurrences) {
    // Skip the initial date to avoid duplication with the original event
    if (occurrenceCount === 0) {
      // For the first iteration, advance to the next occurrence
      switch (this.recurring.pattern) {
        case 'daily':
          currentDate = new Date(currentDate.getTime() + (this.recurring.interval * 24 * 60 * 60 * 1000));
          break;
        case 'weekly':
          if (this.recurring.days_of_week && this.recurring.days_of_week.length > 0) {
            // Find next occurrence based on days of week
            let found = false;
            let weeksChecked = 0;
            let nextDate = new Date(currentDate);
            
            while (!found && weeksChecked < 10) {
              nextDate.setDate(nextDate.getDate() + 1);
              
              for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
                const checkDate = new Date(nextDate);
                checkDate.setDate(nextDate.getDate() + dayOffset);
                
                if (this.recurring.days_of_week.includes(checkDate.getDay())) {
                  currentDate = new Date(checkDate);
                  found = true;
                  break;
                }
              }
              
              if (!found) {
                nextDate.setDate(nextDate.getDate() + (this.recurring.interval * 7));
                weeksChecked++;
              }
            }
            
            if (!found) {
              currentDate = new Date(currentDate.getTime() + (this.recurring.interval * 7 * 24 * 60 * 60 * 1000));
            }
          } else {
            currentDate = new Date(currentDate.getTime() + (this.recurring.interval * 7 * 24 * 60 * 60 * 1000));
          }
          break;
        case 'monthly':
          if (this.recurring.day_of_month) {
            currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + this.recurring.interval, this.recurring.day_of_month);
          } else {
            currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + this.recurring.interval, currentDate.getDate());
          }
          break;
        case 'yearly':
          if (this.recurring.month_of_year && this.recurring.day_of_month) {
            currentDate = new Date(currentDate.getFullYear() + this.recurring.interval, this.recurring.month_of_year - 1, this.recurring.day_of_month);
          } else if (this.recurring.month_of_year) {
            currentDate = new Date(currentDate.getFullYear() + this.recurring.interval, this.recurring.month_of_year - 1, currentDate.getDate());
          } else {
            currentDate = new Date(currentDate.getFullYear() + this.recurring.interval, currentDate.getMonth(), currentDate.getDate());
          }
          break;
        case 'weekdays':
          currentDate = new Date(currentDate.getTime() + (24 * 60 * 60 * 1000));
          // Skip weekends
          while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
            currentDate.setDate(currentDate.getDate() + 1);
          }
          break;
        case 'custom':
          // Custom pattern - advance by interval days
          currentDate = new Date(currentDate.getTime() + (this.recurring.interval * 24 * 60 * 60 * 1000));
          break;
      }
      occurrenceCount++;
      continue; // Skip to next iteration
    }

    // Create instance data
    const instanceData = {
      title: this.title,
      description: this.description,
      location: this.location,
      start_date: new Date(currentDate),
      end_date: new Date(currentDate.getTime() + (this.end_date.getTime() - this.start_date.getTime())),
      all_day: this.all_day,
      privacy: this.privacy,
      created_by: this.created_by,
      created_by_email: this.created_by_email,
      invited_users: this.invited_users,
      color: this.color,
      reminders: this.reminders,
      is_recurring_instance: true,
      original_event_id: this._id,
      is_active: true
    };

    instances.push(instanceData);
    occurrenceCount++;

    // Calculate next occurrence
    switch (this.recurring.pattern) {
      case 'daily':
        currentDate = new Date(currentDate.getTime() + (this.recurring.interval * 24 * 60 * 60 * 1000));
        break;
      case 'weekly':
        if (this.recurring.days_of_week && this.recurring.days_of_week.length > 0) {
          // Find next occurrence based on days of week
          let found = false;
          let weeksChecked = 0;
          let nextDate = new Date(currentDate);
          
          while (!found && weeksChecked < 10) {
            nextDate.setDate(nextDate.getDate() + 1);
            
            for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
              const checkDate = new Date(nextDate);
              checkDate.setDate(nextDate.getDate() + dayOffset);
              
              if (this.recurring.days_of_week.includes(checkDate.getDay())) {
                currentDate = new Date(checkDate);
                found = true;
                break;
              }
            }
            
            if (!found) {
              nextDate.setDate(nextDate.getDate() + (this.recurring.interval * 7));
              weeksChecked++;
            }
          }
          
          if (!found) {
            currentDate = new Date(currentDate.getTime() + (this.recurring.interval * 7 * 24 * 60 * 60 * 1000));
          }
        } else {
          currentDate = new Date(currentDate.getTime() + (this.recurring.interval * 7 * 24 * 60 * 60 * 1000));
        }
        break;
      case 'monthly':
        if (this.recurring.day_of_month) {
          currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + this.recurring.interval, this.recurring.day_of_month);
        } else {
          currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + this.recurring.interval, currentDate.getDate());
        }
        break;
      case 'yearly':
        if (this.recurring.month_of_year && this.recurring.day_of_month) {
          currentDate = new Date(currentDate.getFullYear() + this.recurring.interval, this.recurring.month_of_year - 1, this.recurring.day_of_month);
        } else if (this.recurring.month_of_year) {
          currentDate = new Date(currentDate.getFullYear() + this.recurring.interval, this.recurring.month_of_year - 1, currentDate.getDate());
        } else {
          currentDate = new Date(currentDate.getFullYear() + this.recurring.interval, currentDate.getMonth(), currentDate.getDate());
        }
        break;
      case 'weekdays':
        currentDate = new Date(currentDate.getTime() + (24 * 60 * 60 * 1000));
        // Skip weekends
        while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
          currentDate.setDate(currentDate.getDate() + 1);
        }
        break;
      case 'custom':
        // Custom pattern - advance by interval days
        currentDate = new Date(currentDate.getTime() + (this.recurring.interval * 24 * 60 * 60 * 1000));
        break;
    }
  }

  console.log(`Generated ${instances.length} recurring instances`);
  return instances;
};

// Static method to get events for a user
EventSchema.statics.getEventsForUser = async function(userEmail, startDate, endDate) {
  try {
    // Get all events visible to the user (simplified without population)
    // Exclude recurring templates and deleted events
    const events = await this.find({
      is_deleted: false,
      is_active: true,
      // Exclude recurring templates (original events that generate instances)
      $or: [
        { is_recurring_instance: true }, // Include recurring instances
        { 'recurring.is_recurring': false } // Include non-recurring events
      ]
    }).sort({ start_date: 1 });

    // Filter events based on user access (simplified)
    const userEvents = events.filter(event => {
      // Public events are always visible
      if (event.privacy === 'public') return true;
      
      // For now, return all events to avoid complex filtering
      // This can be enhanced later when User model is properly integrated
      return true;
    });

    console.log(`Found ${userEvents.length} events for user ${userEmail}`);
    return userEvents;
  } catch (error) {
    console.error('Error getting events for user:', error);
    throw error;
  }
};

// Method to create recurring instances
EventSchema.methods.createRecurringInstances = async function() {
  if (!this.recurring.is_recurring) {
    return [];
  }

  try {
    // Generate instance data
    const instancesData = await this.generateRecurringInstances();
    
    if (instancesData.length === 0) {
      return [];
    }

    // Create all instances in the database
    const createdInstances = await this.constructor.insertMany(instancesData);
    
    console.log(`Created ${createdInstances.length} recurring instances for event ${this._id}`);
    return createdInstances;
  } catch (error) {
    console.error('Error creating recurring instances:', error);
    throw error;
  }
};

// Method to update recurring instances
EventSchema.methods.updateRecurringInstances = async function() {
  if (!this.recurring.is_recurring) {
    return [];
  }

  try {
    // Delete existing instances
    await this.constructor.deleteMany({
      original_event_id: this._id,
      is_recurring_instance: true
    });

    // Create new instances
    const newInstances = await this.createRecurringInstances();
    
    console.log(`Updated recurring instances for event ${this._id}: ${newInstances.length} instances`);
    return newInstances;
  } catch (error) {
    console.error('Error updating recurring instances:', error);
    throw error;
  }
};

module.exports = mongoose.models.Event || mongoose.model('Event', EventSchema); 