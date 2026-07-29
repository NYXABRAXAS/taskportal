import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import type { ActivityItem } from '@/lib/types';

const LAST_SEEN_KEY = 'notifications_last_seen';

export function useNotifications() {
  const [lastSeen, setLastSeen] = useState<string>(() => localStorage.getItem(LAST_SEEN_KEY) || '');

  const { data, isLoading } = useQuery({
    queryKey: ['activity'],
    queryFn: async () => {
      const res = await api.get<{ activity: ActivityItem[] }>('/activity', { params: { limit: 50 } });
      return res.data.activity;
    },
    refetchInterval: 30_000,
  });

  const items = data || [];
  const unreadCount = lastSeen ? items.filter((a) => a.timestamp > lastSeen).length : items.length;

  function markAllRead() {
    const now = new Date().toISOString();
    localStorage.setItem(LAST_SEEN_KEY, now);
    setLastSeen(now);
  }

  return { items, isLoading, unreadCount, markAllRead };
}
