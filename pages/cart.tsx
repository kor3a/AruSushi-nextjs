import { useState } from 'react';
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

      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

          {items.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <p className="text-gray-600 mb-4">Your cart is empty</p>
              <Link
                href="/menu"
                className="inline-block bg-pink-600 text-white px-6 py-3 rounded-md hover:bg-pink-700"
              >
                Browse Menu
              </Link>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow-md mb-6">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-6 border-b last:border-b-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                      <p className="text-gray-600 mt-1">${item.price.toFixed(2)} each</p>

                      {item.specialNotes && !editingNotes[item.id] && (
                        <div className="mt-2 text-sm text-gray-600">
                          <strong>Note:</strong> {item.specialNotes}
                        </div>
                      )}

                      {editingNotes[item.id] && (
                        <div className="mt-2">
                          <input
                            type="text"
                            value={notesValue[item.id] || ''}
                            onChange={(e) =>
                              setNotesValue({ ...notesValue, [item.id]: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            placeholder="Special instructions"
                          />
                          <button
                            onClick={() => handleSaveNotes(item.id)}
                            className="mt-2 text-sm text-pink-600 hover:text-pink-700"
                          >
                            Save
                          </button>
                        </div>
                      )}

                      {!editingNotes[item.id] && (
                        <button
                          onClick={() => handleEditNotes(item.id, item.specialNotes)}
                          className="mt-2 text-sm text-gray-500 hover:text-gray-700"
                        >
                          {item.specialNotes ? 'Edit note' : 'Add note'}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-gray-300 rounded-md">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-2 hover:bg-gray-100"
                        >
                          <FaMinus size={12} />
                        </button>
                        <span className="px-4 py-2 font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-2 hover:bg-gray-100"
                        >
                          <FaPlus size={12} />
                        </button>
                      </div>

                      <div className="w-20 text-right">
                        <p className="font-bold text-gray-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-red-600 hover:text-red-700"
                        title="Remove item"
                      >
                        <FaTrash size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xl font-bold text-gray-900">Total:</span>
                  <span className="text-2xl font-bold text-pink-600">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => clearCart()}
                    className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-300 font-semibold"
                  >
                    Clear Cart
                  </button>
                  <button
                    onClick={handleCheckout}
                    className="flex-1 bg-pink-600 text-white px-6 py-3 rounded-md hover:bg-pink-700 font-semibold"
                  >
                    Proceed to Checkout
                  </button>
                </div>

                <div className="mt-4 text-center">
                  <Link href="/menu" className="text-pink-600 hover:text-pink-700">
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
