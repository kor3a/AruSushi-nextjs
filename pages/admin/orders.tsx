import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useAuth } from '../../contexts/AuthContext';
import { canManageOrders } from '../../lib/auth/roles';
import { getPickupStatusLabel, isPickupOrderActive } from '../../lib/orders/pickupStatus';

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

export default function AdminOrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState<string>(getDefaultStartDate());
  const [endDate, setEndDate] = useState<string>(getDefaultEndDate());
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

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

  const fetchOrders = async (rangeStart: string, rangeEnd: string) => {
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
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

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
    // Intentionally do not add startDate/endDate to avoid auto-refetch while typing.
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

  const activePickupOrders = orders.filter(
    (order) => order.orderType === 'pickup' && isPickupOrderActive(order.status)
  );

  const getStatusOptions = (orderType: string, currentStatus: string) => {
    const options =
      orderType === 'pickup'
        ? ['confirmed', 'preparing', 'ready', 'picked_up', 'cancelled']
        : ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];

    return options.includes(currentStatus) ? options : [currentStatus, ...options];
  };

  const getStatusLabel = (orderType: string, status: string) => {
    if (orderType === 'pickup') {
      return getPickupStatusLabel(status);
    }

    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <>
      <Head>
        <title>Orders - A-Ru Sushi</title>
        <meta name="description" content="Order history and date-filtered order management" />
      </Head>
      <Header />

      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          padding: '140px 20px 60px',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h1
            style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#f1d00f',
              marginBottom: '24px',
              textAlign: 'center',
            }}
          >
            Orders
          </h1>

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

          {authLoading || loading ? (
            <p style={{ color: '#f1d00f', textAlign: 'center' }}>Loading orders...</p>
          ) : null}

          {error ? (
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
          ) : null}

          {!loading && !error && orders.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(252, 54, 120, 0.2)',
                borderRadius: '12px',
                padding: '24px',
                color: '#ccc',
              }}
            >
              No orders found for the selected date range.
            </div>
          ) : null}

          {!loading && !error && activePickupOrders.length > 0 ? (
            <div
              style={{
                marginBottom: '20px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(241, 208, 15, 0.35)',
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <h2 style={{ color: '#f1d00f', fontSize: '18px', marginBottom: '8px' }}>Active Pickup Orders</h2>
              <p style={{ color: '#ddd', fontSize: '13px', marginBottom: 0 }}>
                {activePickupOrders.length} currently active pickup
                {activePickupOrders.length === 1 ? '' : 's'} requiring updates.
              </p>
            </div>
          ) : null}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {orders.map((order) => (
              <div
                key={order.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(252, 54, 120, 0.2)',
                  borderRadius: '12px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '8px' }}>
                  <div>
                    <p style={{ color: '#f1d00f', fontWeight: 700, marginBottom: '4px' }}>Order #{order.id.slice(0, 8)}...</p>
                    <p style={{ color: '#ddd', fontSize: '14px' }}>{new Date(order.createdAt).toLocaleString()}</p>
                    <p style={{ color: '#bbb', fontSize: '13px' }}>Customer: {order.customerName || 'N/A'} ({order.customerEmail || 'N/A'})</p>
                    <p style={{ color: '#999', fontSize: '12px' }}>User ID: {order.userId}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: '#fff', fontWeight: 700, fontSize: '20px' }}>${Number(order.total).toFixed(2)}</p>
                    <p style={{ color: '#ddd', fontSize: '13px' }}>Type: {order.orderType}</p>
                    <p style={{ color: '#ddd', fontSize: '13px' }}>Status: {getStatusLabel(order.orderType, order.status)}</p>
                    <p style={{ color: '#ddd', fontSize: '13px' }}>Payment: {order.paymentStatus}</p>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: '12px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '10px',
                    alignItems: 'center',
                  }}
                >
                  <label style={{ color: '#ccc', fontSize: '13px' }}>
                    Update status:
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      disabled={updatingOrderId === order.id}
                      style={{
                        marginLeft: '8px',
                        background: '#111',
                        color: '#fff',
                        border: '1px solid #444',
                        borderRadius: '8px',
                        padding: '6px 8px',
                      }}
                    >
                      {getStatusOptions(order.orderType, order.status).map((status) => (
                        <option key={status} value={status}>
                          {getStatusLabel(order.orderType, status)}
                        </option>
                      ))}
                    </select>
                  </label>
                  {updatingOrderId === order.id ? (
                    <span style={{ color: '#f1d00f', fontSize: '12px' }}>Saving...</span>
                  ) : null}
                </div>

                <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
                  {order.items.map((item) => (
                    <p key={item.id} style={{ color: '#ddd', fontSize: '14px', marginBottom: '4px' }}>
                      {item.itemName} x{item.quantity} - ${(Number(item.itemPrice) * item.quantity).toFixed(2)}
                      {item.specialNotes ? ` (Note: ${item.specialNotes})` : ''}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
