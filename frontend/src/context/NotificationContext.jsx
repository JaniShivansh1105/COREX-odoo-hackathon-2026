import { createContext, useContext, useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';

/**
 * NotificationContext
 * Manages in-app notifications and audit trail
 * Stores data in localStorage for demo purposes
 */
const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    const storedNotifications = localStorage.getItem('gearguard_notifications');
    const storedAuditLogs = localStorage.getItem('gearguard_audit_logs');

    if (storedNotifications) {
      setNotifications(JSON.parse(storedNotifications));
    }
    if (storedAuditLogs) {
      setAuditLogs(JSON.parse(storedAuditLogs));
    }
  }, []);

  // Save to localStorage when data changes
  useEffect(() => {
    localStorage.setItem('gearguard_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('gearguard_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  /**
   * Add a new notification
   * @param {Object} notification - { type, message, entityType, entityId, recipientRoles }
   */
  const addNotification = (notification) => {
    if (!user) return;

    // Check if user should receive this notification
    const { recipientRoles, recipientId } = notification;

    const shouldReceive =
      (recipientRoles && recipientRoles.includes(user.role)) ||
      (recipientId && recipientId === user._id);

    if (!shouldReceive) return;

    const newNotification = {
      id: Date.now() + Math.random(),
      ...notification,
      timestamp: new Date().toISOString(),
      isRead: false,
      userId: user._id,
    };

    setNotifications((prev) => [newNotification, ...prev]);
  };

  /**
   * Mark notification as read
   * @param {string} notificationId
   */
  const markAsRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
  };

  /**
   * Clear all notifications
   */
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  /**
   * Get unread count
   */
  const getUnreadCount = () => {
    if (!user) return 0;
    return notifications.filter(
      (notif) => !notif.isRead && notif.userId === user._id
    ).length;
  };

  /**
   * Get user's notifications
   */
  const getUserNotifications = () => {
    if (!user) return [];
    return notifications.filter((notif) => notif.userId === user._id);
  };

  /**
   * Add audit log entry
   * @param {Object} log - { action, entityType, entityId, details }
   */
  const addAuditLog = (log) => {
    if (!user) return;

    const newLog = {
      id: Date.now() + Math.random(),
      ...log,
      performedBy: {
        id: user._id,
        name: user.name,
        role: user.role,
      },
      timestamp: new Date().toISOString(),
    };

    setAuditLogs((prev) => [newLog, ...prev]);
  };

  /**
   * Get audit logs with optional filters
   * @param {Object} filters - { entityType, action, startDate, endDate }
   */
  const getAuditLogs = (filters = {}) => {
    let filtered = [...auditLogs];

    if (filters.entityType) {
      filtered = filtered.filter((log) => log.entityType === filters.entityType);
    }

    if (filters.action) {
      filtered = filtered.filter((log) => log.action === filters.action);
    }

    if (filters.startDate) {
      filtered = filtered.filter(
        (log) => new Date(log.timestamp) >= new Date(filters.startDate)
      );
    }

    if (filters.endDate) {
      filtered = filtered.filter(
        (log) => new Date(log.timestamp) <= new Date(filters.endDate)
      );
    }

    return filtered;
  };

  /**
   * Clear all audit logs (Admin only)
   */
  const clearAuditLogs = () => {
    if (user && user.role === 'Admin') {
      setAuditLogs([]);
    }
  };

  const value = {
    notifications: getUserNotifications(),
    auditLogs,
    addNotification,
    markAsRead,
    clearAllNotifications,
    getUnreadCount,
    addAuditLog,
    getAuditLogs,
    clearAuditLogs,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export default NotificationContext;
