import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useCart } from '../contexts/CartContext';
import { FaTrash, FaMinus, FaPlus } from 'react-icons/fa';

export default function Cart() {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, removeItem, updateQuantity, updateSpecialNotes, clearCart, getTotalPrice } =
    useCart();
  const [editingNotes, setEditingNotes] = useState<{ [key: string]: boolean }>({});
  const [notesValue, setNotesValue] = useState<{ [key: string]: string }>({});
  const [mounted, setMounted] = useState(false);

  // Wait for client-side mount to prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCheckout = () => {
    if (!session) {
      // Redirect to sign in with return URL to checkout
      router.push('/auth/signin?returnUrl=/checkout');
    } else {
      router.push('/checkout');
    }
  };

  const handleEditNotes = (id: string, currentNotes?: string) => {
    setEditingNotes({ ...editingNotes, [id]: true });
    setNotesValue({ ...notesValue, [id]: currentNotes || '' });
  };

  const handleSaveNotes = (id: string) => {
    updateSpecialNotes(id, notesValue[id] || '');
    setEditingNotes({ ...editingNotes, [id]: false });
  };

  const totalPrice = getTotalPrice();

  return (
    <>
      <Head>
        <title>Shopping Cart - A-Ru Sushi</title>
        <meta name="description" content="Your shopping cart" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <div style={{
        paddingTop: '140px',
        paddingBottom: '60px',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        padding: '140px 20px 60px'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#f1d00f', marginBottom: '32px', textAlign: 'center' }}>Shopping Cart</h1>

          {!mounted ? (
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              padding: '40px',
              borderRadius: '16px',
              border: '1px solid rgba(252, 54, 120, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              textAlign: 'center'
            }}>
              <p style={{ color: '#f1d00f', fontSize: '16px' }}>Loading cart...</p>
            </div>
          ) : items.length === 0 ? (
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              padding: '40px',
              borderRadius: '16px',
              border: '1px solid rgba(252, 54, 120, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              textAlign: 'center'
            }}>
              <p style={{ color: '#ccc', marginBottom: '20px', fontSize: '16px' }}>Your cart is empty</p>
              <Link
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
              </Link>
            </div>
          ) : (
            <>
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                border: '1px solid rgba(252, 54, 120, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                marginBottom: '24px'
              }}>
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '24px',
                      borderBottom: index < items.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px'
                    }}
                  >
                    <div style={{ flex: '1' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#f1d00f' }}>{item.name}</h3>
                      <p style={{ color: '#ccc', marginTop: '4px' }}>${item.price.toFixed(2)} each</p>

                      {item.specialNotes && !editingNotes[item.id] && (
                        <div style={{ marginTop: '8px', fontSize: '14px', color: '#ccc' }}>
                          <strong style={{ color: '#f1d00f' }}>Note:</strong> {item.specialNotes}
                        </div>
                      )}

                      {editingNotes[item.id] && (
                        <div style={{ marginTop: '8px' }}>
                          <input
                            type="text"
                            value={notesValue[item.id] || ''}
                            onChange={(e) =>
                              setNotesValue({ ...notesValue, [item.id]: e.target.value })
                            }
                            style={{
                              width: '100%',
                              padding: '12px',
                              background: 'rgba(255, 255, 255, 0.08)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '8px',
                              color: '#fff',
                              fontSize: '14px'
                            }}
                            placeholder="Special instructions"
                          />
                          <button
                            onClick={() => handleSaveNotes(item.id)}
                            style={{
                              marginTop: '8px',
                              fontSize: '14px',
                              color: '#fc3678',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontWeight: '600'
                            }}
                          >
                            Save
                          </button>
                        </div>
                      )}

                      {!editingNotes[item.id] && (
                        <button
                          onClick={() => handleEditNotes(item.id, item.specialNotes)}
                          style={{
                            marginTop: '8px',
                            fontSize: '14px',
                            color: '#999',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          {item.specialNotes ? 'Edit note' : 'Add note'}
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '8px' }}>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          style={{
                            padding: '8px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#f1d00f',
                            borderRadius: '8px 0 0 8px'
                          }}
                        >
                          <FaMinus size={12} />
                        </button>
                        <span style={{ padding: '8px 16px', fontWeight: '600', color: '#fff' }}>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          style={{
                            padding: '8px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#f1d00f',
                            borderRadius: '0 8px 8px 0'
                          }}
                        >
                          <FaPlus size={12} />
                        </button>
                      </div>

                      <div style={{ minWidth: '80px', textAlign: 'right' }}>
                        <p style={{ fontWeight: 'bold', color: '#fc3678', fontSize: '18px' }}>
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        style={{
                          padding: '8px',
                          color: '#ff4444',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                        title="Remove item"
                      >
                        <FaTrash size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                border: '1px solid rgba(252, 54, 120, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                padding: '32px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>Total:</span>
                  <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#fc3678' }}>
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>

                {!session && (
                  <div style={{
                    background: 'rgba(241, 208, 15, 0.1)',
                    border: '1px solid rgba(241, 208, 15, 0.3)',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '16px'
                  }}>
                    <p style={{ color: '#f1d00f', fontWeight: '600', marginBottom: '4px', fontSize: '14px' }}>Sign in to checkout</p>
                    <p style={{ color: '#ccc', fontSize: '12px' }}>
                      You'll need to sign in to complete your order
                    </p>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <button
                    onClick={() => clearCart()}
                    style={{
                      width: '100%',
                      padding: '14px 24px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                  >
                    Clear Cart
                  </button>
                  <button
                    onClick={handleCheckout}
                    style={{
                      width: '100%',
                      padding: '14px 24px',
                      background: '#fc3678',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(252, 54, 120, 0.3)',
                      transition: 'all 0.3s'
                    }}
                  >
                    {session ? 'Proceed to Checkout' : 'Sign In to Checkout'}
                  </button>
                </div>

                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                  <Link href="/menu" style={{ color: '#fc3678', fontWeight: '600', textDecoration: 'none' }}>
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
