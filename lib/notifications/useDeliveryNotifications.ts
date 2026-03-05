import { useEffect, useCallback, useRef } from 'react';

const EVENT_NOTIFICATIONS: Record<string, { title: string; body: string; icon: string }> = {
  DASHER_CONFIRMED: {
    title: 'Dasher Assigned!',
    body: 'A Dasher has accepted your delivery and is heading to the restaurant.',
    icon: '🚗',
  },
  DASHER_CONFIRMED_PICKUP_ARRIVAL: {
    title: 'Dasher at Restaurant',
    body: 'Your Dasher has arrived at the restaurant to pick up your order.',
    icon: '🏪',
  },
  DASHER_PICKED_UP: {
    title: 'Order Picked Up!',
    body: 'Your Dasher has your order and is on the way to you.',
    icon: '📦',
  },
  DASHER_CONFIRMED_DROPOFF_ARRIVAL: {
    title: 'Dasher Nearby!',
    body: 'Your Dasher is arriving at your location.',
    icon: '📍',
  },
  DASHER_DROPPED_OFF: {
    title: 'Order Delivered!',
    body: 'Your order has been delivered. Enjoy your meal!',
    icon: '✅',
  },
  DELIVERY_CANCELLED: {
    title: 'Delivery Cancelled',
    body: 'Your delivery has been cancelled. Please contact support for assistance.',
    icon: '❌',
  },
};

export function useDeliveryNotifications() {
  const permissionRef = useRef<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    permissionRef.current = Notification.permission;
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;

    if (Notification.permission === 'granted') {
      permissionRef.current = 'granted';
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const result = await Notification.requestPermission();
    permissionRef.current = result;
    return result === 'granted';
  }, []);

  const sendNotification = useCallback((eventName: string, dasherName?: string | null) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const config = EVENT_NOTIFICATIONS[eventName];
    if (!config) return;

    let body = config.body;
    if (dasherName && (eventName === 'DASHER_CONFIRMED' || eventName === 'DASHER_PICKED_UP')) {
      body = body.replace('A Dasher', dasherName).replace('Your Dasher', dasherName);
    }

    try {
      const options: NotificationOptions & { renotify?: boolean } = {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `doordash-${eventName}`,
        renotify: true,
      };
      new Notification(config.title, options as NotificationOptions);
    } catch {
      // Notification API may not be available in all contexts
    }
  }, []);

  return { requestPermission, sendNotification };
}
