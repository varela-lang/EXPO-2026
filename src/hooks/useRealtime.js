import { useEffect, useState, useRef } from 'react';
import { subscribeToDashboardRealtime, getRecentActivity } from '../services/dashboard';

/**
 * useRealtime hook for live updates, toast notifications, and recent activity feed
 */
export function useRealtime(onDataUpdate) {
  const [lastNotification, setLastNotification] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const onDataUpdateRef = useRef(onDataUpdate);

  // Keep callback reference updated without triggering re-subscriptions
  useEffect(() => {
    onDataUpdateRef.current = onDataUpdate;
  }, [onDataUpdate]);

  useEffect(() => {
    let isMounted = true;

    // 1. Initial load of recent activities from history/cache
    getRecentActivity(20)
      .then((acts) => {
        if (isMounted && Array.isArray(acts) && acts.length > 0) {
          setRecentEvents((prev) => {
            const seenIds = new Set(prev.map((e) => e.id));
            const additions = acts.filter((a) => !seenIds.has(a.id));
            return [...prev, ...additions].slice(0, 25);
          });
        }
      })
      .catch((err) => {
        console.warn('Error loading initial recent activities in useRealtime:', err);
      });

    // 2. Subscribe to realtime events across Supabase, WebSockets, and cross-tab bus
    const unsubscribe = subscribeToDashboardRealtime((event) => {
      if (!event || !event.type) return;
      const { type, payload } = event;

      if (type === 'INVESTMENT_CREATED') {
        const notif = {
          id: payload?.id || (crypto.randomUUID ? crypto.randomUUID() : 'ev-' + Date.now() + Math.random()),
          type: 'investment',
          title: 'NUEVA INVERSIÓN',
          amount: payload?.amount,
          projectName: payload?.project?.name || 'Proyecto',
          projectId: payload?.project?.id || payload?.project_id,
          timestamp: payload?.timestamp || new Date().toISOString(),
        };
        setLastNotification(notif);
        setRecentEvents((prev) => [notif, ...prev.filter((e) => e.id !== notif.id)].slice(0, 25));
      } else if (type === 'CUSTOMER_TOKEN_CREATED') {
        const notif = {
          id: payload?.id || (crypto.randomUUID ? crypto.randomUUID() : 'ev-' + Date.now() + Math.random()),
          type: 'customer_token',
          title: 'NUEVO CUSTOMER TOKEN',
          amount: null,
          projectName: payload.project?.name || 'Proyecto',
          projectId: payload.project?.id || payload.project_id,
          timestamp: payload.timestamp || new Date().toISOString(),
        };
        setLastNotification(notif);
        setRecentEvents((prev) => [notif, ...prev.filter((e) => e.id !== notif.id)].slice(0, 25));
      }

      if (onDataUpdateRef.current) {
        try {
          onDataUpdateRef.current(event);
        } catch (err) {
          console.error('Error executing onDataUpdate callback:', err);
        }
      }
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Clear single pop-up notification after 4.5s
  useEffect(() => {
    if (!lastNotification) return;
    const timer = setTimeout(() => {
      setLastNotification(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [lastNotification]);

  return {
    lastNotification,
    clearNotification: () => setLastNotification(null),
    recentEvents,
  };
}
