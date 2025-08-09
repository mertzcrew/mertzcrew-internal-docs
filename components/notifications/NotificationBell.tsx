import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  policy_id: {
    _id: string;
    title: string;
    category: string;
    organization: string;
  };
}

interface NotificationData {
  notifications: Notification[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

function NotificationBell() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!session) return;

    try {
      setLoading(true);
      const response = await fetch('/api/notifications?limit=5');
      if (response.ok) {
        const data: { success: boolean; data: NotificationData } = await response.json();
        if (data.success) {
          setNotifications(data.data.notifications);
          setUnreadCount(data.data.unreadCount);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId }),
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId 
              ? { ...notif, is_read: true }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markAllAsRead: true }),
      });

      if (response.ok) {
        setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification._id);
    }
    setIsOpen(false);
    router.push(`/policy/${notification.policy_id._id}`);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch notifications on component mount and session change
  useEffect(() => {
    fetchNotifications();
  }, [session]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return `${Math.floor(diffInHours / 24)}d ago`;
    }
  };

  if (!session) return null;

  return (
    <div className="position-relative" ref={dropdownRef}>
      <button
        className="btn btn-link position-relative p-2"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <i className="bi bi-bell fs-5"></i>
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="dropdown-menu dropdown-menu-end show position-absolute" style={{ minWidth: '350px', maxHeight: '400px', overflowY: 'auto' }}>
          <div className="dropdown-header d-flex justify-content-between align-items-center">
            <h6 className="mb-0">Notifications</h6>
            {unreadCount > 0 && (
              <button
                className="btn btn-sm btn-link text-primary p-0"
                onClick={markAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>
          
          {loading ? (
            <div className="dropdown-item text-center">
              <div className="spinner-border spinner-border-sm" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="dropdown-item text-center text-muted">
              No notifications
            </div>
          ) : (
            <>
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`dropdown-item cursor-pointer ${!notification.is_read ? 'bg-light' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <div className="fw-semibold text-truncate">
                        {notification.title}
                      </div>
                      <div className="text-muted small text-truncate">
                        {notification.message}
                      </div>
                      <div className="text-muted small">
                        {formatDate(notification.created_at)}
                      </div>
                    </div>
                    {!notification.is_read && (
                      <div className="badge bg-primary rounded-circle" style={{ width: '8px', height: '8px' }}></div>
                    )}
                  </div>
                </div>
              ))}
              
              <div className="dropdown-divider"></div>
              <div className="dropdown-item text-center">
                <button
                  className="btn btn-sm btn-link p-0"
                  onClick={() => {
                    setIsOpen(false);
                    router.push('/notifications');
                  }}
                >
                  View all notifications
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell; 