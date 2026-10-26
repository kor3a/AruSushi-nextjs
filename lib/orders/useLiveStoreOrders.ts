import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '../supabase/client';
import { isCompletedStatus } from './orderDisplay';
import { refetchOnRejoin, useRefetchOnReturn } from '../realtime/catchUp';

export interface StoreOrderItem {
  id: string;
  itemName: string;
  quantity: number;
}

export interface StoreOrder {
  id: string;
  items: StoreOrderItem[];
  total: number | string;
  orderType: string;
  status: string;
  customerName?: string | null;
  readyForPickupAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const FEED_PAGE_SIZE = 10;

async function fetchOrder(orderId: string): Promise<StoreOrder | null> {
  try {
    const response = await fetch(`/api/orders/${orderId}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.order || null;
  } catch {
    return null;
  }
}

async function fetchAdminOrders(params: Record<string, string>) {
  const response = await fetch(`/api/orders/admin-orders?${new URLSearchParams(params).toString()}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch orders');
  return data;
}

function applyStatus(order: StoreOrder, status: string, now: string): StoreOrder {
  return {
    ...order,
    status,
    updatedAt: now,
    ...(status === 'ready' ? { readyForPickupAt: now } : {}),
  };
}

/**
 * Staff homepage data, kept current through the `order-updates` broadcast channel:
 * every active order (no date limit), and one page of all orders, newest first.
 * Both refetch quietly when the tab comes back into view or the connection rejoins,
 * to catch up on broadcasts missed meanwhile. Only fetches when `enabled` (staff accounts).
 */
export function useLiveStoreOrders(enabled: boolean) {
  const [activeOrders, setActiveOrders] = useState<StoreOrder[]>([]);
  const [activeLoading, setActiveLoading] = useState(true);
  const [activeError, setActiveError] = useState('');
  const activeRef = useRef(activeOrders);
  activeRef.current = activeOrders;

  const [feedOrders, setFeedOrders] = useState<StoreOrder[]>([]);
  const [feedTotal, setFeedTotal] = useState(0);
  const [feedPage, setFeedPage] = useState(1);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState('');
  const feedPageRef = useRef(feedPage);
  feedPageRef.current = feedPage;
  const lastFetchedPage = useRef(0);

  // Bumped to refetch both lists in place, without loading states
  const [catchUpCount, setCatchUpCount] = useState(0);
  const catchUp = useCallback(() => setCatchUpCount((n) => n + 1), []);
  useRefetchOnReturn(enabled, catchUp);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const silent = catchUpCount > 0;
    if (!silent) {
      setActiveLoading(true);
      setActiveError('');
    }
    fetchAdminOrders({ view: 'active' })
      .then((data) => {
        if (cancelled) return;
        setActiveOrders(data.orders || []);
        setActiveError('');
      })
      .catch((err) => {
        // A failed catch-up keeps showing what we already have
        if (!cancelled && !silent) setActiveError(err.message || 'Failed to fetch orders');
      })
      .finally(() => {
        if (!cancelled) setActiveLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, catchUpCount]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const silent = lastFetchedPage.current === feedPage;
    lastFetchedPage.current = feedPage;
    if (!silent) {
      setFeedLoading(true);
      setFeedError('');
    }
    fetchAdminOrders({ view: 'recent', page: String(feedPage), pageSize: String(FEED_PAGE_SIZE) })
      .then((data) => {
        if (cancelled) return;
        setFeedOrders(data.orders || []);
        setFeedTotal(data.total || 0);
        setFeedError('');
      })
      .catch((err) => {
        if (!cancelled && !silent) setFeedError(err.message || 'Failed to fetch orders');
      })
      .finally(() => {
        if (!cancelled) setFeedLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, feedPage, catchUpCount]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const supabase = createClient();
    const channel = supabase
      .channel('order-updates')
      .on('broadcast', { event: 'new-order-created' }, async (message) => {
        const orderId = message.payload?.orderId;
        if (!orderId) return;
        const newOrder = await fetchOrder(orderId);
        if (!newOrder || cancelled) return;

        if (!isCompletedStatus(newOrder.status)) {
          setActiveOrders((prev) => (prev.some((o) => o.id === newOrder.id) ? prev : [newOrder, ...prev]));
        }
        setFeedTotal((total) => total + 1);
        // Later pages pick up the shift the next time they're opened
        if (feedPageRef.current === 1) {
          setFeedOrders((prev) =>
            prev.some((o) => o.id === newOrder.id) ? prev : [newOrder, ...prev].slice(0, FEED_PAGE_SIZE)
          );
        }
      })
      .on('broadcast', { event: 'order-status-changed' }, async (message) => {
        const { orderId, status } = message.payload || {};
        if (!orderId || !status) return;
        const now = new Date().toISOString();

        setFeedOrders((prev) => prev.map((o) => (o.id === orderId ? applyStatus(o, status, now) : o)));

        setActiveOrders((prev) => prev.map((o) => (o.id === orderId ? applyStatus(o, status, now) : o)));
        // An order moved back out of Completed isn't in the active list yet
        if (!activeRef.current.some((o) => o.id === orderId) && !isCompletedStatus(status)) {
          const order = await fetchOrder(orderId);
          if (!order || cancelled) return;
          setActiveOrders((prev) => (prev.some((o) => o.id === order.id) ? prev : [order, ...prev]));
        }
      })
      .subscribe(refetchOnRejoin(catchUp));

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [enabled, catchUp]);

  const goToFeedPage = useCallback((page: number) => setFeedPage(Math.max(1, page)), []);

  return {
    active: { orders: activeOrders, loading: activeLoading, error: activeError },
    feed: {
      orders: feedOrders,
      page: feedPage,
      totalPages: Math.max(1, Math.ceil(feedTotal / FEED_PAGE_SIZE)),
      goToPage: goToFeedPage,
      loading: feedLoading,
      error: feedError,
    },
  };
}

/** Re-renders every `intervalMs` so relative times ("5m ago") stay current */
export function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
