import { useState, useEffect, FormEvent } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useCart } from '../contexts/CartContext';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Delivery quote interface
interface DeliveryQuote {
  id: string;
  externalDeliveryId: string;
  fee: number;
  currency: string;
  estimatedDeliveryMinutes: number | null;
  estimatedPickupTime?: string;
  estimatedDropoffTime?: string;
  expiresAt?: string;
}

function CheckoutForm({ clientSecret }: { clientSecret: string }) {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const { items, getTotalPrice, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup');
  const [phone, setPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryState, setDeliveryState] = useState('');
  const [deliveryZip, setDeliveryZip] = useState('');
  const [notes, setNotes] = useState('');
  
  // Delivery quote state
  const [deliveryQuote, setDeliveryQuote] = useState<DeliveryQuote | null>(null);
  const [deliveryQuoteLoading, setDeliveryQuoteLoading] = useState(false);
  const [deliveryQuoteError, setDeliveryQuoteError] = useState('');

  // Restore delivery quote and form data from sessionStorage on mount (in case of Stripe redirect)
  useEffect(() => {
    const savedData = sessionStorage.getItem('checkoutData');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        if (data.orderType) setOrderType(data.orderType);
        if (data.phone) setPhone(data.phone);
        if (data.deliveryAddress) setDeliveryAddress(data.deliveryAddress);
        if (data.deliveryCity) setDeliveryCity(data.deliveryCity);
        if (data.deliveryState) setDeliveryState(data.deliveryState);
        if (data.deliveryZip) setDeliveryZip(data.deliveryZip);
        if (data.notes) setNotes(data.notes);
        if (data.deliveryQuote) setDeliveryQuote(data.deliveryQuote);
      } catch (e) {
        console.error('Failed to restore checkout data:', e);
      }
    }
  }, []);

  // Save checkout data to sessionStorage whenever it changes
  useEffect(() => {
    const data = {
      orderType,
      phone,
      deliveryAddress,
      deliveryCity,
      deliveryState,
      deliveryZip,
      notes,
      deliveryQuote,
    };
    sessionStorage.setItem('checkoutData', JSON.stringify(data));
  }, [orderType, phone, deliveryAddress, deliveryCity, deliveryState, deliveryZip, notes, deliveryQuote]);

  // Fetch delivery quote when address is complete
  const fetchDeliveryQuote = async (silent: boolean = false): Promise<DeliveryQuote | null> => {
    if (orderType !== 'delivery' || !deliveryAddress || !deliveryCity || !deliveryState || !deliveryZip || !phone) {
      return null;
    }

    if (!silent) {
      setDeliveryQuoteLoading(true);
      setDeliveryQuoteError('');
      setDeliveryQuote(null);
    }

    try {
      const fullAddress = `${deliveryAddress}, ${deliveryCity}, ${deliveryState} ${deliveryZip}`;
      
      const response = await fetch('/api/delivery/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deliveryAddress: fullAddress,
          deliveryPhone: phone,
          orderTotal: getTotalPrice(),
          items,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to get delivery quote');
      }

      if (data.available && data.quote) {
        setDeliveryQuote(data.quote);
        return data.quote;
      } else {
        if (!silent) {
          setDeliveryQuoteError('Delivery is not available for this address');
        }
        return null;
      }
    } catch (err: any) {
      if (!silent) {
        setDeliveryQuoteError(err.message || 'Unable to get delivery quote');
      }
      return null;
    } finally {
      if (!silent) {
        setDeliveryQuoteLoading(false);
      }
    }
  };

  // Check if quote is expired or about to expire (within 30 seconds)
  const isQuoteExpired = (quote: DeliveryQuote | null): boolean => {
    if (!quote) return true;
    if (!quote.expiresAt) return false; // If no expiry, assume it's valid
    
    const expiresAt = new Date(quote.expiresAt).getTime();
    const now = Date.now();
    const bufferMs = 30 * 1000; // 30 second buffer
    
    return now >= (expiresAt - bufferMs);
  };

  // Calculate total with delivery fee
  const getOrderTotal = () => {
    const subtotal = getTotalPrice();
    const deliveryFee = orderType === 'delivery' && deliveryQuote ? deliveryQuote.fee : 0;
    return subtotal + deliveryFee;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    // Validate delivery quote for delivery orders
    if (orderType === 'delivery' && !deliveryQuote) {
      setError('Please get a delivery quote before proceeding');
      return;
    }

    setLoading(true);
    setError('');

    // For delivery orders, check if quote is expired and refresh if needed
    let currentQuote = deliveryQuote;
    if (orderType === 'delivery' && isQuoteExpired(deliveryQuote)) {
      setError('');
      console.log('Quote expired, fetching new quote...');
      
      const newQuote = await fetchDeliveryQuote(true); // Silent refresh
      if (!newQuote) {
        setError('Unable to refresh delivery quote. Please try again.');
        setLoading(false);
        return;
      }
      currentQuote = newQuote;
    }

    try {
      // Confirm the payment
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order-confirmation`,
        },
        redirect: 'if_required',
      });

      if (stripeError) {
        // Handle specific Stripe errors
        if (stripeError.type === 'card_error' || stripeError.type === 'validation_error') {
          setError(stripeError.message || 'Payment failed. Please check your card details.');
        } else if (stripeError.code === 'payment_intent_unexpected_state') {
          // Payment was already processed - check if we need to complete the order
          setError('Payment was already processed. If your order is not in order history, please contact support.');
        } else {
          setError(stripeError.message || 'Payment failed. Please try again.');
        }
        setLoading(false);
        return;
      }

      // Check if payment intent exists and has a valid status
      if (!paymentIntent) {
        setError('Payment could not be processed. Please try again.');
        setLoading(false);
        return;
      }

      // Check payment status
      if (paymentIntent.status !== 'succeeded' && paymentIntent.status !== 'requires_capture') {
        setError(`Payment status: ${paymentIntent.status}. Please try again.`);
        setLoading(false);
        return;
      }

      // Prepare delivery address if delivery option is selected
      const fullDeliveryAddress = orderType === 'delivery' && deliveryAddress && deliveryCity && deliveryState && deliveryZip
        ? `${deliveryAddress}, ${deliveryCity}, ${deliveryState} ${deliveryZip}`
        : null;

      // Calculate total with the current quote (might be refreshed)
      const finalDeliveryFee = orderType === 'delivery' && currentQuote ? currentQuote.fee : 0;
      const finalTotal = getTotalPrice() + finalDeliveryFee;

      // Create order in database (this will accept the DoorDash quote)
      const orderResponse = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          total: finalTotal, // Include delivery fee in total
          orderType,
          paymentIntentId: paymentIntent.id,
          paymentStatus: paymentIntent.status === 'succeeded' ? 'paid' : 'pending',
          deliveryAddress: fullDeliveryAddress,
          deliveryPhone: phone,
          deliveryQuoteId: currentQuote?.id, // DoorDash quote ID to accept (possibly refreshed)
          deliveryFee: currentQuote?.fee, // Delivery fee from quote
          notes,
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        // Provide more helpful error messages
        if (orderData.message?.includes('quote')) {
          throw new Error('Your delivery quote has expired. Please get a new quote and try again.');
        }
        throw new Error(orderData.message || 'Failed to create order. Please try again.');
      }

      // Clear cart, checkout data, and redirect to confirmation
      clearCart();
      sessionStorage.removeItem('checkoutData');
      router.push(`/order-confirmation?orderId=${orderData.order.id}`);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#f1d00f' }}>Order Type</h3>
        
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <label style={{
            flex: 1,
            padding: '16px',
            background: orderType === 'pickup' ? 'rgba(252, 54, 120, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            border: `2px solid ${orderType === 'pickup' ? '#fc3678' : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.3s',
            textAlign: 'center'
          }}>
            <input
              type="radio"
              name="orderType"
              value="pickup"
              checked={orderType === 'pickup'}
              onChange={(e) => setOrderType(e.target.value as 'pickup' | 'delivery')}
              style={{ display: 'none' }}
            />
            <div style={{ color: '#fff', fontWeight: '600', marginBottom: '4px' }}>Pickup</div>
            <div style={{ color: '#ccc', fontSize: '12px' }}>Pick up at restaurant</div>
          </label>

          <label style={{
            flex: 1,
            padding: '16px',
            background: orderType === 'delivery' ? 'rgba(252, 54, 120, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            border: `2px solid ${orderType === 'delivery' ? '#fc3678' : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.3s',
            textAlign: 'center'
          }}>
            <input
              type="radio"
              name="orderType"
              value="delivery"
              checked={orderType === 'delivery'}
              onChange={(e) => setOrderType(e.target.value as 'pickup' | 'delivery')}
              style={{ display: 'none' }}
            />
            <div style={{ color: '#fff', fontWeight: '600', marginBottom: '4px' }}>Delivery</div>
            <div style={{ color: '#ccc', fontSize: '12px' }}>Delivered via DoorDash</div>
          </label>
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#f1d00f' }}>
          {orderType === 'pickup' ? 'Pickup Information' : 'Delivery Information'}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {orderType === 'delivery' && (
            <>
              <div>
                <label htmlFor="deliveryAddress" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#ccc', marginBottom: '4px' }}>
                  Street Address *
                </label>
                <input
                  type="text"
                  id="deliveryAddress"
                  required={orderType === 'delivery'}
                  value={deliveryAddress}
                  onChange={(e) => { setDeliveryAddress(e.target.value); setDeliveryQuote(null); }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  placeholder="123 Main Street"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label htmlFor="deliveryCity" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#ccc', marginBottom: '4px' }}>
                    City *
                  </label>
                  <input
                    type="text"
                    id="deliveryCity"
                    required={orderType === 'delivery'}
                    value={deliveryCity}
                    onChange={(e) => { setDeliveryCity(e.target.value); setDeliveryQuote(null); }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    placeholder="City"
                  />
                </div>

                <div>
                  <label htmlFor="deliveryState" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#ccc', marginBottom: '4px' }}>
                    State *
                  </label>
                  <input
                    type="text"
                    id="deliveryState"
                    required={orderType === 'delivery'}
                    value={deliveryState}
                    onChange={(e) => { setDeliveryState(e.target.value); setDeliveryQuote(null); }}
                    maxLength={2}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                      textTransform: 'uppercase'
                    }}
                    placeholder="CA"
                  />
                </div>

                <div>
                  <label htmlFor="deliveryZip" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#ccc', marginBottom: '4px' }}>
                    ZIP *
                  </label>
                  <input
                    type="text"
                    id="deliveryZip"
                    required={orderType === 'delivery'}
                    value={deliveryZip}
                    onChange={(e) => { setDeliveryZip(e.target.value); setDeliveryQuote(null); }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    placeholder="12345"
                  />
                </div>
              </div>

              {/* Get Delivery Quote Button */}
              <button
                type="button"
                onClick={() => fetchDeliveryQuote(false)}
                disabled={!deliveryAddress || !deliveryCity || !deliveryState || !deliveryZip || !phone || deliveryQuoteLoading}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  background: deliveryQuoteLoading ? 'rgba(241, 208, 15, 0.3)' : '#f1d00f',
                  color: '#1a1a1a',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: (!deliveryAddress || !deliveryCity || !deliveryState || !deliveryZip || !phone || deliveryQuoteLoading) ? 'not-allowed' : 'pointer',
                  opacity: (!deliveryAddress || !deliveryCity || !deliveryState || !deliveryZip || !phone) ? 0.5 : 1,
                  transition: 'all 0.3s'
                }}
              >
                {deliveryQuoteLoading ? 'Getting Quote...' : 'Get Delivery Quote'}
              </button>

              {/* Delivery Quote Error */}
              {deliveryQuoteError && (
                <div style={{
                  padding: '12px',
                  background: 'rgba(255, 68, 68, 0.1)',
                  border: '1px solid rgba(255, 68, 68, 0.3)',
                  borderRadius: '8px',
                  color: '#ff4444',
                  fontSize: '14px'
                }}>
                  {deliveryQuoteError}
                </div>
              )}

              {/* Delivery Quote Display */}
              {deliveryQuote && (
                <div style={{
                  padding: '16px',
                  background: isQuoteExpired(deliveryQuote) ? 'rgba(255, 152, 0, 0.1)' : 'rgba(76, 175, 80, 0.1)',
                  border: `1px solid ${isQuoteExpired(deliveryQuote) ? 'rgba(255, 152, 0, 0.3)' : 'rgba(76, 175, 80, 0.3)'}`,
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    {isQuoteExpired(deliveryQuote) ? (
                      <>
                        <span style={{ color: '#FF9800', fontSize: '18px' }}>⚠</span>
                        <span style={{ color: '#FF9800', fontWeight: '600' }}>Quote Expired - Will refresh on checkout</span>
                      </>
                    ) : (
                      <>
                        <span style={{ color: '#4CAF50', fontSize: '18px' }}>✓</span>
                        <span style={{ color: '#4CAF50', fontWeight: '600' }}>Delivery Available!</span>
                      </>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#ccc' }}>Delivery Fee:</span>
                    <span style={{ color: '#fff', fontWeight: '600' }}>${deliveryQuote.fee.toFixed(2)}</span>
                  </div>
                  {deliveryQuote.estimatedDeliveryMinutes && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#ccc' }}>Estimated Delivery:</span>
                      <span style={{ color: '#fff', fontWeight: '600' }}>{deliveryQuote.estimatedDeliveryMinutes} minutes</span>
                    </div>
                  )}
                  <div style={{ marginTop: '12px', fontSize: '12px', color: '#888' }}>
                    Delivered via DoorDash
                    {deliveryQuote.expiresAt && !isQuoteExpired(deliveryQuote) && (
                      <span> • Quote valid for a few minutes</span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          <div>
            <label htmlFor="phone" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#ccc', marginBottom: '4px' }}>
              Contact Phone Number *
            </label>
            <input
              type="tel"
              id="phone"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none'
              }}
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <label htmlFor="notes" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#ccc', marginBottom: '4px' }}>
              Order Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical'
              }}
              placeholder={orderType === 'pickup' ? 'Any special instructions for your pickup order' : 'Any special instructions for your delivery order'}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#f1d00f' }}>Payment Information</h3>
        <PaymentElement />
      </div>

      {error && (
        <div style={{
          padding: '12px',
          background: 'rgba(255, 68, 68, 0.1)',
          border: '1px solid rgba(255, 68, 68, 0.3)',
          borderRadius: '8px',
          color: '#ff4444'
        }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading || (orderType === 'delivery' && !deliveryQuote)}
        style={{
          width: '100%',
          padding: '14px 24px',
          background: !stripe || loading || (orderType === 'delivery' && !deliveryQuote) ? 'rgba(252, 54, 120, 0.5)' : '#fc3678',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: !stripe || loading || (orderType === 'delivery' && !deliveryQuote) ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 12px rgba(252, 54, 120, 0.3)',
          transition: 'all 0.3s',
          opacity: !stripe || loading || (orderType === 'delivery' && !deliveryQuote) ? 0.5 : 1
        }}
      >
        {loading ? 'Processing...' : `Pay $${getOrderTotal().toFixed(2)}`}
      </button>
      {orderType === 'delivery' && !deliveryQuote && (
        <p style={{ textAlign: 'center', fontSize: '12px', color: '#888', marginTop: '8px' }}>
          Please get a delivery quote before proceeding
        </p>
      )}
    </form>
  );
}

export default function Checkout() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { items, getTotalPrice } = useCart();
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Redirect to sign in if not authenticated
    if (!authLoading && !user) {
      router.push('/auth/signin?returnUrl=/checkout');
      return;
    }

    // Redirect to cart if no items
    if (items.length === 0) {
      router.push('/cart');
      return;
    }

    if (user && items.length > 0) {
      // Create payment intent
      const createPaymentIntent = async () => {
        try {
          const response = await fetch('/api/payment/create-intent', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              amount: getTotalPrice(),
              items,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Failed to create payment intent');
          }

          setClientSecret(data.clientSecret);
        } catch (err: any) {
          setError(err.message || 'An error occurred');
        } finally {
          setLoading(false);
        }
      };

      createPaymentIntent();
    }
  }, [user, authLoading, items, router, getTotalPrice]);

  if (authLoading || loading) {
    return (
      <>
        <Head>
          <title>Checkout - A-Ru Sushi</title>
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

  if (error) {
    return (
      <>
        <Head>
          <title>Checkout - A-Ru Sushi</title>
        </Head>
        <Header />
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          padding: '140px 20px 60px'
        }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{
              background: 'rgba(255, 68, 68, 0.1)',
              border: '1px solid rgba(255, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '16px',
              color: '#ff4444'
            }}>
              {error}
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Checkout - A-Ru Sushi</title>
        <meta name="description" content="Complete your order" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        padding: '140px 20px 60px'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#f1d00f', marginBottom: '32px', textAlign: 'center' }}>Checkout</h1>

          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            border: '1px solid rgba(252, 54, 120, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#f1d00f' }}>Order Summary</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {items.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#ccc' }}>
                  <span>
                    {item.name} x{item.quantity}
                  </span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', marginTop: '16px', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '18px' }}>
                <span style={{ color: '#fff' }}>Total:</span>
                <span style={{ color: '#fc3678' }}>${getTotalPrice().toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            border: '1px solid rgba(252, 54, 120, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            padding: '24px'
          }}>
            {clientSecret && (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm clientSecret={clientSecret} />
              </Elements>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
