"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Clock, 
  MapPin, 
  Users, 
  Eye, 
  Lock, 
  Repeat, 
  Edit, 
  Trash2,
  Check,
  X,
  ChevronDown
} from 'lucide-react';

interface Event {
  _id: string;
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  all_day: boolean;
  privacy: 'public' | 'private' | 'invite-only';
  color: string;
  created_by: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  created_by_email: string;
  invited_users: Array<{
    user: {
      _id: string;
      first_name: string;
      last_name: string;
      email: string;
    };
    rsvp: 'pending' | 'accepted' | 'declined' | 'maybe';
  }>;
  recurring: {
    is_recurring: boolean;
    pattern: string;
    interval: number;
    days_of_week: number[];
    end_after: number | null;
    end_date: Date | null;
    day_of_month: number | null;
    month_of_year: number | null;
  };
  is_recurring_instance: boolean;
  original_event_id: string | null;
  is_modified_instance: boolean;
  is_deleted: boolean;
  is_active: boolean;
}

interface EventDetailsModalProps {
  show: boolean;
  onClose: () => void;
  event: Event;
  onDeleteEvent: () => void;
  onEditEvent?: (event: Event) => void;
}

export default function EventDetailsModal({ 
  show, 
  onClose, 
  event, 
  onDeleteEvent,
  onEditEvent
}: EventDetailsModalProps) {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const deleteOptionsRef = useRef<HTMLDivElement>(null);

  // Show loading state while session is loading
  if (status === 'loading') {
    return (
      <div className="modal fade show" style={{ display: 'block', zIndex: 9999 }} tabIndex={-1}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-body text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Don't show modal if no session
  if (status === 'unauthenticated' || !session?.user) {
    return null;
  }

  // Handle click outside to close delete options
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (deleteOptionsRef.current && !deleteOptionsRef.current.contains(event.target as Node)) {
        setShowDeleteOptions(false);
      }
    };

    if (showDeleteOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDeleteOptions]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case 'public':
        return <Eye size={16} className="text-success" />;
      case 'private':
        return <Lock size={16} className="text-warning" />;
      case 'invite-only':
        return <Users size={16} className="text-info" />;
      default:
        return null;
    }
  };

  const getPrivacyLabel = (privacy: string) => {
    switch (privacy) {
      case 'public':
        return 'Public';
      case 'private':
        return 'Private';
      case 'invite-only':
        return 'Invite Only';
      default:
        return privacy;
    }
  };

  const getRecurringLabel = (recurring: any) => {
    if (!recurring || !recurring.is_recurring) return 'Does not repeat';
    
    const pattern = recurring.pattern;
    const interval = recurring.interval || 1;
    
    switch (pattern) {
      case 'daily':
        return interval === 1 ? 'Daily' : `Every ${interval} days`;
      case 'weekly':
        if (recurring.days_of_week && recurring.days_of_week.length > 0) {
          const dayNames = recurring.days_of_week.map((day: number) => {
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            return days[day];
          });
          return `Weekly on ${dayNames.join(', ')}`;
        }
        return interval === 1 ? 'Weekly' : `Every ${interval} weeks`;
      case 'monthly':
        return interval === 1 ? 'Monthly' : `Every ${interval} months`;
      case 'yearly':
        return interval === 1 ? 'Annually' : `Every ${interval} years`;
      default:
        return 'Recurring';
    }
  };

  const handleRSVP = async (status: 'accepted' | 'declined') => {
    setRsvpLoading(true);
    try {
      const response = await fetch(`/api/events/${event._id}/rsvp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        // onEventUpdated(); // This prop is no longer passed
      } else {
        console.error('Failed to update RSVP');
      }
    } catch (error) {
      console.error('Error updating RSVP:', error);
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleDelete = async (deleteType: 'single' | 'series') => {
    const confirmMessage = deleteType === 'single' 
      ? 'Are you sure you want to delete this event only?' 
      : 'Are you sure you want to delete this event and all future events in this series? (Past events will be preserved)';
    
    if (!confirm(confirmMessage)) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/events/${event._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deleteType }),
      });

      if (response.ok) {
        onDeleteEvent();
      } else {
        console.error('Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    } finally {
      setLoading(false);
      setShowDeleteOptions(false);
    }
  };

  // Check if this is a recurring event instance
  const isRecurringInstance = event.is_recurring_instance;
  const isRecurringEvent = event.recurring?.is_recurring;
  
  // Show delete options for any recurring event (original or instance)
  // Also show for any event with underscore in ID (recurring instance)
  const shouldShowDeleteOptions = isRecurringEvent || isRecurringInstance || event._id.includes('_');

  // Get current user ID from session
  const currentUserEmail = session?.user?.email;
  const currentUserId = session?.user?.id;
  
  // Temporary solution: show edit/delete for all events until we implement proper user lookup
  // For new events with created_by_email, we can properly check ownership
  // For old events without created_by_email, we'll show buttons for now
  const isCreator = event.created_by_email ? event.created_by_email === currentUserEmail : true;
  const isInvited = event.invited_users.some(invite => invite.user.email === currentUserEmail);
  const userInvitation = event.invited_users.find(invite => invite.user.email === currentUserEmail);

  if (!show) return null;

  return (
    <>
      <div className="modal fade show" style={{ display: 'block', zIndex: 9999 }} tabIndex={-1}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title d-flex align-items-center">
                <div 
                  className="me-2"
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: event.color,
                    borderRadius: '50%'
                  }}
                />
                {event.title}
              </h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            
            <div className="modal-body">
              <div className="row">
                <div className="col-md-8">
                  {/* Event Details */}
                  <div className="mb-4">
                    {event.description && (
                      <div className="mb-3">
                        <p className="text-muted">{event.description}</p>
                      </div>
                    )}

                    <div className="mb-3">
                      <div className="d-flex align-items-center mb-2">
                        <Clock size={16} className="me-2 text-muted" />
                        <strong>Date & Time</strong>
                      </div>
                      <div>
                        {event.all_day ? (
                          <span>{formatDateTime(event.start_date).split(',')[0]}</span>
                        ) : (
                          <div>
                            <div>{formatDateTime(event.start_date)}</div>
                            <div className="text-muted">to {formatTime(event.end_date)}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {event.location && (
                      <div className="mb-3">
                        <div className="d-flex align-items-center mb-2">
                          <MapPin size={16} className="me-2 text-muted" />
                          <strong>Location</strong>
                        </div>
                        <div>{event.location}</div>
                      </div>
                    )}

                    <div className="mb-3">
                      <div className="d-flex align-items-center mb-2">
                        <strong>Privacy</strong>
                      </div>
                      <div className="d-flex align-items-center">
                        {getPrivacyIcon(event.privacy)}
                        <span className="ms-1">{getPrivacyLabel(event.privacy)}</span>
                      </div>
                    </div>

                    {event.recurring?.is_recurring && (
                      <div className="mb-3">
                        <div className="d-flex align-items-center mb-2">
                          <Repeat size={16} className="me-2 text-muted" />
                          <strong>Recurring</strong>
                        </div>
                        <div>{getRecurringLabel(event.recurring)}</div>
                      </div>
                    )}

                    <div className="mb-3">
                      <div className="d-flex align-items-center mb-2">
                        <strong>Created by</strong>
                      </div>
                      <div>{currentUserEmail === event.created_by_email ? 'You' : 'Another user'}</div>
                    </div>
                  </div>
                </div>

                <div className="col-md-4">
                  {/* RSVP Section for Invited Users */}
                  {isInvited && (
                    <div className="mb-4">
                      <h6>Your Response</h6>
                      {userInvitation?.rsvp === 'pending' ? (
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleRSVP('accepted')}
                            disabled={rsvpLoading}
                          >
                            <Check size={14} className="me-1" />
                            Accept
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRSVP('declined')}
                            disabled={rsvpLoading}
                          >
                            <X size={14} className="me-1" />
                            Decline
                          </button>
                        </div>
                      ) : (
                        <span className={`badge ${userInvitation?.rsvp === 'accepted' ? 'bg-success' : 'bg-danger'}`}>
                          {userInvitation?.rsvp === 'accepted' ? 'Accepted' : 'Declined'}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Invited Users Section */}
                  {event.privacy === 'invite-only' && event.invited_users.length > 0 && (
                    <div className="mb-4">
                      <h6>Invited Users</h6>
                      <div className="d-flex flex-column gap-1">
                        {event.invited_users.map((invite) => (
                          <div key={invite.user._id} className="d-flex justify-content-between align-items-center">
                            <span>{invite.user.first_name} {invite.user.last_name}</span>
                            <span className={`badge badge-sm ${
                              invite.rsvp === 'accepted' ? 'bg-success' : 
                              invite.rsvp === 'declined' ? 'bg-danger' : 'bg-secondary'
                            }`}>
                              {invite.rsvp}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Loading Message */}
                  {loading && (
                    <div className="d-flex justify-content-center align-items-center p-4">
                      <div className="text-center">
                        <div className="spinner-border text-primary mb-2" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <div className="text-muted">Events are being deleted...</div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="d-flex flex-column gap-2">
                    {isCreator && (
                      <>
                        <button 
                          className="btn btn-outline-primary btn-sm" 
                          onClick={() => onEditEvent?.(event)}
                          disabled={loading}
                        >
                          <Edit size={14} className="me-1" />
                          Edit Event
                        </button>
                        
                        {/* Delete button with options for recurring events */}
                        {shouldShowDeleteOptions ? (
                          <div className="position-relative" ref={deleteOptionsRef}>
                            <button 
                              className="btn btn-outline-primary btn-sm w-100 position-relative"
                              onClick={() => setShowDeleteOptions(!showDeleteOptions)}
                              disabled={loading}
                            >
                              <span className="d-flex align-items-center justify-content-center">
                                <Trash2 size={14} className="me-1" />
                                Delete Event
                              </span>
                              <ChevronDown size={14} className="position-absolute" style={{ right: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                            </button>
                            
                            {showDeleteOptions && (
                              <div className="position-absolute top-100 start-0 w-100 bg-white border rounded shadow-sm mt-1" style={{ zIndex: 1060 }}>
                                <button
                                  type="button"
                                  className="btn btn-link w-100 text-start p-2 text-danger text-decoration-none"
                                  onClick={() => handleDelete('single')}
                                  disabled={loading}
                                >
                                  Delete this event only
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-link w-100 text-start p-2 text-danger text-decoration-none"
                                  onClick={() => handleDelete('series')}
                                  disabled={loading}
                                >
                                  Delete this and all future events
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <button 
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => handleDelete('single')}
                            disabled={loading}
                          >
                            <Trash2 size={14} className="me-1" />
                            Delete Event
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" style={{ zIndex: 9998 }}></div>
    </>
  );
} 