import { useEffect, useMemo, useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useAuth } from '../../contexts/AuthContext';
import { canManageOrders } from '../../lib/auth/roles';
import { getPickupStatusLabel } from '../../lib/orders/pickupStatus';

interface OrderItem {
  id: string;
  itemName: string;
  itemPrice: number | string;
  quantity: number;
  specialNotes?: string | null;
}

interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number | string;
  orderType: string;
  status: string;
  paymentStatus: string;
  deliveryAddress?: string | null;
  deliveryPhone?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getDefaultStartDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return formatDateForInput(date);
}

function getDefaultEndDate(): string {
  return formatDateForInput(new Date());
}

interface PauseState {
  ordersPaused: boolean;
  pauseReason: string | null;
  resumeAt: string | null;
}

const ORDERS_PER_PAGE = 12;

const COMPLETED_STATUSES = new Set(['picked_up', 'delivered', 'cancelled']);

function isOrderCompleted(order: Order): boolean {
  return COMPLETED_STATUSES.has(order.status);
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

function getStatusColor(status: string) {
  return STATUS_COLORS[status] || STATUS_COLORS.pending;
}

function formatTimeAgo(dateString: string): string {
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

interface OrderSectionProps {
  title: string;
  titleColor: string;
  accentColor: string;
  badgeCount: number;
  orders: Order[];
  emptyMessage: string;
  currentPage: number;
  totalPages: number;
  goToPage: (page: number) => void;
  getPageNumbers: (currentPage: number, totalPages: number) => (number | 'ellipsis')[];
  expandedOrderId: string | null;
  setExpandedOrderId: (id: string | null) => void;
  updatingOrderId: string | null;
  updateOrderStatus: (orderId: string, status: string) => void;
  getStatusOptions: (orderType: string, currentStatus: string) => string[];
  getStatusLabel: (orderType: string, status: string) => string;
}

function OrderSection({
  title,
  titleColor,
  accentColor,
  badgeCount,
  orders,
  emptyMessage,
  currentPage,
  totalPages,
  goToPage,
  getPageNumbers,
  expandedOrderId,
  setExpandedOrderId,
  updatingOrderId,
  updateOrderStatus,
  getStatusOptions,
  getStatusLabel,
}: OrderSectionProps) {
  return (
    <div style={{ marginBottom: '40px' }}>
      {/* Section Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: `2px solid ${accentColor}`,
        }}
      >
        <h2 style={{ color: titleColor, fontSize: '22px', fontWeight: 700, margin: 0 }}>
          {title}
        </h2>
        <span
          style={{
            background: accentColor,
            color: titleColor,
            fontSize: '13px',
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: '12px',
            minWidth: '28px',
            textAlign: 'center',
          }}
        >
          {badgeCount}
        </span>
      </div>

      {orders.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.03)',
            border: `1px solid ${accentColor}`,
            borderRadius: '12px',
            padding: '32px 24px',
            color: '#888',
          }}
        >
          <p style={{ fontSize: '15px', margin: 0 }}>{emptyMessage}</p>
        </div>
      ) : (
        <>
          {/* Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '20px',
            }}
          >
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                isExpanded={expandedOrderId === order.id}
                onToggleExpand={() =>
                  setExpandedOrderId(expandedOrderId === order.id ? null : order.id)
                }
                isUpdating={updatingOrderId === order.id}
                updateOrderStatus={updateOrderStatus}
                getStatusOptions={getStatusOptions}
                getStatusLabel={getStatusLabel}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '24px',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: currentPage === 1 ? 'transparent' : 'rgba(255,255,255,0.06)',
                    color: currentPage === 1 ? '#555' : '#ddd',
                    cursor: currentPage === 1 ? 'default' : 'pointer',
                    fontWeight: 600,
                    fontSize: '13px',
                  }}
                >
                  Previous
                </button>

                {getPageNumbers(currentPage, totalPages).map((page, idx) =>
                  page === 'ellipsis' ? (
                    <span key={`ellipsis-${idx}`} style={{ color: '#666', padding: '0 4px', fontSize: '14px' }}>
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      type="button"
                      onClick={() => goToPage(page)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        border: currentPage === page
                          ? '2px solid #fc3678'
                          : '1px solid rgba(255,255,255,0.1)',
                        background: currentPage === page
                          ? 'rgba(252, 54, 120, 0.15)'
                          : 'rgba(255,255,255,0.04)',
                        color: currentPage === page ? '#fc3678' : '#bbb',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  type="button"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: currentPage === totalPages ? 'transparent' : 'rgba(255,255,255,0.06)',
                    color: currentPage === totalPages ? '#555' : '#ddd',
                    cursor: currentPage === totalPages ? 'default' : 'pointer',
                    fontWeight: 600,
                    fontSize: '13px',
                  }}
                >
                  Next
                </button>
              </div>
              <p style={{ textAlign: 'center', color: '#666', fontSize: '12px', marginTop: '8px' }}>
                Page {currentPage} of {totalPages}
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}

interface OrderCardProps {
  order: Order;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isUpdating: boolean;
  updateOrderStatus: (orderId: string, status: string) => void;
  getStatusOptions: (orderType: string, currentStatus: string) => string[];
  getStatusLabel: (orderType: string, status: string) => string;
}

function OrderCard({
  order,
  isExpanded,
  onToggleExpand,
  isUpdating,
  updateOrderStatus,
  getStatusOptions,
  getStatusLabel,
}: OrderCardProps) {
  const statusColor = getStatusColor(order.status);
  const statusOptions = getStatusOptions(order.orderType, order.status);

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.04)',
        border: `1px solid ${statusColor.border}`,
        borderRadius: '16px',
        padding: '0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Status Badge Header */}
      <div
        style={{
          background: statusColor.bg,
          borderBottom: `1px solid ${statusColor.border}`,
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            color: statusColor.text,
            fontWeight: 700,
            fontSize: '13px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {getStatusLabel(order.orderType, order.status)}
        </span>
        <span
          style={{
            color: '#999',
            fontSize: '12px',
            background: 'rgba(0,0,0,0.3)',
            padding: '3px 8px',
            borderRadius: '6px',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          {order.orderType}
        </span>
      </div>

      {/* Card Body */}
      <div style={{ padding: '16px', flex: 1 }}>
        {/* Order ID and Time */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          <p style={{ color: '#f1d00f', fontWeight: 700, fontSize: '15px', margin: 0 }}>
            #{order.id.slice(0, 8)}
          </p>
          <span style={{ color: '#999', fontSize: '12px' }}>
            {formatTimeAgo(order.createdAt)}
          </span>
        </div>

        {/* Customer Info */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span style={{ color: '#eee', fontSize: '14px', fontWeight: 600 }}>
              {order.customerName || 'Guest'}
            </span>
          </div>
          {order.deliveryPhone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span style={{ color: '#bbb', fontSize: '13px' }}>{order.deliveryPhone}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span style={{ color: '#bbb', fontSize: '13px' }}>
              Ordered: {new Date(order.createdAt).toLocaleString()}
            </span>
          </div>
          {isOrderCompleted(order) && order.updatedAt && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={order.status === 'cancelled' ? '#ef5350' : '#69f0ae'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {order.status === 'cancelled' ? (
                  <>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </>
                ) : (
                  <>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </>
                )}
              </svg>
              <span style={{ color: order.status === 'cancelled' ? '#ef5350' : '#69f0ae', fontSize: '13px', fontWeight: 600 }}>
                {order.status === 'cancelled' ? 'Cancelled' : order.status === 'delivered' ? 'Delivered' : 'Picked up'}: {new Date(order.updatedAt).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Total and Payment */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 12px',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '10px',
            marginBottom: '14px',
          }}
        >
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '20px' }}>
            ${Number(order.total).toFixed(2)}
          </span>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: '6px',
              background: order.paymentStatus === 'paid'
                ? 'rgba(76, 175, 80, 0.2)'
                : order.paymentStatus === 'failed'
                  ? 'rgba(244, 67, 54, 0.2)'
                  : 'rgba(255, 152, 0, 0.2)',
              color: order.paymentStatus === 'paid'
                ? '#81c784'
                : order.paymentStatus === 'failed'
                  ? '#ef5350'
                  : '#ffb74d',
            }}
          >
            {order.paymentStatus.toUpperCase()}
          </span>
        </div>

        {/* Status Update Buttons */}
        <div style={{ marginBottom: '4px' }}>
          <p style={{ color: '#999', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', fontWeight: 600 }}>
            Update Status
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {statusOptions.map((status) => {
              const isActive = order.status === status;
              const btnColor = getStatusColor(status);
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    if (!isActive && !isUpdating) {
                      updateOrderStatus(order.id, status);
                    }
                  }}
                  disabled={isActive || isUpdating}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '8px',
                    cursor: isActive || isUpdating ? 'default' : 'pointer',
                    border: isActive
                      ? `2px solid ${btnColor.text}`
                      : '1px solid rgba(255,255,255,0.12)',
                    background: isActive ? btnColor.bg : 'rgba(255,255,255,0.04)',
                    color: isActive ? btnColor.text : '#aaa',
                    opacity: isUpdating && !isActive ? 0.5 : 1,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {getStatusLabel(order.orderType, status)}
                </button>
              );
            })}
          </div>
          {isUpdating && (
            <p style={{ color: '#f1d00f', fontSize: '11px', marginTop: '6px' }}>Updating...</p>
          )}
        </div>
      </div>

      {/* Expandable Items Section */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          type="button"
          onClick={onToggleExpand}
          style={{
            width: '100%',
            background: 'none',
            border: 'none',
            color: '#999',
            fontSize: '12px',
            padding: '10px 16px',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontWeight: 600,
          }}
        >
          <span>
            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
            {order.notes ? ' · Has notes' : ''}
          </span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {isExpanded && (
          <div style={{ padding: '0 16px 14px' }}>
            {order.items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  padding: '6px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <div>
                  <span style={{ color: '#ddd', fontSize: '13px' }}>
                    {item.itemName} <span style={{ color: '#888' }}>x{item.quantity}</span>
                  </span>
                  {item.specialNotes && (
                    <p style={{ color: '#ff9800', fontSize: '11px', margin: '2px 0 0', fontStyle: 'italic' }}>
                      {item.specialNotes}
                    </p>
                  )}
                </div>
                <span style={{ color: '#aaa', fontSize: '13px', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                  ${(Number(item.itemPrice) * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            {order.notes && (
              <div style={{ marginTop: '8px', padding: '8px 10px', background: 'rgba(255, 152, 0, 0.08)', borderRadius: '8px', border: '1px solid rgba(255, 152, 0, 0.2)' }}>
                <p style={{ color: '#ffb74d', fontSize: '12px', fontWeight: 600, marginBottom: '2px' }}>Order Notes</p>
                <p style={{ color: '#ddd', fontSize: '12px', margin: 0 }}>{order.notes}</p>
              </div>
            )}
            {order.deliveryAddress && (
              <div style={{ marginTop: '8px' }}>
                <p style={{ color: '#888', fontSize: '11px', fontWeight: 600, marginBottom: '2px', textTransform: 'uppercase' }}>Delivery Address</p>
                <p style={{ color: '#bbb', fontSize: '12px', margin: 0 }}>{order.deliveryAddress}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState<string>(getDefaultStartDate());
  const [endDate, setEndDate] = useState<string>(getDefaultEndDate());
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [activeCurrentPage, setActiveCurrentPage] = useState(1);
  const [completedCurrentPage, setCompletedCurrentPage] = useState(1);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const [pauseState, setPauseState] = useState<PauseState>({
    ordersPaused: false,
    pauseReason: null,
    resumeAt: null,
  });
  const [pauseLoading, setPauseLoading] = useState(false);
  const [showPauseForm, setShowPauseForm] = useState(false);
  const [pauseReason, setPauseReason] = useState('');
  const [pauseDuration, setPauseDuration] = useState<string>('');
  const [customResumeTime, setCustomResumeTime] = useState<string>('');

  const canAccess = useMemo(() => canManageOrders(user?.email), [user?.email]);

  const activeOrders = orders.filter((o) => !isOrderCompleted(o));
  const completedOrders = orders.filter((o) => isOrderCompleted(o));

  const activeTotalPages = Math.max(1, Math.ceil(activeOrders.length / ORDERS_PER_PAGE));
  const completedTotalPages = Math.max(1, Math.ceil(completedOrders.length / ORDERS_PER_PAGE));

  const paginatedActiveOrders = activeOrders.slice(
    (activeCurrentPage - 1) * ORDERS_PER_PAGE,
    activeCurrentPage * ORDERS_PER_PAGE
  );
  const paginatedCompletedOrders = completedOrders.slice(
    (completedCurrentPage - 1) * ORDERS_PER_PAGE,
    completedCurrentPage * ORDERS_PER_PAGE
  );

  const fetchPauseState = async () => {
    try {
      const response = await fetch('/api/store/settings');
      if (response.ok) {
        const data = await response.json();
        setPauseState(data);
      }
    } catch {
      // silently ignore – not critical
    }
  };

  const handlePauseOrders = async () => {
    setPauseLoading(true);
    setError('');

    let resumeAt: string | null = null;

    if (pauseDuration === 'custom' && customResumeTime) {
      resumeAt = new Date(customResumeTime).toISOString();
    } else if (pauseDuration && pauseDuration !== 'custom') {
      const minutes = parseInt(pauseDuration, 10);
      if (!isNaN(minutes) && minutes > 0) {
        resumeAt = new Date(Date.now() + minutes * 60 * 1000).toISOString();
      }
    }

    try {
      const response = await fetch('/api/store/pause-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pause',
          reason: pauseReason || undefined,
          resumeAt,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to pause orders');
      }

      setPauseState({
        ordersPaused: true,
        pauseReason: pauseReason || null,
        resumeAt,
      });
      setShowPauseForm(false);
      setPauseReason('');
      setPauseDuration('');
      setCustomResumeTime('');
    } catch (err: any) {
      setError(err.message || 'Failed to pause orders');
    } finally {
      setPauseLoading(false);
    }
  };

  const handleResumeOrders = async () => {
    setPauseLoading(true);
    setError('');

    try {
      const response = await fetch('/api/store/pause-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resume' }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resume orders');
      }

      setPauseState({
        ordersPaused: false,
        pauseReason: null,
        resumeAt: null,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to resume orders');
    } finally {
      setPauseLoading(false);
    }
  };

  const fetchOrders = useCallback(async (rangeStart: string, rangeEnd: string) => {
    try {
      setLoading(true);
      setError('');

      const query = new URLSearchParams();
      if (rangeStart) {
        query.set('startDate', rangeStart);
      }
      if (rangeEnd) {
        query.set('endDate', rangeEnd);
      }

      const response = await fetch(`/api/orders/admin-orders?${query.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch orders');
      }

      setOrders(data.orders || []);
      setActiveCurrentPage(1);
      setCompletedCurrentPage(1);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.push('/auth/signin?returnUrl=/admin/orders');
      return;
    }

    if (!canAccess) {
      setLoading(false);
      setError('You do not have permission to access this page.');
      return;
    }

    fetchOrders(startDate, endDate);
    fetchPauseState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, canAccess, router]);

  const applyFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    fetchOrders(startDate, endDate);
  };

  const clearFilters = () => {
    const defaultStart = getDefaultStartDate();
    const defaultEnd = getDefaultEndDate();
    setStartDate(defaultStart);
    setEndDate(defaultEnd);
    fetchOrders(defaultStart, defaultEnd);
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      setUpdatingOrderId(orderId);
      setError('');

      const response = await fetch('/api/orders/update-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update order status');
      }

      setOrders((prevOrders) =>
        prevOrders.map((order) => (order.id === orderId ? data.order : order))
      );
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getStatusOptions = (orderType: string, currentStatus: string) => {
    return orderType === 'pickup'
      ? ['confirmed', 'preparing', 'ready', 'picked_up', 'cancelled']
      : ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
  };

  const getStatusLabel = (orderType: string, status: string) => {
    if (orderType === 'pickup') {
      return getPickupStatusLabel(status);
    }
    const labels: Record<string, string> = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      preparing: 'Preparing',
      ready: 'Ready',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };
    return labels[status] || status.charAt(0).toUpperCase() + status.slice(1);
  };

  const goToActivePage = (page: number) => {
    if (page < 1 || page > activeTotalPages) return;
    setActiveCurrentPage(page);
  };

  const goToCompletedPage = (page: number) => {
    if (page < 1 || page > completedTotalPages) return;
    setCompletedCurrentPage(page);
  };

  const getPageNumbers = (currentPage: number, totalPages: number): (number | 'ellipsis')[] => {
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
  };

  return (
    <>
      <Head>
        <title>Orders - A-Ru Sushi</title>
        <meta name="description" content="Order management dashboard" />
      </Head>
      <Header />

      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          padding: '140px 20px 60px',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1
            style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#f1d00f',
              marginBottom: '8px',
              textAlign: 'center',
            }}
          >
            Orders
          </h1>
          {!loading && orders.length > 0 && (
            <p style={{ textAlign: 'center', color: '#999', fontSize: '14px', marginBottom: '24px' }}>
              {orders.length} order{orders.length !== 1 ? 's' : ''} found
              {activeOrders.length > 0 && completedOrders.length > 0 && (
                <span> &mdash; {activeOrders.length} active, {completedOrders.length} completed</span>
              )}
            </p>
          )}

          {/* Pause / Resume Orders Panel */}
          <div
            style={{
              marginBottom: '20px',
              padding: '16px',
              borderRadius: '12px',
              background: pauseState.ordersPaused
                ? 'rgba(255, 152, 0, 0.1)'
                : 'rgba(76, 175, 80, 0.08)',
              border: `1px solid ${pauseState.ordersPaused ? 'rgba(255, 152, 0, 0.4)' : 'rgba(76, 175, 80, 0.3)'}`,
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <p style={{ color: pauseState.ordersPaused ? '#FF9800' : '#4CAF50', fontWeight: 700, fontSize: '16px', marginBottom: '4px' }}>
                  {pauseState.ordersPaused ? 'New Orders Are Paused' : 'Accepting New Orders'}
                </p>
                {pauseState.ordersPaused && pauseState.pauseReason && (
                  <p style={{ color: '#ddd', fontSize: '13px', marginBottom: '2px' }}>
                    Reason: {pauseState.pauseReason}
                  </p>
                )}
                {pauseState.ordersPaused && pauseState.resumeAt && (
                  <p style={{ color: '#ddd', fontSize: '13px' }}>
                    Auto-resumes: {new Date(pauseState.resumeAt).toLocaleString()}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {pauseState.ordersPaused ? (
                  <button
                    type="button"
                    onClick={handleResumeOrders}
                    disabled={pauseLoading}
                    style={{
                      background: '#4CAF50',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 20px',
                      fontWeight: 700,
                      cursor: pauseLoading ? 'not-allowed' : 'pointer',
                      opacity: pauseLoading ? 0.6 : 1,
                    }}
                  >
                    {pauseLoading ? 'Resuming...' : 'Resume Orders'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowPauseForm(!showPauseForm)}
                    disabled={pauseLoading}
                    style={{
                      background: '#FF9800',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 20px',
                      fontWeight: 700,
                      cursor: pauseLoading ? 'not-allowed' : 'pointer',
                      opacity: pauseLoading ? 0.6 : 1,
                    }}
                  >
                    Pause New Orders
                  </button>
                )}
              </div>
            </div>

            {showPauseForm && !pauseState.ordersPaused && (
              <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ color: '#ccc', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                      Reason (optional, shown to customers)
                    </label>
                    <input
                      type="text"
                      value={pauseReason}
                      onChange={(e) => setPauseReason(e.target.value)}
                      placeholder="e.g. Kitchen is busy, back soon!"
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid #555',
                        background: '#111',
                        color: '#fff',
                        fontSize: '14px',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ color: '#ccc', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                      Auto-resume after
                    </label>
                    <select
                      value={pauseDuration}
                      onChange={(e) => setPauseDuration(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid #555',
                        background: '#111',
                        color: '#fff',
                        fontSize: '14px',
                      }}
                    >
                      <option value="">No auto-resume (manual only)</option>
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="90">1.5 hours</option>
                      <option value="120">2 hours</option>
                      <option value="custom">Custom date/time</option>
                    </select>
                  </div>

                  {pauseDuration === 'custom' && (
                    <div>
                      <label style={{ color: '#ccc', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                        Resume at
                      </label>
                      <input
                        type="datetime-local"
                        value={customResumeTime}
                        onChange={(e) => setCustomResumeTime(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '8px',
                          border: '1px solid #555',
                          background: '#111',
                          color: '#fff',
                          fontSize: '14px',
                        }}
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={handlePauseOrders}
                      disabled={pauseLoading || (pauseDuration === 'custom' && !customResumeTime)}
                      style={{
                        background: '#fc3678',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 20px',
                        fontWeight: 700,
                        cursor: pauseLoading ? 'not-allowed' : 'pointer',
                        opacity: pauseLoading || (pauseDuration === 'custom' && !customResumeTime) ? 0.6 : 1,
                      }}
                    >
                      {pauseLoading ? 'Pausing...' : 'Confirm Pause'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPauseForm(false);
                        setPauseReason('');
                        setPauseDuration('');
                        setCustomResumeTime('');
                      }}
                      style={{
                        background: 'transparent',
                        color: '#ccc',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        padding: '10px 20px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Date Filters */}
          <form
            onSubmit={applyFilters}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              alignItems: 'end',
              marginBottom: '20px',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid rgba(252, 54, 120, 0.2)',
            }}
          >
            <label style={{ color: '#fff', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              Start Date
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ padding: '8px', borderRadius: '8px', border: '1px solid #555', background: '#111', color: '#fff' }}
              />
            </label>

            <label style={{ color: '#fff', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              End Date
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ padding: '8px', borderRadius: '8px', border: '1px solid #555', background: '#111', color: '#fff' }}
              />
            </label>

            <button
              type="submit"
              style={{
                background: '#fc3678',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 16px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Apply
            </button>
            <button
              type="button"
              onClick={clearFilters}
              style={{
                background: 'transparent',
                color: '#f1d00f',
                border: '1px solid rgba(241, 208, 15, 0.5)',
                borderRadius: '8px',
                padding: '10px 16px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Last 30 Days
            </button>
          </form>

          {(authLoading || loading) && (
            <p style={{ color: '#f1d00f', textAlign: 'center' }}>Loading orders...</p>
          )}

          {error && (
            <div
              style={{
                marginBottom: '20px',
                padding: '14px',
                borderRadius: '8px',
                background: 'rgba(255, 68, 68, 0.1)',
                border: '1px solid rgba(255, 68, 68, 0.3)',
                color: '#ff7a7a',
              }}
            >
              {error}
            </div>
          )}

          {!loading && !error && orders.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(252, 54, 120, 0.2)',
                borderRadius: '12px',
                padding: '48px 24px',
                color: '#ccc',
              }}
            >
              <p style={{ fontSize: '18px', marginBottom: '8px' }}>No orders found</p>
              <p style={{ fontSize: '14px', color: '#888' }}>Try adjusting the date range above.</p>
            </div>
          )}

          {/* ===== ACTIVE ORDERS SECTION ===== */}
          {!loading && !error && orders.length > 0 && (
            <OrderSection
              title="Active Orders"
              titleColor="#f1d00f"
              accentColor="rgba(241, 208, 15, 0.35)"
              badgeCount={activeOrders.length}
              orders={paginatedActiveOrders}
              emptyMessage="No active orders right now."
              currentPage={activeCurrentPage}
              totalPages={activeTotalPages}
              goToPage={goToActivePage}
              getPageNumbers={getPageNumbers}
              expandedOrderId={expandedOrderId}
              setExpandedOrderId={setExpandedOrderId}
              updatingOrderId={updatingOrderId}
              updateOrderStatus={updateOrderStatus}
              getStatusOptions={getStatusOptions}
              getStatusLabel={getStatusLabel}
            />
          )}

          {/* ===== COMPLETED ORDERS SECTION ===== */}
          {!loading && !error && orders.length > 0 && (
            <OrderSection
              title="Completed Orders"
              titleColor="#81c784"
              accentColor="rgba(76, 175, 80, 0.3)"
              badgeCount={completedOrders.length}
              orders={paginatedCompletedOrders}
              emptyMessage="No completed orders in this date range."
              currentPage={completedCurrentPage}
              totalPages={completedTotalPages}
              goToPage={goToCompletedPage}
              getPageNumbers={getPageNumbers}
              expandedOrderId={expandedOrderId}
              setExpandedOrderId={setExpandedOrderId}
              updatingOrderId={updatingOrderId}
              updateOrderStatus={updateOrderStatus}
              getStatusOptions={getStatusOptions}
              getStatusLabel={getStatusLabel}
            />
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
