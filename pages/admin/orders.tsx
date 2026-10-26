import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AdminOnly from '../../components/AdminOnly';
import { useAuth } from '../../contexts/AuthContext';
import { canManageOrders } from '../../lib/auth/roles';
import { formatTimeAgo, getPageNumbers, getStatusColor, getStatusLabel, isCompletedStatus } from '../../lib/orders/orderDisplay';
import { createClient } from '../../lib/supabase/client';
import { refetchOnRejoin, useRefetchOnReturn } from '../../lib/realtime/catchUp';

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
  readyForPickupAt?: string | null;
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

function isOrderCompleted(order: Order): boolean {
  return isCompletedStatus(order.status);
}

interface OrderSectionProps {
  id?: string;
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
  collapsible?: boolean;
  openOrderIds?: Set<string>;
  onToggleOpen?: (id: string) => void;
}

function OrderSection({
  id,
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
  collapsible = false,
  openOrderIds,
  onToggleOpen,
}: OrderSectionProps) {
  return (
    <div id={id} style={{ marginBottom: '40px', scrollMarginTop: '120px' }}>
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
              // Collapsed cards shouldn't stretch to match an open card in the same row
              alignItems: collapsible ? 'start' : undefined,
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
                isCollapsed={collapsible && !openOrderIds?.has(order.id)}
                onToggleCollapse={collapsible && onToggleOpen ? () => onToggleOpen(order.id) : undefined}
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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

function OrderCard({
  order,
  isExpanded,
  onToggleExpand,
  isUpdating,
  updateOrderStatus,
  getStatusOptions,
  getStatusLabel,
  isCollapsed = false,
  onToggleCollapse,
}: OrderCardProps) {
  const statusColor = getStatusColor(order.status);
  const statusOptions = getStatusOptions(order.orderType, order.status);

  // Collapsed cards toggle from anywhere on the card; open ones from the header only
  const toggleProps = onToggleCollapse
    ? {
        role: 'button' as const,
        tabIndex: 0,
        'aria-expanded': !isCollapsed,
        onClick: onToggleCollapse,
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggleCollapse();
          }
        },
      }
    : {};

  return (
    <div
      {...(isCollapsed ? toggleProps : {})}
      style={{
        background: 'rgba(255, 255, 255, 0.04)',
        border: `1px solid ${statusColor.border}`,
        borderRadius: '16px',
        padding: '0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'border-color 0.2s',
        cursor: isCollapsed ? 'pointer' : undefined,
      }}
    >
      {/* Status Badge Header */}
      <div
        {...(!isCollapsed ? toggleProps : {})}
        style={{
          background: statusColor.bg,
          borderBottom: `1px solid ${statusColor.border}`,
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: onToggleCollapse ? 'pointer' : undefined,
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
        <div style={{ display: 'flex', alignItems: 'center' }}>
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
        {onToggleCollapse && (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#bbb"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              marginLeft: '8px',
              flexShrink: 0,
              transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 0.2s',
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        )}
        </div>
      </div>

      {/* Collapsed Summary */}
      {isCollapsed && (
        <div
          style={{
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <p style={{ color: '#f1d00f', fontWeight: 700, fontSize: '14px', margin: 0 }}>
              #{order.id.slice(0, 8)}
            </p>
            <p
              style={{
                color: '#bbb',
                fontSize: '13px',
                margin: '2px 0 0',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {order.customerName || 'Guest'}
            </p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: '16px', margin: 0 }}>
              ${Number(order.total).toFixed(2)}
            </p>
            <p style={{ color: '#999', fontSize: '12px', margin: '2px 0 0' }}>
              {formatTimeAgo(order.createdAt)}
            </p>
          </div>
        </div>
      )}

      {!isCollapsed && (
      <>
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
          {order.readyForPickupAt && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#81c784" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span style={{ color: '#81c784', fontSize: '13px', fontWeight: 600 }}>
                Ready for Pick Up: {new Date(order.readyForPickupAt).toLocaleString()}
              </span>
            </div>
          )}
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
      </>
      )}
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
  const [openCompletedIds, setOpenCompletedIds] = useState<Set<string>>(new Set());

  const toggleCompletedOpen = (id: string) => {
    setOpenCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const [newOrderAlert, setNewOrderAlert] = useState<string | null>(null);
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Oldest first, so the order that has waited longest is at the top; completed stay newest first
  const activeOrders = orders
    .filter((o) => !isOrderCompleted(o))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const completedOrders = orders.filter((o) => isOrderCompleted(o));

  // Forget open state for orders that left Completed, so they re-enter collapsed
  useEffect(() => {
    setOpenCompletedIds((prev) => {
      const next = new Set(
        Array.from(prev).filter((id) => orders.some((o) => o.id === id && isOrderCompleted(o)))
      );
      return next.size === prev.size ? prev : next;
    });
  }, [orders]);

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

  const playNotificationSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [
        { freq: 830, start: 0, dur: 0.12 },
        { freq: 1050, start: 0.14, dur: 0.12 },
        { freq: 1320, start: 0.28, dur: 0.2 },
      ];
      notes.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + dur);
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dur);
      });
    } catch {
      // Audio not available
    }
  }, []);

  const showNewOrderAlert = useCallback((orderId: string) => {
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    setNewOrderAlert(orderId);
    playNotificationSound();
    alertTimeoutRef.current = setTimeout(() => setNewOrderAlert(null), 6000);
  }, [playNotificationSound]);

  const fetchSingleOrder = useCallback(async (orderId: string): Promise<Order | null> => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.order || null;
    } catch {
      return null;
    }
  }, []);

  // The date range last applied, so a catch-up refetch keeps the same filter
  const appliedRange = useRef({ start: startDate, end: endDate });
  const ordersRef = useRef(orders);
  ordersRef.current = orders;
  const loadingRef = useRef(loading);
  loadingRef.current = loading;

  // Refetch in place (no loading state, same pages) to catch up on broadcasts missed while away
  const catchUpOrders = useCallback(async () => {
    // A full load is already running and will bring everything current
    if (loadingRef.current) return;
    const query = new URLSearchParams();
    if (appliedRange.current.start) query.set('startDate', appliedRange.current.start);
    if (appliedRange.current.end) query.set('endDate', appliedRange.current.end);
    try {
      const response = await fetch(`/api/orders/admin-orders?${query.toString()}`);
      if (!response.ok) return;
      const data = await response.json();
      const fresh: Order[] = data.orders || [];
      const known = new Set(ordersRef.current.map((o) => o.id));
      const missed = fresh.find((o) => !known.has(o.id) && !isOrderCompleted(o));
      setOrders(fresh);
      if (missed) showNewOrderAlert(missed.id);
    } catch {
      // Keep showing what we have; the next catch-up will try again
    }
  }, [showNewOrderAlert]);

  useRefetchOnReturn(!!user && canAccess, catchUpOrders);

  useEffect(() => {
    if (!user || !canAccess) return;

    const supabase = createClient();
    const channel = supabase
      .channel('order-updates')
      .on('broadcast', { event: 'new-order-created' }, async (message) => {
        const orderId = message.payload?.orderId;
        if (!orderId) return;

        const newOrder = await fetchSingleOrder(orderId);
        if (newOrder) {
          setOrders((prev) => {
            if (prev.some((o) => o.id === newOrder.id)) return prev;
            return [newOrder, ...prev];
          });
          showNewOrderAlert(newOrder.id);
        }
      })
      .on('broadcast', { event: 'order-status-changed' }, (message) => {
        const { orderId, status } = message.payload || {};
        if (!orderId || !status) return;

        setOrders((prev) =>
          prev.map((o) => {
            if (o.id !== orderId) return o;
            const updates: Partial<Order> = { status, updatedAt: new Date().toISOString() };
            if (status === 'ready') {
              updates.readyForPickupAt = new Date().toISOString();
            }
            return { ...o, ...updates };
          })
        );
      })
      .subscribe(refetchOnRejoin(catchUpOrders));

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, canAccess, fetchSingleOrder, showNewOrderAlert, catchUpOrders]);

  const fetchOrders = useCallback(async (rangeStart: string, rangeEnd: string) => {
    try {
      setLoading(true);
      setError('');

      appliedRange.current = { start: rangeStart, end: rangeEnd };
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
    return () => {
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    };
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

  // The staff homepage links to /admin/orders#completed, but the section only exists once orders load
  useEffect(() => {
    if (loading || window.location.hash !== '#completed') return;
    document.getElementById('completed')?.scrollIntoView({ behavior: 'smooth' });
  }, [loading]);

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

  const goToActivePage = (page: number) => {
    if (page < 1 || page > activeTotalPages) return;
    setActiveCurrentPage(page);
  };

  const goToCompletedPage = (page: number) => {
    if (page < 1 || page > completedTotalPages) return;
    setCompletedCurrentPage(page);
  };

  if (!authLoading && user && !canAccess) {
    return <AdminOnly />;
  }

  return (
    <>
      <Head>
        <title>Orders - A-Ru Sushi</title>
        <meta name="description" content="Order management dashboard" />
        <style>{`
          @keyframes pulse-border {
            0%, 100% { border-color: rgba(76, 175, 80, 0.6); box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
            50% { border-color: rgba(76, 175, 80, 1); box-shadow: 0 0 20px rgba(76, 175, 80, 0.3); }
          }
        `}</style>
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

          {/* New Order Alert Banner */}
          {newOrderAlert && (
            <div
              style={{
                marginBottom: '20px',
                padding: '16px 20px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(34, 197, 94, 0.15))',
                border: '2px solid rgba(76, 175, 80, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                animation: 'pulse-border 1.5s ease-in-out infinite',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>🔔</span>
                <div>
                  <p style={{ color: '#4ade80', fontWeight: 700, fontSize: '16px', margin: 0 }}>
                    New Order Received!
                  </p>
                  <p style={{ color: '#a3e635', fontSize: '13px', margin: '2px 0 0' }}>
                    Order #{newOrderAlert.slice(0, 8)} just came in
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNewOrderAlert(null)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#ccc',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                Dismiss
              </button>
            </div>
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
            <span style={{ color: '#888', fontSize: '13px', alignSelf: 'center' }}>
              Active orders always show; dates filter completed orders.
            </span>
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
              id="completed"
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
              collapsible
              openOrderIds={openCompletedIds}
              onToggleOpen={toggleCompletedOpen}
            />
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
