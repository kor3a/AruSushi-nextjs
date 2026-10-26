import { getPickupStatusLabel } from './pickupStatus';

// How staff-facing pages (admin Orders, the staff homepage) label and color orders

export const COMPLETED_STATUSES = new Set(['picked_up', 'delivered', 'cancelled']);

export function isCompletedStatus(status: string): boolean {
  return COMPLETED_STATUSES.has(status);
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  pending: { bg: 'rgba(158, 158, 158, 0.15)', border: 'rgba(158, 158, 158, 0.5)', text: '#bbb' },
  confirmed: { bg: 'rgba(33, 150, 243, 0.15)', border: 'rgba(33, 150, 243, 0.5)', text: '#64b5f6' },
  preparing: { bg: 'rgba(255, 152, 0, 0.15)', border: 'rgba(255, 152, 0, 0.5)', text: '#ffb74d' },
  ready: { bg: 'rgba(76, 175, 80, 0.15)', border: 'rgba(76, 175, 80, 0.5)', text: '#81c784' },
  picked_up: { bg: 'rgba(0, 200, 83, 0.15)', border: 'rgba(0, 200, 83, 0.5)', text: '#69f0ae' },
  delivered: { bg: 'rgba(0, 200, 83, 0.15)', border: 'rgba(0, 200, 83, 0.5)', text: '#69f0ae' },
  cancelled: { bg: 'rgba(244, 67, 54, 0.15)', border: 'rgba(244, 67, 54, 0.5)', text: '#ef5350' },
};

export function getStatusColor(status: string) {
  return STATUS_COLORS[status] || STATUS_COLORS.pending;
}

export function getStatusLabel(orderType: string, status: string): string {
  if (orderType === 'pickup') {
    return getPickupStatusLabel(status);
  }
  const labels: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    ready: 'Ready',
    picked_up: 'Picked Up',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  return labels[status] || status.charAt(0).toUpperCase() + status.slice(1);
}

export function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const then = new Date(dateString);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

/** Page buttons to show, collapsing long runs into an ellipsis: 1 … 4 5 6 … 12 */
export function getPageNumbers(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  const pages: (number | 'ellipsis')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  }
  pages.push(1);
  if (currentPage > 3) pages.push('ellipsis');
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (currentPage < totalPages - 2) pages.push('ellipsis');
  pages.push(totalPages);
  return pages;
}
