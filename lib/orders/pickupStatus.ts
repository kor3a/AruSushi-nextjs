export const PICKUP_STATUS_STEPS = ['confirmed', 'preparing', 'ready', 'picked_up'] as const;

export type PickupStatusStep = (typeof PICKUP_STATUS_STEPS)[number];

export function getPickupStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    confirmed: 'Order Confirmed',
    preparing: 'Prepping',
    ready: 'Ready for Pick Up',
    picked_up: 'Picked Up',
  };

  return labels[status] || status;
}

export function normalizePickupStatus(status: string): PickupStatusStep | null {
  if (status === 'delivered') {
    return 'picked_up';
  }

  if (PICKUP_STATUS_STEPS.includes(status as PickupStatusStep)) {
    return status as PickupStatusStep;
  }

  return null;
}

export function getPickupProgressIndex(status: string): number {
  const normalized = normalizePickupStatus(status);
  if (!normalized) {
    return -1;
  }

  return PICKUP_STATUS_STEPS.indexOf(normalized);
}

export function isPickupOrderActive(status: string): boolean {
  const normalized = normalizePickupStatus(status);
  return normalized !== 'picked_up' && status !== 'cancelled';
}

