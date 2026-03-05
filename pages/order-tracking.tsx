import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';
import HorizontalOrderProgress from '../components/HorizontalOrderProgress';
import { getPickupStatusLabel } from '../lib/orders/pickupStatus';
import { createClient } from '../lib/supabase/client';

const ORDER_STATUS_POLLING_INTERVAL_MS = 10000;

interface Order {
  id: string;
  orderType: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
}

export default function OrderTrackingPage() {
  const router = useRouter();
  const { orderId } = router.query;
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrder = useCallback(
    async (showLoader = false) => {
      if (!orderId || typeof orderId !== 'string') {
        setError('Missing order ID. Please open this page from your checkout confirmation.');
        setLoading(false);
        return;
      }

      try {
        if (showLoader) {
          setLoading(true);
        }

        const response = await fetch(`/api/orders/${orderId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load order');
        }

        setOrder(data.order);
        setError('');
      } catch (err: any) {
        setError(err.message || 'Unable to load order');
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [orderId]
  );

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.push('/auth/signin');
      return;
    }

    fetchOrder(true);
  }, [authLoading, user, router, fetchOrder]);

  useEffect(() => {
    if (!user || !orderId || typeof orderId !== 'string') {
      return;
    }

    const supabase = createClient();
    const channel = supabase
      .channel(`order-tracking-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        () => {
          fetchOrder();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, orderId, fetchOrder]);

  useEffect(() => {
    if (!user || !orderId || typeof orderId !== 'string') {
      return;
    }

    const poll = () => {
      fetchOrder();
    };

    const interval = window.setInterval(poll, ORDER_STATUS_POLLING_INTERVAL_MS);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        poll();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [user, orderId, fetchOrder]);

  const statusText = order?.orderType === 'pickup' && order?.status
    ? getPickupStatusLabel(order.status)
    : order?.status || '';

  return (
    <>
      <Head>
        <title>Track Order - A-Ru Sushi</title>
        <meta name="description" content="Track your order progress in real time" />
      </Head>
      <Header />

      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          padding: '140px 20px 60px',
        }}
      >
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(252, 54, 120, 0.2)',
              borderRadius: '16px',
              padding: '28px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }}
          >
            <h1 style={{ color: '#f1d00f', fontSize: '34px', marginBottom: '6px', textAlign: 'center' }}>
              Order Tracking
            </h1>
            <p style={{ color: '#bbb', textAlign: 'center', marginBottom: '24px' }}>
              Live updates will appear automatically as our team updates your order.
            </p>

            {loading ? (
              <p style={{ color: '#f1d00f', textAlign: 'center' }}>Loading order status...</p>
            ) : null}

            {error ? (
              <div
                style={{
                  background: 'rgba(255, 68, 68, 0.1)',
                  border: '1px solid rgba(255, 68, 68, 0.3)',
                  borderRadius: '10px',
                  color: '#ff7a7a',
                  padding: '14px',
                  textAlign: 'center',
                }}
              >
                {error}
              </div>
            ) : null}

            {!loading && !error && order ? (
              <>
                <div
                  style={{
                    background: 'rgba(17, 17, 17, 0.45)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <p style={{ margin: 0, color: '#ddd', fontSize: '14px' }}>
                    Order #{order.id.slice(0, 8)}...
                  </p>
                  <p style={{ margin: 0, color: '#ddd', fontSize: '14px' }}>
                    Current status: <span style={{ color: '#fff', fontWeight: 700 }}>{statusText}</span>
                  </p>
                </div>

                {order.orderType === 'pickup' ? (
                  <div
                    style={{
                      background: 'rgba(17, 17, 17, 0.45)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '22px 16px 18px',
                    }}
                  >
                    <HorizontalOrderProgress status={order.status} />
                  </div>
                ) : (
                  <div
                    style={{
                      background: 'rgba(17, 17, 17, 0.45)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '16px',
                    }}
                  >
                    <p style={{ margin: 0, color: '#ddd' }}>
                      This is a delivery order. Current status: <strong style={{ color: '#fff' }}>{order.status}</strong>
                    </p>
                  </div>
                )}

                <div style={{ marginTop: '16px', textAlign: 'center', color: '#888', fontSize: '12px' }}>
                  Last updated: {new Date(order.updatedAt).toLocaleTimeString()}
                </div>
              </>
            ) : null}

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <Link
                href="/my-orders"
                style={{
                  display: 'inline-block',
                  background: '#fc3678',
                  color: '#fff',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 700,
                }}
              >
                View All Orders
              </Link>
              <Link
                href="/menu"
                style={{
                  display: 'inline-block',
                  background: 'transparent',
                  color: '#f1d00f',
                  border: '1px solid rgba(241, 208, 15, 0.45)',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 700,
                }}
              >
                Back to Menu
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

