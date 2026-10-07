'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────

export interface EventData {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  eventType: 'promotion' | 'tournament' | 'seasonal' | 'special';
  gameSlug: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  sortOrder: number;
  badge: string;
  badgeColor: 'amber' | 'rose' | 'emerald' | 'blue' | 'purple';
  rewardType?: string; // 'xp', 'gems', 'frame', 'cover', 'dice', 'none'
  rewardAmount?: number;
  rewardDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export type EventStatus = 'active' | 'expired' | 'upcoming';

export interface UseEventsReturn {
  events: EventData[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  filterByType: (type: EventData['eventType'] | 'all') => EventData[];
  filterByActive: () => EventData[];
  getEventStatus: (event: EventData) => EventStatus;
}

// ─── Helper: compute event status ──────────────────────────────────────

function computeStatus(event: EventData): EventStatus {
  const now = Date.now();
  const start = new Date(event.startDate).getTime();
  const end = new Date(event.endDate).getTime();

  if (now < start) return 'upcoming';
  if (now > end) return 'expired';
  return 'active';
}

// ─── Hook ────────────────────────────────────────────────────────────────

export function useEvents(): UseEventsReturn {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/events');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      if (data.events && Array.isArray(data.events)) {
        setEvents(data.events);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء التحميل');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const filterByType = useCallback(
    (type: EventData['eventType'] | 'all') => {
      if (type === 'all') return events;
      return events.filter((e) => e.eventType === type);
    },
    [events],
  );

  const filterByActive = useCallback(() => {
    return events.filter((e) => computeStatus(e) === 'active');
  }, [events]);

  const getEventStatus = useCallback((event: EventData) => {
    return computeStatus(event);
  }, []);

  return { events, loading, error, refetch: fetchEvents, filterByType, filterByActive, getEventStatus };
}

export default useEvents;
