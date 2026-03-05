export const DELIVERY_STATUS_STEPS = [
  'confirmed',
  'dasher_confirmed',
  'dasher_at_store',
  'picked_up',
  'dasher_near_customer',
  'delivered',
] as const;

export type DeliveryStatusStep = (typeof DELIVERY_STATUS_STEPS)[number];

const DOORDASH_EVENT_TO_STATUS: Record<string, DeliveryStatusStep> = {
  DASHER_CONFIRMED: 'dasher_confirmed',
  DASHER_CONFIRMED_PICKUP_ARRIVAL: 'dasher_at_store',
  DASHER_PICKED_UP: 'picked_up',
  DASHER_CONFIRMED_DROPOFF_ARRIVAL: 'dasher_near_customer',
  DASHER_DROPPED_OFF: 'delivered',
};

export function doordashEventToDeliveryStatus(event: string): DeliveryStatusStep | null {
  return DOORDASH_EVENT_TO_STATUS[event] || null;
}

export function doordashEventToOrderStatus(event: string): string | null {
  switch (event) {
    case 'DASHER_CONFIRMED':
    case 'DASHER_CONFIRMED_PICKUP_ARRIVAL':
      return 'confirmed';
    case 'DASHER_PICKED_UP':
    case 'DASHER_CONFIRMED_DROPOFF_ARRIVAL':
      return 'preparing';
    case 'DASHER_DROPPED_OFF':
      return 'delivered';
    case 'DELIVERY_CANCELLED':
      return 'cancelled';
    default:
      return null;
  }
}

export function getDeliveryStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Order Placed',
    confirmed: 'Order Confirmed',
    dasher_confirmed: 'Dasher Assigned',
    dasher_at_store: 'Dasher at Restaurant',
    picked_up: 'Out for Delivery',
    dasher_near_customer: 'Dasher Nearby',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  return labels[status] || status;
}

export function getDeliveryEventLabel(event: string): string {
  const labels: Record<string, string> = {
    DASHER_CONFIRMED: 'A Dasher has been assigned and is heading to the restaurant',
    DASHER_CONFIRMED_PICKUP_ARRIVAL: 'Your Dasher has arrived at the restaurant',
    DASHER_PICKED_UP: 'Your Dasher has picked up your order and is on the way',
    DASHER_CONFIRMED_DROPOFF_ARRIVAL: 'Your Dasher is arriving at your location',
    DASHER_DROPPED_OFF: 'Your order has been delivered!',
    DELIVERY_CANCELLED: 'The delivery has been cancelled',
  };
  return labels[event] || event;
}

export function getDeliveryProgressIndex(deliveryEvent: string | null | undefined): number {
  if (!deliveryEvent) return 0;

  const status = DOORDASH_EVENT_TO_STATUS[deliveryEvent];
  if (!status) return 0;

  return DELIVERY_STATUS_STEPS.indexOf(status);
}
