'use client';

import React, { useState, useEffect } from 'react';
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

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Fetch notifications
  const fetchNotifications = async (page = 1, unreadOnly = false) => {
    if (!session) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(unreadOnly && { unread: 'true' })
      });

      const response = await fetch(`/api/notifications?${params}`);
      if (response.ok) {
        const data: { success: boolean; data: NotificationData } = await response.json();
        if (data.success) {
          setNotifications(data.data.notifications);
          setUnreadCount(data.data.unreadCount);
          setCurrentPage(data.data.pagination.page);
          setTotalPages(data.data.pagination.totalPages);
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
    router.push(`/policy/${notification.policy_id._id}`);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    fetchNotifications(page, showUnreadOnly);
  };

  // Handle filter change
  const handleFilterChange = (unreadOnly: boolean) => {
    setShowUnreadOnly(unreadOnly);
    setCurrentPage(1);
    fetchNotifications(1, unreadOnly);
  };

  // Fetch notifications on component mount and session change
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    fetchNotifications(1, showUnreadOnly);
  }, [session, status]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (status === 'loading') {
    return (
      <div className="container-fluid">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="h3">Notifications</h1>
            <div className="d-flex gap-2">
              {unreadCount > 0 && (
                <button
                  className="btn btn-outline-primary"
                  onClick={markAllAsRead}
                >
                  Mark all as read ({unreadCount})
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <ul className="nav nav-tabs mb-3">
            <li className="nav-item">
              <button
                className={`nav-link ${!showUnreadOnly ? 'active' : ''}`}
                onClick={() => handleFilterChange(false)}
              >
                All
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${showUnreadOnly ? 'active' : ''}`}
                onClick={() => handleFilterChange(true)}
              >
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </button>
            </li>
          </ul>

          {/* Notifications List */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-bell-slash fs-1 text-muted"></i>
              <h4 className="mt-3 text-muted">
                {showUnreadOnly ? 'No unread notifications' : 'No notifications yet'}
              </h4>
              <p className="text-muted">
                {showUnreadOnly 
                  ? 'All caught up! Check back later for new notifications.'
                  : 'Notifications will appear here when new policies are published.'
                }
              </p>
            </div>
          ) : (
            <>
              <div className="list-group">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`list-group-item list-group-item-action cursor-pointer ${
                      !notification.is_read ? 'list-group-item-light border-start border-primary border-3' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="d-flex w-100 justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center mb-1">
                          <h6 className={`mb-0 ${!notification.is_read ? 'fw-bold' : ''}`}>
                            {notification.title}
                          </h6>
                          {!notification.is_read && (
                            <div className="badge bg-primary rounded-circle ms-2" style={{ width: '8px', height: '8px' }}></div>
                          )}
                        </div>
                        <p className="mb-1 text-muted">
                          {notification.message}
                        </p>
                        <div className="d-flex align-items-center text-muted small">
                          <span className="badge bg-secondary me-2">
                            {notification.policy_id.category}
                          </span>
                          <span className="badge bg-light text-dark me-2">
                            {notification.policy_id.organization}
                          </span>
                          <span>{formatDate(notification.created_at)}</span>
                        </div>
                      </div>
                      <div className="text-end">
                        <i className="bi bi-chevron-right text-muted"></i>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav className="d-flex justify-content-center mt-4">
                  <ul className="pagination">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                    </li>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                      return (
                        <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                          <button
                            className="page-link"
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </button>
                        </li>
                      );
                    })}
                    
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 