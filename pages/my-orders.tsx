import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PickupOrderProgress from '../components/PickupOrderProgress';
import DeliveryOrderProgress from '../components/DeliveryOrderProgress';
import { getDeliveryEventLabel } from '../lib/orders/deliveryStatus';
import { createClient } from '../lib/supabase/client';

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
  deliveryFee?: number | string | null;
  doordashDeliveryId?: string | null;
  doordashDeliveryStatus?: string | null;
  doordashTrackingUrl?: string | null;
  dasherName?: string | null;
  deliveryLastEvent?: string | null;
  estimatedDropoffTime?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function MyOrders() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      const response = await fetch('/api/orders/my-orders');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch orders');
      }

      setOrders(data.orders || []);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'An error occurred');
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    // Redirect if not authenticated
    if (!user) {
      router.push('/auth/signin?returnUrl=/my-orders');
      return;
    }

    // Fetch orders if authenticated
    fetchOrders(true);
  }, [user, authLoading, router, fetchOrders]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const supabase = createClient();
    const channel = supabase
      .channel('order-updates')
      .on('broadcast', { event: 'order-status-changed' }, (message) => {
        if (message.payload?.userId === user.id) {
          fetchOrders();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchOrders]);

  const getStatusStyle = (status: string) => {
    const styles: { [key: string]: { background: string; color: string } } = {
      pending: { background: 'rgba(241, 208, 15, 0.2)', color: '#f1d00f' },
      confirmed: { background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' },
      preparing: { background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc' },
      ready: { background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80' },
      picked_up: { background: 'rgba(148, 163, 184, 0.2)', color: '#cbd5e1' },
      delivered: { background: 'rgba(156, 163, 175, 0.2)', color: '#9ca3af' },
      cancelled: { background: 'rgba(239, 68, 68, 0.2)', color: '#f87171' },
    };
    return styles[status] || { background: 'rgba(156, 163, 175, 0.2)', color: '#9ca3af' };
  };

  const formatStatusLabel = (status: string) => {
    if (status === 'picked_up') {
      return 'Picked Up';
    }

    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Show loading state while auth is loading or while fetching orders
  if (authLoading || loading || !user) {
    return (
      <>
        <Head>
          <title>My Orders - A-Ru Sushi</title>
        </Head>
        <Header />
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          padding: '140px 20px 60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <p style={{ color: '#f1d00f', fontSize: '16px' }}>Loading...</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>My Orders - A-Ru Sushi</title>
        <meta name="description" content="View your order history" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        padding: '140px 20px 60px'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#f1d00f', marginBottom: '32px', textAlign: 'center' }}>
            My Orders
          </h1>

          {error && (
            <div style={{
              marginBottom: '24px',
              padding: '16px',
              background: 'rgba(255, 68, 68, 0.1)',
              border: '1px solid rgba(255, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#ff4444'
            }}>
              {error}
            </div>
          )}

          {orders.length === 0 ? (
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              padding: '40px',
              borderRadius: '16px',
              border: '1px solid rgba(252, 54, 120, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              textAlign: 'center'
            }}>
              <p style={{ color: '#ccc', marginBottom: '20px', fontSize: '16px' }}>
                You haven&apos;t placed any orders yet
              </p>
              <a
                href="/menu"
                style={{
                  display: 'inline-block',
                  background: '#fc3678',
                  color: '#fff',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(252, 54, 120, 0.3)',
                  transition: 'all 0.3s'
                }}
              >
                Browse Menu
              </a>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {orders.map((order) => (
                <div
                  key={order.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px',
                    border: '1px solid rgba(252, 54, 120, 0.2)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    padding: '24px'
                  }}
                >
                  {/* Order Header */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '12px',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <p style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>
                        Order #{order.id.slice(0, 8)}...
                      </p>
                      <p style={{ fontSize: '14px', color: '#ccc' }}>
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        ...getStatusStyle(order.status)
                      }}>
                        {formatStatusLabel(order.status)}
                      </span>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: order.paymentStatus === 'paid'
                          ? 'rgba(34, 197, 94, 0.2)'
                          : 'rgba(241, 208, 15, 0.2)',
                        color: order.paymentStatus === 'paid' ? '#4ade80' : '#f1d00f'
                      }}>
                        {order.paymentStatus === 'paid' ? 'Paid' : 'Pending Payment'}
                      </span>
                    </div>
                  </div>

                  {order.orderType === 'pickup' && (
                    <div
                      style={{
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                        marginTop: '16px',
                        paddingTop: '16px',
                      }}
                    >
                      <PickupOrderProgress status={order.status} />
                    </div>
                  )}

                  {/* Order Items */}
                  <div style={{
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    paddingTop: '16px'
                  }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#f1d00f', marginBottom: '12px' }}>
                      Items
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {order.items.map((item, idx) => (
                        <div key={idx} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          fontSize: '14px'
                        }}>
                          <div style={{ flex: 1 }}>
                            <span style={{ color: '#fff' }}>
                              {item.itemName} <span style={{ color: '#888' }}>x{item.quantity}</span>
                            </span>
                            {item.specialNotes && (
                              <p style={{ color: '#888', fontSize: '12px', fontStyle: 'italic', marginTop: '2px' }}>
                                Note: {item.specialNotes}
                              </p>
                            )}
                          </div>
                          <span style={{ color: '#ccc', marginLeft: '16px' }}>
                            ${(Number(item.itemPrice) * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Progress */}
                  {order.orderType === 'delivery' && (
                    <div
                      style={{
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                        marginTop: '16px',
                        paddingTop: '16px',
                      }}
                    >
                      <DeliveryOrderProgress
                        deliveryEvent={order.deliveryLastEvent}
                        cancelled={order.status === 'cancelled'}
                      />

                      {order.deliveryLastEvent && order.status !== 'cancelled' && order.status !== 'delivered' && (
                        <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '10px', textAlign: 'center' }}>
                          {getDeliveryEventLabel(order.deliveryLastEvent)}
                        </p>
                      )}

                      {order.dasherName && order.status !== 'cancelled' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', justifyContent: 'center' }}>
                          <span style={{ fontSize: '16px' }}>🛵</span>
                          <span style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>
                            {order.dasherName}
                          </span>
                          {order.estimatedDropoffTime && order.status !== 'delivered' && (
                            <span style={{ color: '#4ade80', fontSize: '13px' }}>
                              · ETA {new Date(order.estimatedDropoffTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Delivery Details */}
                  {order.orderType === 'delivery' && (
                    <div style={{
                      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                      marginTop: '16px',
                      paddingTop: '16px'
                    }}>
                      <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#f1d00f', marginBottom: '8px' }}>
                        Delivery Details
                      </h3>
                      {order.deliveryAddress && (
                        <p style={{ fontSize: '14px', color: '#ccc', marginBottom: '4px' }}>
                          <span style={{ color: '#f1d00f' }}>Address:</span> {order.deliveryAddress}
                        </p>
                      )}
                      {order.deliveryPhone && (
                        <p style={{ fontSize: '14px', color: '#ccc', marginBottom: '4px' }}>
                          <span style={{ color: '#f1d00f' }}>Phone:</span> {order.deliveryPhone}
                        </p>
                      )}
                      {order.deliveryFee != null && Number(order.deliveryFee) > 0 && (
                        <p style={{ fontSize: '14px', color: '#ccc', marginBottom: '4px' }}>
                          <span style={{ color: '#f1d00f' }}>Delivery Fee:</span> ${Number(order.deliveryFee).toFixed(2)}
                        </p>
                      )}
                      {order.doordashDeliveryId && order.status !== 'cancelled' && order.status !== 'delivered' && (
                        <div style={{ marginTop: '10px' }}>
                          <Link
                            href={`/order-tracking?orderId=${order.id}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: '#fc3678',
                              color: '#fff',
                              padding: '8px 16px',
                              borderRadius: '8px',
                              textDecoration: 'none',
                              fontWeight: 600,
                              fontSize: '13px',
                              boxShadow: '0 2px 8px rgba(252, 54, 120, 0.3)',
                            }}
                          >
                            📍 Track Live Delivery
                          </Link>
                        </div>
                      )}
                      {order.doordashTrackingUrl && (
                        <p style={{ fontSize: '14px', marginTop: '6px', marginBottom: '4px' }}>
                          <a
                            href={order.doordashTrackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#fc3678', textDecoration: 'underline' }}
                          >
                            DoorDash tracker ↗
                          </a>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Order Notes */}
                  {order.notes && (() => {
                    // Strip internal delivery issue tags from display
                    const displayNotes = order.notes.replace(/\[DELIVERY ISSUE:[^\]]*\]\s*/g, '').trim();
                    return displayNotes ? (
                      <div style={{
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                        marginTop: '16px',
                        paddingTop: '16px'
                      }}>
                        <p style={{ fontSize: '14px', color: '#ccc' }}>
                          <span style={{ color: '#f1d00f' }}>Notes:</span> {displayNotes}
                        </p>
                      </div>
                    ) : null;
                  })()}

                  {/* Order Total */}
                  <div style={{
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    marginTop: '16px',
                    paddingTop: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>Total</span>
                    <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#fc3678' }}>
                      ${Number(order.total).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
