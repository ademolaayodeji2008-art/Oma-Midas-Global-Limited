/**
 * useNotifications.js — Fetches and manages notification state.
 * Polls unread count every 60 seconds.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../lib/api';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/api/notifications');
      const data = res.data.notifications || res.data || [];
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.isRead).length);
    } catch {
      // Silently ignore — user may not be authenticated yet
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markRead = useCallback(async (ids) => {
    try {
      await api.post('/api/notifications/mark-read', { ids });
      setNotifications((prev) =>
        prev.map((n) => (ids.includes(n.id) ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - ids.length));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Poll unread count every 60s
    intervalRef.current = setInterval(() => {
      api.get('/api/notifications?limit=1')
        .then((res) => {
          const data = res.data.notifications || res.data || [];
          setUnreadCount(data.filter((n) => !n.isRead).length);
        })
        .catch(() => {});
    }, 60_000);

    return () => clearInterval(intervalRef.current);
  }, [fetchNotifications]);

  return { notifications, unreadCount, loading, markRead, refetch };
}
