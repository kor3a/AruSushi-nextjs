import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FaCheckCircle, FaClock } from 'react-icons/fa';
import PickupOrderProgress from '../components/PickupOrderProgress';
import { createClient } from '../lib/supabase/client';

interface ConfirmedOrder {
  id: string;
  orderType: string;
  status: string;
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

    if (!user) {
      return;
    }

    fetchOrder(true);
  }, [user, authLoading, router, fetchOrder]);

  useEffect(() => {
    if (!user || !orderId || typeof orderId !== 'string') {
      return;
    }

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

  if (authLoading || loading) {
    return (
      <>
        <Head>
          <title>Order Confirmation - A-Ru Sushi</title>
        </Head>
        <Header />
        <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
          <p className="text-gray-600">Loading...</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Order Confirmation - A-Ru Sushi</title>
        <meta name="description" content="Your order has been confirmed" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="mb-6">
              <FaCheckCircle size={64} className="text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
              <p className="text-gray-600">Thank you for your order</p>
            </div>

            {orderId && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-1">Order Number</p>
                <p className="text-xl font-semibold text-gray-900">{orderId}</p>
              </div>
            )}

            <div className="border-t border-b py-6 mb-6">
              <div className="flex items-center justify-center gap-3 text-gray-700">
                <FaClock size={20} className="text-pink-600" />
                <div>
                  <p className="font-semibold">Estimated Preparation Time</p>
                  <p className="text-sm text-gray-600">30-45 minutes</p>
                </div>
              </div>
            </div>

            {order?.orderType === 'pickup' ? (
              <div className="text-left mb-6 bg-gray-50 rounded-lg p-4">
                <PickupOrderProgress status={order.status} />
              </div>
            ) : null}

            {order?.orderType === 'delivery' ? (
              <div className="mb-6 bg-pink-50 border border-pink-200 rounded-lg p-4">
                <p className="text-sm text-pink-800">
                  <strong>🛵 Delivery in Progress</strong>
                  <br />
                  A DoorDash Dasher will be assigned shortly. Use the tracking page below
                  to see live updates and your Dasher&apos;s location on the map.
                </p>
              </div>
            ) : null}

            <div className="space-y-4 mb-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Confirmation Email Sent</strong>
                  <br />
                  We've sent a confirmation email to{' '}
                  <span className="font-semibold">{user?.email}</span>
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <strong>Restaurant Notified</strong>
                  <br />
                  Your order has been sent to our kitchen. We'll start preparing it right away!
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                href={orderId ? `/order-tracking?orderId=${orderId}` : '/my-orders'}
                className="block w-full bg-white border border-pink-600 text-pink-600 px-6 py-3 rounded-md hover:bg-pink-50 font-semibold"
              >
                Track My Order
              </Link>
              <Link
                href="/menu"
                className="block w-full bg-pink-600 text-white px-6 py-3 rounded-md hover:bg-pink-700 font-semibold"
              >
                Order More Food
              </Link>
              <Link
                href="/"
                className="block w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-300 font-semibold"
              >
                Return to Home
              </Link>
            </div>

            <div className="mt-8 pt-6 border-t">
              <p className="text-sm text-gray-600">
                Questions about your order? Contact us at{' '}
                <a href="tel:805-686-8898" className="text-pink-600 hover:text-pink-700">
                  (805) 686-8898
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
