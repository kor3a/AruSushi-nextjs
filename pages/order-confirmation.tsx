import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import OrderConfirmationProgress from '../components/OrderConfirmationProgress';
import { getPickupStatusLabel } from '../lib/orders/pickupStatus';
import { getDeliveryStatusLabel } from '../lib/orders/deliveryStatus';
import { createClient } from '../lib/supabase/client';

interface OrderItem {
  id: string;
  itemName: string;
  itemPrice: number | string;
  quantity: number;
  specialNotes?: string | null;
}

interface ConfirmedOrder {
  id: string;
  orderType: string;
  status: string;
  total: number | string;
  paymentStatus: string;
  customerName?: string | null;
  customerEmail?: string | null;
  deliveryAddress?: string | null;
  deliveryPhone?: string | null;
  deliveryFee?: number | string | null;
  deliveryLastEvent?: string | null;
  estimatedPickupTime?: string | null;
  estimatedDropoffTime?: string | null;
  notes?: string | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export default function OrderConfirmation() {
  const router = useRouter();
  const { orderId } = router.query;
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<ConfirmedOrder | null>(null);

  const fetchOrder = useCallback(async (showLoader = false) => {
    if (!orderId || typeof orderId !== 'string') {
      setLoading(false);
      return;
    }

    try {
      if (showLoader) setLoading(true);
      const response = await fetch(`/api/orders/${orderId}`);
      const data = await response.json();
      if (response.ok) {
        setOrder(data.order);
      }
    } catch (error) {
      console.error('Failed to fetch order for confirmation page', error);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
      return;
    }
    if (!user) return;
    fetchOrder(true);
  }, [user, authLoading, router, fetchOrder]);

  useEffect(() => {
    if (!user || !orderId || typeof orderId !== 'string') return;

    const supabase = createClient();
    const channel = supabase
      .channel('order-updates')
      .on('broadcast', { event: 'order-status-changed' }, (message) => {
        if (message.payload?.orderId === orderId) {
          fetchOrder();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, orderId, fetchOrder]);

  const isDelivery = order?.orderType === 'delivery';

  const subtotal = order?.items.reduce(
    (sum, item) => sum + Number(item.itemPrice) * item.quantity,
    0
  ) ?? 0;
  const deliveryFee = order?.deliveryFee ? Number(order.deliveryFee) : 0;
  const total = Number(order?.total ?? 0);
  const discount = subtotal + deliveryFee - total;

  const statusLabel = isDelivery
    ? getDeliveryStatusLabel(order?.status || '')
    : getPickupStatusLabel(order?.status || '');

  const orderDate = order?.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  const orderTime = order?.createdAt
    ? new Date(order.createdAt).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';

  const estimatedTime = isDelivery
    ? order?.estimatedDropoffTime
      ? new Date(order.estimatedDropoffTime).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        })
      : null
    : null;

  if (authLoading || loading) {
    return (
      <>
        <Head>
          <title>Order Confirmation - A-Ru Sushi</title>
        </Head>
        <Header />
        <div
          style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
            padding: '140px 20px 60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '3px solid rgba(252, 54, 120, 0.3)',
                borderTopColor: '#fc3678',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 16px',
              }}
            />
            <p style={{ color: '#bbb', fontSize: '16px' }}>Loading your order...</p>
          </div>
        </div>
        <Footer />
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Head>
          <title>Order Confirmation - A-Ru Sushi</title>
        </Head>
        <Header />
        <div
          style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
            padding: '140px 20px 60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#f87171', fontSize: '18px', marginBottom: '16px' }}>
              Order not found
            </p>
            <Link
              href="/my-orders"
              style={{
                color: '#fc3678',
                textDecoration: 'underline',
                fontSize: '14px',
              }}
            >
              View My Orders
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Order Confirmed - A-Ru Sushi</title>
        <meta name="description" content="Your order has been confirmed" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          padding: '140px 20px 60px',
        }}
      >
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          {/* Success header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #fc3678, #f1d00f)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 0 30px rgba(252, 54, 120, 0.3)',
              }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1
              style={{
                color: '#f1d00f',
                fontSize: '32px',
                fontWeight: 800,
                margin: '0 0 8px',
              }}
            >
              Order Confirmed!
            </h1>
            <p style={{ color: '#bbb', fontSize: '16px', margin: 0 }}>
              Thank you for your order. We&apos;re on it!
            </p>
          </div>

          {/* Full-width progress bar */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(252, 54, 120, 0.15)',
              borderRadius: '16px',
              padding: '24px 20px 16px',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: '#9ca3af',
                  fontSize: '13px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                {isDelivery ? 'Delivery Progress' : 'Order Progress'}
              </p>
              <p style={{ margin: 0, color: '#fff', fontSize: '14px', fontWeight: 600 }}>
                {statusLabel}
              </p>
            </div>
            <OrderConfirmationProgress
              orderType={order.orderType as 'pickup' | 'delivery'}
              status={order.status}
              deliveryLastEvent={order.deliveryLastEvent}
            />
          </div>

          {/* Main content grid */}
          <div className="confirmation-grid">
            {/* Left column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Order items */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '24px',
                }}
              >
                <h2
                  style={{
                    color: '#f1d00f',
                    fontSize: '18px',
                    fontWeight: 700,
                    margin: '0 0 16px',
                  }}
                >
                  Order Items
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        padding: '12px 0',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span
                            style={{
                              background: 'rgba(252, 54, 120, 0.15)',
                              color: '#fc3678',
                              borderRadius: '6px',
                              padding: '2px 8px',
                              fontSize: '12px',
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            x{item.quantity}
                          </span>
                          <span style={{ color: '#fff', fontSize: '14px', fontWeight: 500 }}>
                            {item.itemName}
                          </span>
                        </div>
                        {item.specialNotes && (
                          <p
                            style={{
                              margin: '4px 0 0 34px',
                              color: '#9ca3af',
                              fontSize: '12px',
                              fontStyle: 'italic',
                            }}
                          >
                            Note: {item.specialNotes}
                          </p>
                        )}
                      </div>
                      <span
                        style={{
                          color: '#ddd',
                          fontSize: '14px',
                          fontWeight: 500,
                          flexShrink: 0,
                          marginLeft: '16px',
                        }}
                      >
                        ${(Number(item.itemPrice) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div
                  style={{
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '14px',
                    }}
                  >
                    <span style={{ color: '#9ca3af' }}>Subtotal</span>
                    <span style={{ color: '#ddd' }}>${subtotal.toFixed(2)}</span>
                  </div>
                  {deliveryFee > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '14px',
                      }}
                    >
                      <span style={{ color: '#9ca3af' }}>Delivery Fee</span>
                      <span style={{ color: '#ddd' }}>${deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  {discount > 0.01 && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '14px',
                      }}
                    >
                      <span style={{ color: '#4ade80' }}>Reward Discount</span>
                      <span style={{ color: '#4ade80' }}>-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '18px',
                      fontWeight: 700,
                      paddingTop: '8px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <span style={{ color: '#fff' }}>Total</span>
                    <span style={{ color: '#fc3678' }}>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Special notes */}
              {order.notes && (
                <div
                  style={{
                    background: 'rgba(241, 208, 15, 0.06)',
                    border: '1px solid rgba(241, 208, 15, 0.15)',
                    borderRadius: '16px',
                    padding: '20px 24px',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                  }}
                >
                  <span style={{ fontSize: '20px', flexShrink: 0 }}>📝</span>
                  <div>
                    <p
                      style={{
                        color: '#f1d00f',
                        fontSize: '13px',
                        fontWeight: 600,
                        margin: '0 0 4px',
                      }}
                    >
                      Order Notes
                    </p>
                    <p style={{ color: '#ddd', fontSize: '14px', margin: 0, lineHeight: 1.5 }}>
                      {order.notes}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Order details card */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '24px',
                }}
              >
                <h2
                  style={{
                    color: '#f1d00f',
                    fontSize: '18px',
                    fontWeight: 700,
                    margin: '0 0 16px',
                  }}
                >
                  Order Details
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <p style={{ color: '#9ca3af', fontSize: '12px', margin: '0 0 2px' }}>
                      Order Number
                    </p>
                    <p
                      style={{
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: 600,
                        margin: 0,
                        fontFamily: 'monospace',
                        wordBreak: 'break-all',
                      }}
                    >
                      {order.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: '#9ca3af', fontSize: '12px', margin: '0 0 2px' }}>
                      Order Date
                    </p>
                    <p style={{ color: '#fff', fontSize: '14px', margin: 0 }}>
                      {orderDate} at {orderTime}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: '#9ca3af', fontSize: '12px', margin: '0 0 2px' }}>
                      Order Type
                    </p>
                    <p style={{ color: '#fff', fontSize: '14px', margin: 0, textTransform: 'capitalize' }}>
                      {order.orderType}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: '#9ca3af', fontSize: '12px', margin: '0 0 2px' }}>
                      Payment
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background:
                            order.paymentStatus === 'paid' ? '#4ade80' : '#f59e0b',
                          flexShrink: 0,
                        }}
                      />
                      <p
                        style={{
                          color: order.paymentStatus === 'paid' ? '#4ade80' : '#f59e0b',
                          fontSize: '14px',
                          margin: 0,
                          fontWeight: 600,
                          textTransform: 'capitalize',
                        }}
                      >
                        {order.paymentStatus}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estimated time / pickup info */}
              <div
                style={{
                  background: 'rgba(252, 54, 120, 0.06)',
                  border: '1px solid rgba(252, 54, 120, 0.15)',
                  borderRadius: '16px',
                  padding: '24px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '16px',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'rgba(252, 54, 120, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      flexShrink: 0,
                    }}
                  >
                    {isDelivery ? '🛵' : '⏱️'}
                  </div>
                  <div>
                    <p style={{ color: '#fff', fontSize: '16px', fontWeight: 700, margin: 0 }}>
                      {isDelivery ? 'Delivery Estimate' : 'Estimated Ready Time'}
                    </p>
                  </div>
                </div>
                <p
                  style={{
                    color: '#f1d00f',
                    fontSize: '24px',
                    fontWeight: 700,
                    margin: '0 0 4px',
                    textAlign: 'center',
                  }}
                >
                  {isDelivery
                    ? estimatedTime || '45–60 min'
                    : '20–30 min'}
                </p>
                <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0, textAlign: 'center' }}>
                  {isDelivery
                    ? estimatedTime
                      ? 'Estimated delivery time'
                      : 'A Dasher will be assigned shortly'
                    : 'We\'ll have it ready for you!'}
                </p>
              </div>

              {/* Delivery address / Pickup location */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '20px' }}>{isDelivery ? '📍' : '🏪'}</span>
                  <h3
                    style={{
                      color: '#f1d00f',
                      fontSize: '16px',
                      fontWeight: 700,
                      margin: 0,
                    }}
                  >
                    {isDelivery ? 'Delivering To' : 'Pickup Location'}
                  </h3>
                </div>
                {isDelivery && order.deliveryAddress ? (
                  <p style={{ color: '#ddd', fontSize: '14px', margin: 0, lineHeight: 1.5 }}>
                    {order.deliveryAddress}
                  </p>
                ) : (
                  <div>
                    <p style={{ color: '#ddd', fontSize: '14px', margin: '0 0 4px', fontWeight: 600 }}>
                      A-Ru Sushi
                    </p>
                    <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
                      225 McMurray Rd Ste D
                      <br />
                      Buellton, CA 93427
                    </p>
                  </div>
                )}
              </div>

              {/* Notifications */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    background: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <span style={{ fontSize: '16px', flexShrink: 0 }}>📧</span>
                  <p style={{ color: '#93c5fd', fontSize: '13px', margin: 0, lineHeight: 1.4 }}>
                    Confirmation email sent to{' '}
                    <span style={{ fontWeight: 600, color: '#bfdbfe' }}>
                      {user?.email}
                    </span>
                  </p>
                </div>
                <div
                  style={{
                    background: 'rgba(74, 222, 128, 0.08)',
                    border: '1px solid rgba(74, 222, 128, 0.2)',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <span style={{ fontSize: '16px', flexShrink: 0 }}>🍣</span>
                  <p style={{ color: '#86efac', fontSize: '13px', margin: 0, lineHeight: 1.4 }}>
                    Your order has been sent to our kitchen
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div
            style={{
              marginTop: '32px',
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <Link
              href={orderId ? `/order-tracking?orderId=${orderId}` : '/my-orders'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#fc3678',
                color: '#fff',
                padding: '14px 28px',
                borderRadius: '10px',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '15px',
                boxShadow: '0 4px 16px rgba(252, 54, 120, 0.3)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
            >
              Track My Order
            </Link>
            <Link
              href="/menu"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'transparent',
                color: '#f1d00f',
                border: '1px solid rgba(241, 208, 15, 0.4)',
                padding: '14px 28px',
                borderRadius: '10px',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '15px',
                transition: 'background 0.2s',
              }}
            >
              Order More
            </Link>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'transparent',
                color: '#9ca3af',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '14px 28px',
                borderRadius: '10px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '15px',
                transition: 'background 0.2s',
              }}
            >
              Back to Home
            </Link>
          </div>

          {/* Contact footer */}
          <div style={{ textAlign: 'center', marginTop: '24px', paddingBottom: '8px' }}>
            <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>
              Questions? Call us at{' '}
              <a
                href="tel:805-686-9001"
                style={{ color: '#fc3678', textDecoration: 'none', fontWeight: 600 }}
              >
                (805) 686-9001
              </a>
            </p>
          </div>
        </div>
      </div>

      <Footer />

      <style jsx>{`
        .confirmation-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
          gap: 24px;
        }
        @media (max-width: 768px) {
          .confirmation-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
