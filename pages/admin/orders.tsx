import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useAuth } from '../../contexts/AuthContext';
import { canManageOrders } from '../../lib/auth/roles';

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

export default function AdminOrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState<string>(getDefaultStartDate());
  const [endDate, setEndDate] = useState<string>(getDefaultEndDate());

  const canAccess = useMemo(() => canManageOrders(user?.email), [user?.email]);

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

  return (
    <>
      <Head>
        <title>Admin Orders - A-Ru Sushi</title>
        <meta name="description" content="Admin order history and date-filtered order management" />
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
            Admin Order History
          </h1>

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
                    <p style={{ color: '#ddd', fontSize: '13px' }}>Status: {order.status}</p>
                    <p style={{ color: '#ddd', fontSize: '13px' }}>Payment: {order.paymentStatus}</p>
                  </div>
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
