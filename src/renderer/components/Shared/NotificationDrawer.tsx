// components/Shared/NotificationDrawer.tsx (In-App Notifications)
import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Bell,
  CheckCheck,
  Trash2,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format } from "date-fns";
import notificationAPI, {
  type Notification,
} from "../../api/core/notification";
import { dialogs } from "../../utils/dialogs";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const limit = 15;

  // Reset when drawer opens
  useEffect(() => {
    if (isOpen) {
      setPage(1);
      setNotifications([]);
      fetchUnreadCount();
    }
  }, [isOpen]);

  // Fetch notifications when page changes
  useEffect(() => {
    if (!isOpen) return;
    fetchNotifications(page === 1);
  }, [page, isOpen]);

  const fetchNotifications = async (reset: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationAPI.getAll({
        page,
        limit,
        sortBy: "createdAt",
        sortOrder: "DESC",
      });
      if (response.status) {
        const items = response.data.data;
        setNotifications((prev) => (reset ? items : [...prev, ...items]));
        setHasMore(items.length === limit);
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationAPI.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error("Failed to fetch unread count", err);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      const response = await notificationAPI.markAsRead(id);
      if (response.status) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      dialogs.alert({ title: "Error", message: err.message });
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    if (unreadIds.length === 0) return;

    try {
      const response = await notificationAPI.markManyAsRead(unreadIds);
      if (response.status) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true }))
        );
        setUnreadCount(0);
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      dialogs.alert({ title: "Error", message: err.message });
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await dialogs.confirm({
      title: "Delete Notification",
      message: "Are you sure you want to delete this notification?",
    });
    if (!confirmed) return;

    try {
      const response = await notificationAPI.delete(id);
      if (response.status) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        const wasUnread = notifications.find((n) => n.id === id)?.isRead === false;
        if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      dialogs.alert({ title: "Error", message: err.message });
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      setPage((prev) => prev + 1);
    }
  };

  const toggleExpanded = (id: number) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const isLongMessage = (message: string) => message.length > 100;

  const getTypeIcon = (type: Notification["type"]) => {
    switch (type) {
      case "payment_confirmation":
        return <div className="w-2 h-2 rounded-full bg-[var(--accent-green)]" />;
      case "overdue":
        return <div className="w-2 h-2 rounded-full bg-[var(--accent-red)]" />;
      case "reminder":
        return <div className="w-2 h-2 rounded-full bg-[var(--accent-orange)]" />;
      default:
        return <div className="w-2 h-2 rounded-full bg-[var(--text-tertiary)]" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-[var(--card-bg)] border-l border-[var(--border-color)] shadow-xl transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-[var(--accent-blue)]" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 text-sm font-normal text-[var(--accent-blue)]">
                    ({unreadCount} unread)
                  </span>
                )}
              </h2>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-[var(--card-hover-bg)] rounded">
              <X className="w-5 h-5 text-[var(--text-tertiary)]" />
            </button>
          </div>

          {/* Actions */}
          {notifications.length > 0 && (
            <div className="flex items-center justify-end gap-2 p-2 border-b border-[var(--border-color)]">
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-[var(--accent-blue)] hover:bg-[var(--accent-blue-light)] rounded transition-colors"
                disabled={unreadCount === 0}
              >
                <CheckCheck className="w-4 h-4" />
                Mark all as read
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-blue)]" />
              </div>
            ) : error ? (
              <div className="text-center p-6">
                <AlertCircle className="w-10 h-10 mx-auto mb-2 text-[var(--accent-red)]" />
                <p className="text-sm text-[var(--text-primary)]">{error}</p>
                <button
                  onClick={() => {
                    setPage(1);
                    setNotifications([]);
                    fetchNotifications(true);
                  }}
                  className="mt-3 px-4 py-2 bg-[var(--accent-blue)] text-white rounded text-sm"
                >
                  Retry
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center p-6">
                <Bell className="w-10 h-10 mx-auto mb-2 text-[var(--text-tertiary)]" />
                <p className="text-sm text-[var(--text-primary)]">
                  No notifications yet
                </p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  When you get notifications, they'll appear here.
                </p>
              </div>
            ) : (
              <>
                {notifications.map((notification) => {
                  const expanded = expandedIds.has(notification.id);
                  const longMessage = isLongMessage(notification.message);
                  const isUnread = !notification.isRead;

                  return (
                    <div
                      key={notification.id}
                      className={`
                        group relative p-4 rounded-xl transition-all duration-200
                        ${isUnread
                          ? "bg-[var(--card-bg)] border-l-4 border-l-[var(--accent-blue)] shadow-sm hover:shadow-md"
                          : "bg-[var(--card-secondary-bg)] border border-[var(--border-color)] hover:border-[var(--border-light)]"
                        }
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getTypeIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-sm font-medium ${isUnread ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
                              {notification.title}
                            </p>
                            {isUnread && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent-blue-light)] text-[var(--accent-blue)]">
                                New
                              </span>
                            )}
                          </div>

                          <div className="mt-1.5">
                            <p
                              className={`text-sm ${isUnread ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"} ${!expanded ? "line-clamp-2" : ""}`}
                            >
                              {notification.message}
                            </p>
                            {longMessage && (
                              <button
                                onClick={() => toggleExpanded(notification.id)}
                                className="mt-1.5 text-xs text-[var(--accent-blue)] hover:underline flex items-center gap-1"
                              >
                                {expanded ? (
                                  <>
                                    Show less <ChevronUp className="w-3 h-3" />
                                  </>
                                ) : (
                                  <>
                                    Read more <ChevronDown className="w-3 h-3" />
                                  </>
                                )}
                              </button>
                            )}
                          </div>

                          <p className="text-xs text-[var(--text-tertiary)] mt-2.5">
                            {format(
                              new Date(notification.createdAt),
                              "MMM dd, yyyy • hh:mm a"
                            )}
                          </p>

                          {notification.debt && expanded && (
                            <div className="mt-3 text-xs text-[var(--text-tertiary)] bg-[var(--card-bg)] p-2 rounded-md border border-[var(--border-color)]">
                              <span className="font-medium">Debt ID:</span>{" "}
                              {notification.debt.id}
                              {notification.debt.borrower && (
                                <>
                                  <br />
                                  <span className="font-medium">Borrower:</span>{" "}
                                  {notification.debt.borrower.name}
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isUnread && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="p-1.5 hover:bg-[var(--card-hover-bg)] rounded-md"
                              title="Mark as read"
                            >
                              <CheckCheck className="w-4 h-4 text-[var(--accent-blue)]" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(notification.id)}
                            className="p-1.5 hover:bg-[var(--card-hover-bg)] rounded-md"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-[var(--accent-red)]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {hasMore && (
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="w-full py-2.5 text-sm text-[var(--accent-blue)] hover:bg-[var(--accent-blue-light)] rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      "Load more"
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};