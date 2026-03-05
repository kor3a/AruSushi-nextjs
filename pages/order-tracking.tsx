import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';
import HorizontalOrderProgress from '../components/HorizontalOrderProgress';
import DeliveryOrderProgress from '../components/DeliveryOrderProgress';
import { getPickupStatusLabel } from '../lib/orders/pickupStatus';
import { getDeliveryEventLabel, getDeliveryStatusLabel } from '../lib/orders/deliveryStatus';
import { useDeliveryNotifications } from '../lib/notifications/useDeliveryNotifications';
import { createClient } from '../lib/supabase/client';

const DeliveryMap = dynamic(() => import('../components/DeliveryMap'), { ssr: false });

interface Order {
  id: string;
  orderType: string;
  status: string;
  paymentStatus: string;
  deliveryAddress?: string | null;
  doordashDeliveryId?: string | null;
  doordashDeliveryStatus?: string | null;
  doordashTrackingUrl?: string | null;
  dasherName?: string | null;
  dasherPhone?: string | null;
  dasherLatitude?: number | null;
  dasherLongitude?: number | null;
  estimatedPickupTime?: string | null;
  estimatedDropoffTime?: string | null;
  actualPickupTime?: string | null;
  actualDropoffTime?: string | null;
  deliveryLastEvent?: string | null;
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
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const { requestPermission, sendNotification } = useDeliveryNotifications();

  const fetchOrder = useCallback(
    async (showLoader = false) => {
      if (!orderId || typeof orderId !== 'string') {
        setError('Missing order ID. Please open this page from your checkout confirmation.');
        setLoading(false);
        return;
      }

      try {
        if (showLoader) setLoading(true);

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
        if (showLoader) setLoading(false);
      }
    },
    [orderId]
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    fetchOrder(true);
  }, [authLoading, user, router, fetchOrder]);

  useEffect(() => {
    if (!user || !orderId || typeof orderId !== 'string') return;

    const supabase = createClient();
    const channel = supabase
      .channel('order-updates')
      .on('broadcast', { event: 'order-status-changed' }, (message) => {
        if (message.payload?.orderId === orderId) {
          fetchOrder();

          const doordashEvent = message.payload?.doordashEvent;
          if (doordashEvent && notificationsEnabled) {
            sendNotification(doordashEvent, message.payload?.dasherName);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, orderId, fetchOrder, notificationsEnabled, sendNotification]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    setNotificationsEnabled(granted);
  };

  const isDelivery = order?.orderType === 'delivery';
  const isCancelled = order?.status === 'cancelled';

  const statusText = isDelivery
    ? order?.deliveryLastEvent
      ? getDeliveryEventLabel(order.deliveryLastEvent)
      : getDeliveryStatusLabel(order?.status || '')
    : order?.status
    ? getPickupStatusLabel(order.status)
    : '';

  const estimatedArrival = order?.estimatedDropoffTime
    ? new Date(order.estimatedDropoffTime).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

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
            <h1
              style={{
                color: '#f1d00f',
                fontSize: '34px',
                marginBottom: '6px',
                textAlign: 'center',
              }}
            >
              {isDelivery ? 'Delivery Tracking' : 'Order Tracking'}
            </h1>
            <p style={{ color: '#bbb', textAlign: 'center', marginBottom: '24px' }}>
              Live updates will appear automatically as your order progresses.
            </p>

            {/* Notification opt-in */}
            {isDelivery && !notificationsEnabled && !isCancelled && order?.status !== 'delivered' && (
              <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                <button
                  onClick={handleEnableNotifications}
                  style={{
                    background: 'rgba(252, 54, 120, 0.15)',
                    border: '1px solid rgba(252, 54, 120, 0.4)',
                    color: '#fc3678',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '14px',
                  }}
                >
                  🔔 Enable Delivery Notifications
                </button>
              </div>
            )}

            {notificationsEnabled && isDelivery && !isCancelled && order?.status !== 'delivered' && (
              <div
                style={{
                  textAlign: 'center',
                  marginBottom: '18px',
                  color: '#4ade80',
                  fontSize: '13px',
                }}
              >
                🔔 Notifications enabled — you&apos;ll be notified of delivery updates
              </div>
            )}

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
                {/* Order info bar */}
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
                    Status:{' '}
                    <span style={{ color: '#fff', fontWeight: 700 }}>{statusText}</span>
                  </p>
                  {estimatedArrival && !isCancelled && order.status !== 'delivered' && (
                    <p style={{ margin: 0, color: '#ddd', fontSize: '14px' }}>
                      ETA:{' '}
                      <span style={{ color: '#4ade80', fontWeight: 700 }}>
                        {estimatedArrival}
                      </span>
                    </p>
                  )}
                </div>

                {/* Progress tracker */}
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
                      padding: '22px 16px 18px',
                      marginBottom: '18px',
                    }}
                  >
                    <DeliveryOrderProgress
                      deliveryEvent={order.deliveryLastEvent}
                      cancelled={isCancelled}
                    />
                  </div>
                )}

                {/* Live map for delivery orders */}
                {isDelivery && !isCancelled && order.status !== 'delivered' && (
                  <div style={{ marginBottom: '18px' }}>
                    <DeliveryMap
                      dasherLat={order.dasherLatitude}
                      dasherLng={order.dasherLongitude}
                      dropoffAddress={order.deliveryAddress}
                      dasherName={order.dasherName}
                    />
                  </div>
                )}

                {/* Dasher info */}
                {isDelivery && order.dasherName && !isCancelled && (
                  <div
                    style={{
                      background: 'rgba(17, 17, 17, 0.45)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: '#fc3678',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        flexShrink: 0,
                      }}
                    >
                      🛵
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: '15px' }}>
                        {order.dasherName}
                      </p>
                      <p style={{ margin: 0, color: '#9ca3af', fontSize: '13px' }}>
                        Your Dasher
                      </p>
                    </div>
                    {order.dasherPhone && (
                      <a
                        href={`tel:${order.dasherPhone}`}
                        style={{
                          background: 'rgba(74, 222, 128, 0.15)',
                          border: '1px solid rgba(74, 222, 128, 0.3)',
                          color: '#4ade80',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          fontWeight: 600,
                          fontSize: '13px',
                        }}
                      >
                        📞 Call Dasher
                      </a>
                    )}
                    {order.doordashTrackingUrl && (
                      <a
                        href={order.doordashTrackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: 'rgba(252, 54, 120, 0.15)',
                          border: '1px solid rgba(252, 54, 120, 0.3)',
                          color: '#fc3678',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          fontWeight: 600,
                          fontSize: '13px',
                        }}
                      >
                        DoorDash Tracker ↗
                      </a>
                    )}
                  </div>
                )}

                {/* Delivery address */}
                {isDelivery && order.deliveryAddress && (
                  <div
                    style={{
                      background: 'rgba(17, 17, 17, 0.45)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      marginBottom: '18px',
                    }}
                  >
                    <p style={{ margin: 0, color: '#9ca3af', fontSize: '12px', marginBottom: '4px' }}>
                      Delivering to
                    </p>
                    <p style={{ margin: 0, color: '#fff', fontSize: '14px' }}>
                      {order.deliveryAddress}
                    </p>
                  </div>
                )}

                {/* Delivered success message */}
                {isDelivery && order.status === 'delivered' && (
                  <div
                    style={{
                      background: 'rgba(74, 222, 128, 0.1)',
                      border: '1px solid rgba(74, 222, 128, 0.3)',
                      borderRadius: '12px',
                      padding: '20px',
                      textAlign: 'center',
                      marginBottom: '18px',
                    }}
                  >
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>🎉</div>
                    <p style={{ color: '#4ade80', fontWeight: 700, fontSize: '18px', margin: '0 0 4px' }}>
                      Your order has been delivered!
                    </p>
                    <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
                      Enjoy your meal from A-Ru Sushi
                    </p>
                    {order.actualDropoffTime && (
                      <p style={{ color: '#888', fontSize: '12px', marginTop: '8px', margin: '8px 0 0' }}>
                        Delivered at {new Date(order.actualDropoffTime).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                )}

                <div
                  style={{
                    marginTop: '16px',
                    textAlign: 'center',
                    color: '#888',
                    fontSize: '12px',
                  }}
                >
                  Last updated: {new Date(order.updatedAt).toLocaleTimeString()}
                </div>
              </>
            ) : null}

            <div
              style={{
                marginTop: '24px',
                display: 'flex',
                justifyContent: 'center',
                gap: '10px',
                flexWrap: 'wrap',
              }}
            >
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
