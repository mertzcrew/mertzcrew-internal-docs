'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import EventModal from '../../components/calendar/EventModal';
import EventDetailsModal from '../../components/calendar/EventDetailsModal';

interface Event {
  _id: string;
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  all_day: boolean;
  privacy: 'public' | 'private' | 'invite-only';
  created_by: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  invited_users: Array<{
    user: {
      _id: string;
      first_name: string;
      last_name: string;
      email: string;
    };
    rsvp: 'pending' | 'accepted' | 'declined' | 'maybe';
  }>;
  color: string;
  reminders: Array<{
    type: string;
    minutes_before: number;
  }>;
  recurring: {
    is_recurring: boolean;
    pattern: string;
    interval: number;
    end_after: number | null;
    end_date: Date | null;
    days_of_week: number[];
    day_of_month: number | null;
    month_of_year: number | null;
  };
  is_recurring_instance: boolean;
  original_event_id: string | null;
  is_modified_instance: boolean;
  is_deleted: boolean;
  is_active: boolean;
}

export default function CalendarPage() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<Event[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  // Get extended date range for recurring events (2 years before/after)
  const getExtendedDateRange = () => {
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 2);
    
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 2);
    
    return { startDate, endDate };
  };

  // Fetch events
  const fetchEvents = async () => {
    if (!session?.user?.email) return;

    try {
      setLoading(true);
      const { startDate, endDate } = getExtendedDateRange();
      
      const response = await fetch(`/api/events?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch events when session changes
  useEffect(() => {
    if (session?.user?.email) {
      fetchEvents();
    }
  }, [session?.user?.email]);

  // Calendar navigation
  const goToPreviousMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Calendar grid generation
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    const days = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    console.log('Calendar days generated:', {
      year,
      month,
      firstDay: firstDay.toDateString(),
      lastDay: lastDay.toDateString(),
      startDate: startDate.toDateString(),
      endDate: endDate.toDateString(),
      totalDays: days.length,
      days: days.map(d => d.toDateString())
    });
    
    return days;
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    const dateString = date.toDateString();
    
    return events.filter(event => {
      const eventDate = new Date(event.start_date);
      const eventDateString = eventDate.toDateString();
      
      // Skip deleted events
      if (event.is_deleted) return false;
      
      return eventDateString === dateString;
    });
  };

  // Handle event creation
  const handleCreateEvent = () => {
    setEditingEvent(null);
    setShowEventModal(true);
  };

  // Handle event editing
  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setShowEventModal(true);
  };

  // Handle event selection
  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setShowEventDetailsModal(true);
  };

  // Handle event save
  const handleEventSave = () => {
    setShowEventModal(false);
    setShowEventDetailsModal(false);
    setEditingEvent(null);
    setSelectedEvent(null);
    fetchEvents(); // Refresh events
  };

  // Handle event deletion
  const handleEventDelete = () => {
    setShowEventDetailsModal(false);
    setSelectedEvent(null);
    fetchEvents(); // Refresh events
  };

  // Calendar rendering
  const calendarDays = getCalendarDays();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Calendar</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={goToPreviousMonth}
            className="px-3 py-2 border rounded hover:bg-gray-100"
          >
            ←
          </button>
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Today
          </button>
          <button
            onClick={goToNextMonth}
            className="px-3 py-2 border rounded hover:bg-gray-100"
          >
            →
          </button>
          <button
            onClick={handleCreateEvent}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            + Event
          </button>
        </div>
      </div>

      {/* Month Display */}
      <h2 className="text-2xl font-semibold mb-4 text-center">
        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
      </h2>

      {/* Calendar Grid */}
      <div className="calendar-container">
        {/* Day headers */}
        <div className="calendar-header">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="calendar-day-header">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="calendar-grid">
          {calendarDays.map((day, index) => {
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();
            const dayEvents = getEventsForDate(day);

            return (
              <div
                key={index}
                className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
                onClick={() => {
                  setSelectedDate(day);
                  setEditingEvent(null);
                  setSelectedEvent(null);
                  setShowEventModal(true);
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className="calendar-day-number">
                  {day.getDate()}
                  {dayEvents.length === 0 && (
                    <div className="calendar-day-hint">+</div>
                  )}
                </div>
                
                {/* Events for this day */}
                <div className="calendar-day-events">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event._id}
                      className="calendar-event"
                      onClick={(domEvent) => {
                        domEvent.stopPropagation();
                        handleEventClick(event);
                      }}
                      style={{
                        backgroundColor: event.color + '20',
                        color: event.color,
                        border: `1px solid ${event.color}`
                      }}
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="calendar-event-more">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CSS Styles */}
      <style jsx>{`
        .calendar-container {
          width: 100%;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          overflow: hidden;
          position: relative;
          z-index: 1;
        }

        .calendar-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          background-color: #f8f9fa;
          border-bottom: 1px solid #dee2e6;
        }

        .calendar-day-header {
          padding: 12px;
          text-align: center;
          font-weight: 600;
          color: #6c757d;
          border-right: 1px solid #dee2e6;
        }

        .calendar-day-header:last-child {
          border-right: none;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
        }

        .calendar-day {
          min-height: 120px;
          border-right: 1px solid #dee2e6;
          border-bottom: 1px solid #dee2e6;
          padding: 8px;
          transition: background-color 0.2s;
          cursor: pointer;
          position: relative;
        }

        .calendar-day:hover {
          background-color: #f8f9fa;
          box-shadow: inset 0 0 0 2px #007bff;
        }

        .calendar-day:active {
          background-color: #e9ecef;
        }

        .calendar-day.other-month {
          background-color: #f8f9fa;
          color: #6c757d;
        }

        .calendar-day.today {
          background-color: #e3f2fd;
        }

        .calendar-day:last-child {
          border-right: none;
        }

        .calendar-day-number {
          font-weight: 600;
          margin-bottom: 4px;
        }

        .calendar-day-hint {
          font-size: 12px;
          color: #6c757d;
          opacity: 0.6;
          margin-top: 2px;
          text-align: center;
        }

        .calendar-day-events {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .calendar-event {
          padding: 2px 4px;
          border-radius: 3px;
          font-size: 11px;
          cursor: pointer;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .calendar-event:hover {
          opacity: 0.8;
        }

        .calendar-event-more {
          font-size: 10px;
          color: #6c757d;
          text-align: center;
          padding: 2px;
        }

        /* Ensure modals appear above calendar */
        :global(.modal) {
          z-index: 9999 !important;
          position: fixed !important;
        }

        :global(.modal-backdrop) {
          z-index: 9998 !important;
          position: fixed !important;
        }

        :global(.modal-dialog) {
          z-index: 10000 !important;
          position: relative !important;
        }

        :global(.modal-content) {
          z-index: 10001 !important;
          position: relative !important;
        }

        /* Override Bootstrap modal defaults */
        :global(.modal.show) {
          display: block !important;
        }

        :global(.modal.fade) {
          opacity: 1 !important;
        }

        /* Ensure modal content is above backdrop */
        :global(.modal-dialog) {
          z-index: 10000 !important;
        }

        :global(.modal-content) {
          z-index: 10001 !important;
          background: white !important;
        }
      `}</style>

      {/* Event Modal */}
      {showEventModal && (
        <EventModal
          show={showEventModal}
          onClose={() => setShowEventModal(false)}
          onSave={handleEventSave}
          event={editingEvent}
          selectedDate={selectedDate}
        />
      )}

      {/* Event Details Modal */}
      {showEventDetailsModal && selectedEvent && (
        <EventDetailsModal
          show={showEventDetailsModal}
          onClose={() => setShowEventDetailsModal(false)}
          event={selectedEvent}
          onEditEvent={handleEditEvent}
          onDeleteEvent={handleEventDelete}
        />
      )}
    </div>
  );
} 