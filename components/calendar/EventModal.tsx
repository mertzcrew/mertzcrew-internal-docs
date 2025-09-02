"use client";

import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Users, Eye, Lock, EyeOff, Repeat, Palette, ChevronDown, X } from 'lucide-react';

interface User {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
}

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

interface EventModalProps {
  show: boolean;
  onClose: () => void;
  onSave: () => void;
  event?: Event | null;
  selectedDate?: Date | null;
}

interface EventFormData {
  title: string;
  description: string;
  location: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  all_day: boolean;
  privacy: 'public' | 'private' | 'invite-only';
  color: string;
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
  invited_users: string[];
}

const EVENT_COLORS = [
  '#3788d8', '#dc3545', '#28a745', '#ffc107', '#6f42c1', 
  '#fd7e14', '#20c997', '#e83e8c', '#6c757d', '#17a2b8'
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'S' },
  { value: 1, label: 'Monday', short: 'M' },
  { value: 2, label: 'Tuesday', short: 'T' },
  { value: 3, label: 'Wednesday', short: 'W' },
  { value: 4, label: 'Thursday', short: 'T' },
  { value: 5, label: 'Friday', short: 'F' },
  { value: 6, label: 'Saturday', short: 'S' }
];

const WEEKDAYS = [1, 2, 3, 4, 5]; // Monday to Friday

export default function EventModal({ 
  show, 
  onClose, 
  onSave, 
  event,
  selectedDate
}: EventModalProps) {
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    location: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    all_day: false,
    privacy: 'private',
    color: '#3788d8',
    recurring: {
      is_recurring: false,
      pattern: 'daily',
      interval: 1,
      end_after: null,
      end_date: null,
      days_of_week: [],
      day_of_month: null,
      month_of_year: null
    },
    invited_users: [] as string[]
  });

  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showRecurringDropdown, setShowRecurringDropdown] = useState(false);
  const [showCustomRecurring, setShowCustomRecurring] = useState(false);
  const [showUpdateOptions, setShowUpdateOptions] = useState(false);
  const [pendingEventData, setPendingEventData] = useState<any>(null);
  const [recurringOptions, setRecurringOptions] = useState<any[]>([]);

  const isEditing = !!event;

  // Get current day of week for the event
  const getCurrentDayOfWeek = () => {
    if (!formData.start_date) {
      const date = new Date();
      return date.getDay();
    }
    
    const [year, month, day] = formData.start_date.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getDay();
  };

  // Get current day of month for the event
  const getCurrentDayOfMonth = () => {
    if (!formData.start_date) {
      const date = new Date();
      return date.getDate();
    }
    
    const [year, month, day] = formData.start_date.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getDate();
  };

  // Get week number of month (1st, 2nd, 3rd, 4th, last)
  const getWeekOfMonth = () => {
    if (!formData.start_date) {
      const date = new Date();
      const dayOfMonth = date.getDate();
      const weekOfMonth = Math.ceil(dayOfMonth / 7);
      return weekOfMonth;
    }
    
    const [year, month, day] = formData.start_date.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dayOfMonth = date.getDate();
    const weekOfMonth = Math.ceil(dayOfMonth / 7);
    return weekOfMonth;
  };

  // Generate recurring options based on current event date
  const getRecurringOptions = () => {
    const currentDay = getCurrentDayOfWeek();
    const currentDayName = DAYS_OF_WEEK[currentDay].label;
    const currentDayOfMonth = getCurrentDayOfMonth();
    const weekOfMonth = getWeekOfMonth();
    const weekSuffix = weekOfMonth === 1 ? 'st' : weekOfMonth === 2 ? 'nd' : weekOfMonth === 3 ? 'rd' : 'th';
    
    return [
      { value: 'none', label: 'Does not repeat' },
      { value: 'daily', label: 'Daily' },
      { value: 'weekly', label: `Weekly on ${currentDayName}` },
      { value: 'monthly', label: `Monthly on the ${currentDayOfMonth}${weekSuffix} ${currentDayName}` },
      { value: 'yearly', label: 'Annually' },
      { value: 'weekdays', label: 'Every weekday (Monday to Friday)' },
      { value: 'custom', label: 'Custom...' }
    ];
  };

  // Initialize form data and recurring options
  useEffect(() => {
    if (show) {
      if (event) {
        // Editing existing event
        const startDate = new Date(event.start_date);
        const endDate = new Date(event.end_date);
        
        const newFormData = {
          title: event.title,
          description: event.description || '',
          location: event.location || '',
          start_date: startDate.toISOString().split('T')[0],
          start_time: event.all_day ? '' : startDate.toTimeString().slice(0, 5),
          end_date: endDate.toISOString().split('T')[0],
          end_time: event.all_day ? '' : endDate.toTimeString().slice(0, 5),
          all_day: event.all_day,
          privacy: event.privacy as 'public' | 'private' | 'invite-only',
          color: event.color,
          recurring: event.recurring || {
            is_recurring: false,
            pattern: 'daily',
            interval: 1,
            end_after: null,
            end_date: null,
            days_of_week: [],
            day_of_month: null,
            month_of_year: null
          },
          invited_users: event.invited_users?.map((invite: any) => invite.user._id) || []
        };
        
        setFormData(newFormData);
        
        // Generate recurring options after form data is set
        setTimeout(() => {
          const options = getRecurringOptions();
          setRecurringOptions(options);
        }, 0);
        
      } else {
        // Creating new event
        const date = selectedDate || new Date();
        const startTime = new Date(date);
        startTime.setHours(startTime.getHours() + 1);
        startTime.setMinutes(0);
        
        const endTime = new Date(startTime);
        endTime.setHours(endTime.getHours() + 1);

        const newFormData = {
          title: '',
          description: '',
          location: '',
          start_date: date.toISOString().split('T')[0],
          start_time: startTime.toTimeString().slice(0, 5),
          end_date: date.toISOString().split('T')[0],
          end_time: endTime.toTimeString().slice(0, 5),
          all_day: false,
          privacy: 'private' as 'public' | 'private' | 'invite-only',
          color: '#3788d8',
          recurring: {
            is_recurring: false,
            pattern: 'daily',
            interval: 1,
            end_after: null,
            end_date: null,
            days_of_week: [],
            day_of_month: null,
            month_of_year: null
          },
          invited_users: []
        };
        
        setFormData(newFormData);
        
        // Generate recurring options after form data is set
        setTimeout(() => {
          const options = getRecurringOptions();
          setRecurringOptions(options);
        }, 0);
      }
      fetchUsers();
    }
  }, [show, event, selectedDate]);

  // Update recurring options when start date changes manually
  useEffect(() => {
    if (formData.start_date) {
      const options = getRecurringOptions();
      setRecurringOptions(options);
    }
  }, [formData.start_date]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleRecurringChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      recurring: {
        ...prev.recurring,
        [field]: value
      }
    }));
  };

  const handleRecurringOptionSelect = (option: string) => {
    setShowRecurringDropdown(false);
    
    if (option === 'none') {
      handleRecurringChange('is_recurring', false);
      return;
    }
    
    if (option === 'custom') {
      setShowCustomRecurring(true);
      return;
    }
    
    // Set recurring based on option
    handleRecurringChange('is_recurring', true);
    
    switch (option) {
      case 'daily':
        handleRecurringChange('pattern', 'daily');
        handleRecurringChange('interval', 1);
        handleRecurringChange('days_of_week', []);
        break;
      case 'weekly':
        handleRecurringChange('pattern', 'weekly');
        handleRecurringChange('interval', 1);
        handleRecurringChange('days_of_week', [getCurrentDayOfWeek()]);
        break;
      case 'monthly':
        handleRecurringChange('pattern', 'monthly');
        handleRecurringChange('interval', 1);
        handleRecurringChange('day_of_month', getCurrentDayOfMonth());
        handleRecurringChange('days_of_week', [getCurrentDayOfWeek()]);
        break;
      case 'yearly':
        handleRecurringChange('pattern', 'yearly');
        handleRecurringChange('interval', 1);
        handleRecurringChange('month_of_year', (new Date(formData.start_date)).getMonth() + 1);
        handleRecurringChange('day_of_month', getCurrentDayOfMonth());
        break;
      case 'weekdays':
        handleRecurringChange('pattern', 'weekly');
        handleRecurringChange('interval', 1);
        handleRecurringChange('days_of_week', WEEKDAYS);
        break;
    }
  };

  const handleDayOfWeekToggle = (dayValue: number) => {
    setFormData(prev => ({
      ...prev,
      recurring: {
        ...prev.recurring,
        days_of_week: prev.recurring.days_of_week.includes(dayValue)
          ? prev.recurring.days_of_week.filter(d => d !== dayValue)
          : [...prev.recurring.days_of_week, dayValue]
      }
    }));
  };

  const handleUserToggle = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      invited_users: prev.invited_users.includes(userId)
        ? prev.invited_users.filter(id => id !== userId)
        : [...prev.invited_users, userId]
    }));
  };

  const getRecurringDisplayText = () => {
    if (!formData.recurring.is_recurring) {
      return 'Does not repeat';
    }

    const pattern = formData.recurring.pattern;
    const interval = formData.recurring.interval;
    const daysOfWeek = formData.recurring.days_of_week;

    if (pattern === 'daily') {
      return interval === 1 ? 'Daily' : `Every ${interval} days`;
    }
    
    if (pattern === 'weekly') {
      if (daysOfWeek.length === 5 && daysOfWeek.every(d => WEEKDAYS.includes(d))) {
        return 'Every weekday (Monday to Friday)';
      }
      if (daysOfWeek.length === 1) {
        const dayName = DAYS_OF_WEEK[daysOfWeek[0]].label;
        return interval === 1 ? `Weekly on ${dayName}` : `Every ${interval} weeks on ${dayName}`;
      }
      return interval === 1 ? 'Weekly' : `Every ${interval} weeks`;
    }
    
    if (pattern === 'monthly') {
      return interval === 1 ? 'Monthly' : `Every ${interval} months`;
    }
    
    if (pattern === 'yearly') {
      return interval === 1 ? 'Annually' : `Every ${interval} years`;
    }

    return 'Custom';
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    }

    if (!formData.all_day) {
      if (!formData.start_time) {
        newErrors.start_time = 'Start time is required';
      }
      if (!formData.end_time) {
        newErrors.end_time = 'End time is required';
      }
    }

    if (formData.start_date && formData.end_date) {
      const start = new Date(`${formData.start_date} ${formData.start_time || '00:00'}`);
      const end = new Date(`${formData.end_date} ${formData.end_time || '23:59'}`);
      
      if (start >= end) {
        newErrors.end_date = 'End date/time must be after start date/time';
      }
    }

    if (formData.privacy === 'invite-only' && formData.invited_users.length === 0) {
      newErrors.invited_users = 'Please select at least one user to invite';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // For recurring events being edited, show update options
    if (isEditing && (event?.recurring?.is_recurring || event?.is_recurring_instance)) {
      const startDateTime = new Date(`${formData.start_date} ${formData.start_time || '00:00'}`);
      const endDateTime = new Date(`${formData.end_date} ${formData.end_time || '23:59'}`);

      const eventData = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        start_date: startDateTime.toISOString(),
        end_date: endDateTime.toISOString(),
        all_day: formData.all_day,
        privacy: formData.privacy,
        color: formData.color,
        recurring: formData.recurring.is_recurring ? formData.recurring : null,
        invited_users: formData.privacy === 'invite-only' ? formData.invited_users : []
      };

      setPendingEventData(eventData);
      setShowUpdateOptions(true);
      return;
    }

    // For non-recurring events or new events, proceed normally
    await saveEvent();
  };

  const saveEvent = async (updateType?: 'single' | 'future') => {
    setLoading(true);
    try {
      const startDateTime = new Date(`${formData.start_date} ${formData.start_time || '00:00'}`);
      const endDateTime = new Date(`${formData.end_date} ${formData.end_time || '23:59'}`);

      const eventData = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        start_date: startDateTime.toISOString(),
        end_date: endDateTime.toISOString(),
        all_day: formData.all_day,
        privacy: formData.privacy,
        color: formData.color,
        recurring: formData.recurring.is_recurring ? formData.recurring : null,
        invited_users: formData.privacy === 'invite-only' ? formData.invited_users : [],
        updateType // Add update type for recurring events
      };

      const url = isEditing ? `/api/events/${event._id}` : '/api/events';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        if (isEditing && onSave) { // Changed from onEventUpdated to onSave
          onSave();
        } else {
          onSave(); // Changed from onEventCreated to onSave
        }
        onClose();
        setShowUpdateOptions(false);
        setPendingEventData(null);
      } else {
        const data = await response.json();
        setErrors({ submit: data.message || 'Failed to save event' });
      }
    } catch (error) {
      console.error('Error saving event:', error);
      setErrors({ submit: 'An error occurred while saving the event' });
    } finally {
      setLoading(false);
    }
  };

  const getSelectedUsers = () => {
    return availableUsers.filter(user => formData.invited_users.includes(user._id));
  };

  if (!show) return null;

  return (
    <>
      <div className="modal fade show" style={{ display: 'block', zIndex: 9999 }} tabIndex={-1}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {isEditing ? 'Edit Event' : 'Create New Event'}
              </h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            
            <div className="modal-body">
              <form>
                <div className="row">
                  <div className="col-md-8">
                    <div className="mb-3">
                      <label className="form-label">Title *</label>
                      <input
                        type="text"
                        className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                      />
                      {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                    </div>
                  </div>
                  
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Color</label>
                      <div className="d-flex gap-1">
                        {EVENT_COLORS.map(color => (
                          <div
                            key={color}
                            className={`color-option ${formData.color === color ? 'selected' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => handleInputChange('color', color)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Start Date *</label>
                      <input
                        type="date"
                        className={`form-control ${errors.start_date ? 'is-invalid' : ''}`}
                        value={formData.start_date}
                        onChange={(e) => handleInputChange('start_date', e.target.value)}
                      />
                      {errors.start_date && <div className="invalid-feedback">{errors.start_date}</div>}
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">End Date *</label>
                      <input
                        type="date"
                        className={`form-control ${errors.end_date ? 'is-invalid' : ''}`}
                        value={formData.end_date}
                        onChange={(e) => handleInputChange('end_date', e.target.value)}
                      />
                      {errors.end_date && <div className="invalid-feedback">{errors.end_date}</div>}
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="all_day"
                      checked={formData.all_day}
                      onChange={(e) => handleInputChange('all_day', e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="all_day">
                      All day event
                    </label>
                  </div>
                </div>

                {!formData.all_day && (
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Start Time *</label>
                        <input
                          type="time"
                          className={`form-control ${errors.start_time ? 'is-invalid' : ''}`}
                          value={formData.start_time}
                          onChange={(e) => handleInputChange('start_time', e.target.value)}
                        />
                        {errors.start_time && <div className="invalid-feedback">{errors.start_time}</div>}
                      </div>
                    </div>
                    
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">End Time *</label>
                        <input
                          type="time"
                          className={`form-control ${errors.end_time ? 'is-invalid' : ''}`}
                          value={formData.end_time}
                          onChange={(e) => handleInputChange('end_time', e.target.value)}
                        />
                        {errors.end_time && <div className="invalid-feedback">{errors.end_time}</div>}
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label">
                    <MapPin size={16} className="me-1" />
                    Location
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Enter location"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter event description"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Privacy</label>
                  <div className="d-flex gap-2">
                    <div className="form-check">
                      <input
                        type="radio"
                        className="form-check-input"
                        name="privacy"
                        id="privacy-private"
                        checked={formData.privacy === 'private'}
                        onChange={() => handleInputChange('privacy', 'private')}
                      />
                      <label className="form-check-label" htmlFor="privacy-private">
                        <span className="d-flex align-items-center">
                          <Lock size={16} className="me-1" />
                          Private
                        </span>
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        type="radio"
                        className="form-check-input"
                        name="privacy"
                        id="privacy-public"
                        checked={formData.privacy === 'public'}
                        onChange={() => handleInputChange('privacy', 'public')}
                      />
                      <label className="form-check-label" htmlFor="privacy-public">
                        <span className="d-flex align-items-center">
                          <Eye size={16} className="me-1" />
                          Public
                        </span>
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        type="radio"
                        className="form-check-input"
                        name="privacy"
                        id="privacy-invite"
                        checked={formData.privacy === 'invite-only'}
                        onChange={() => handleInputChange('privacy', 'invite-only')}
                      />
                      <label className="form-check-label" htmlFor="privacy-invite">
                        <span className="d-flex align-items-center">
                          <Users size={16} className="me-1" />
                          Invite Only
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {formData.privacy === 'invite-only' && (
                  <div className="mb-3">
                    <label className="form-label">Invite Users</label>
                    <div className="border rounded p-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {availableUsers.map(user => (
                        <div key={user._id} className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id={`user-${user._id}`}
                            checked={formData.invited_users.includes(user._id)}
                            onChange={() => handleUserToggle(user._id)}
                          />
                          <label className="form-check-label" htmlFor={`user-${user._id}`}>
                            {user.first_name} {user.last_name} ({user.email})
                          </label>
                        </div>
                      ))}
                    </div>
                    {formData.invited_users.length > 0 && (
                      <div className="mt-2">
                        <small className="text-muted">Selected: </small>
                        {getSelectedUsers().map(user => (
                          <span key={user._id} className="badge bg-primary me-1">
                            {user.first_name} {user.last_name}
                          </span>
                        ))}
                      </div>
                    )}
                    {errors.invited_users && (
                      <div className="text-danger small">{errors.invited_users}</div>
                    )}
                  </div>
                )}

                {/* Recurring Event Section */}
                <div className="mb-3">
                  <label className="form-label">Recurring</label>
                  <div className="position-relative">
                    <button
                      type="button"
                      className="btn btn-outline-secondary w-100 text-start d-flex justify-content-between align-items-center"
                      onClick={() => setShowRecurringDropdown(!showRecurringDropdown)}
                    >
                      <span>{getRecurringDisplayText()}</span>
                      <ChevronDown size={16} />
                    </button>
                    
                    {showRecurringDropdown && (
                      <div className="position-absolute top-100 start-0 w-100 bg-white border rounded shadow-sm" style={{ zIndex: 1060 }}>
                        {recurringOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={`btn btn-link w-100 text-start p-2 ${
                              (!formData.recurring.is_recurring && option.value === 'none') ||
                              (formData.recurring.is_recurring && 
                               ((option.value === 'daily' && formData.recurring.pattern === 'daily') ||
                                (option.value === 'weekly' && formData.recurring.pattern === 'weekly' && formData.recurring.days_of_week.length === 1) ||
                                (option.value === 'monthly' && formData.recurring.pattern === 'monthly') ||
                                (option.value === 'yearly' && formData.recurring.pattern === 'yearly') ||
                                (option.value === 'weekdays' && formData.recurring.pattern === 'weekly' && formData.recurring.days_of_week.length === 5)))
                                ? 'bg-light border-start border-primary border-3'
                                : ''
                            }`}
                            onClick={() => handleRecurringOptionSelect(option.value)}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {errors.submit && (
                  <div className="alert alert-danger">
                    {errors.submit}
                  </div>
                )}
              </form>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Saving...' : (isEditing ? 'Update Event' : 'Create Event')}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" style={{ zIndex: 9998 }}></div>

      {/* Custom Recurring Dialog */}
      {showCustomRecurring && (
        <>
          <div className="modal fade show" style={{ display: 'block', zIndex: 9999 }} tabIndex={-1}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Custom recurrence</h5>
                  <button type="button" className="btn-close" onClick={() => setShowCustomRecurring(false)}></button>
                </div>
                
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Repeat every</label>
                    <div className="d-flex align-items-center gap-2">
                      <input
                        type="number"
                        className="form-control"
                        style={{ width: '80px' }}
                        min="1"
                        max="99"
                        value={formData.recurring.interval}
                        onChange={(e) => handleRecurringChange('interval', parseInt(e.target.value))}
                      />
                      <select
                        className="form-select"
                        value={formData.recurring.pattern}
                        onChange={(e) => handleRecurringChange('pattern', e.target.value)}
                      >
                        <option value="daily">day</option>
                        <option value="weekly">week</option>
                        <option value="monthly">month</option>
                        <option value="yearly">year</option>
                      </select>
                    </div>
                  </div>

                  {formData.recurring.pattern === 'weekly' && (
                    <div className="mb-3">
                      <label className="form-label">Repeat on</label>
                      <div className="d-flex gap-1">
                        {DAYS_OF_WEEK.map(day => (
                          <button
                            key={day.value}
                            type="button"
                            className={`btn btn-sm ${
                              formData.recurring.days_of_week.includes(day.value)
                                ? 'btn-primary'
                                : 'btn-outline-secondary'
                            }`}
                            style={{ width: '40px', height: '40px' }}
                            onClick={() => handleDayOfWeekToggle(day.value)}
                          >
                            {day.short}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label">Ends</label>
                    <div className="d-flex flex-column gap-2">
                      <div className="form-check">
                        <input
                          type="radio"
                          className="form-check-input"
                          name="end_type"
                          id="end_never"
                          checked={!formData.recurring.end_after && !formData.recurring.end_date}
                          onChange={() => {
                            handleRecurringChange('end_after', null);
                            handleRecurringChange('end_date', null);
                          }}
                        />
                        <label className="form-check-label" htmlFor="end_never">
                          Never
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          type="radio"
                          className="form-check-input"
                          name="end_type"
                          id="end_on"
                          checked={!!formData.recurring.end_date}
                          onChange={() => {
                            handleRecurringChange('end_after', null);
                            handleRecurringChange('end_date', new Date());
                          }}
                        />
                        <label className="form-check-label" htmlFor="end_on">
                          On
                        </label>
                        {formData.recurring.end_date && (
                          <input
                            type="date"
                            className="form-control ms-4 mt-1"
                            value={formData.recurring.end_date.toISOString().split('T')[0]}
                            onChange={(e) => handleRecurringChange('end_date', new Date(e.target.value))}
                          />
                        )}
                      </div>
                      <div className="form-check">
                        <input
                          type="radio"
                          className="form-check-input"
                          name="end_type"
                          id="end_after"
                          checked={!!formData.recurring.end_after}
                          onChange={() => {
                            handleRecurringChange('end_date', null);
                            handleRecurringChange('end_after', 10);
                          }}
                        />
                        <label className="form-check-label" htmlFor="end_after">
                          After
                        </label>
                        {formData.recurring.end_after && (
                          <div className="d-flex align-items-center gap-2 ms-4 mt-1">
                            <input
                              type="number"
                              className="form-control"
                              style={{ width: '80px' }}
                              min="1"
                              value={formData.recurring.end_after}
                              onChange={(e) => handleRecurringChange('end_after', parseInt(e.target.value))}
                            />
                            <span>occurrences</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowCustomRecurring(false)}>
                    Cancel
                  </button>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => setShowCustomRecurring(false)}
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-backdrop fade show" style={{ zIndex: 9998 }}></div>
          </div>
        </>
      )}

      {/* Update Options Modal for Recurring Events */}
      {showUpdateOptions && (
        <>
          <div className="modal fade show" style={{ display: 'block', zIndex: 9999 }} tabIndex={-1}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Update Recurring Event</h5>
                  <button type="button" className="btn-close" onClick={() => setShowUpdateOptions(false)}></button>
                </div>
                
                <div className="modal-body">
                  <p>How would you like to update this recurring event?</p>
                  <div className="d-flex flex-column gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={() => saveEvent('single')}
                      disabled={loading}
                    >
                      Update this event only
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={() => saveEvent('future')}
                      disabled={loading}
                    >
                      Update this and all future events
                    </button>
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowUpdateOptions(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 9998 }}></div>
        </>
      )}

      <style jsx>{`
        .color-option {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid transparent;
          transition: all 0.2s;
        }

        .color-option:hover {
          transform: scale(1.1);
        }

        .color-option.selected {
          border-color: #333;
          transform: scale(1.1);
        }
      `}</style>
    </>
  );
} 