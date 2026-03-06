import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useAuth } from '../../contexts/AuthContext';
import { canManageOrders } from '../../lib/auth/roles';
import { lunchMenu, dinnerMenu, MenuCategory } from '../../data/menuData';

interface PriceEdit {
  menuType: string;
  category: string;
  itemName: string;
  price: number;
}

export default function AdminMenuPricesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>({});
  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'lunch' | 'dinner'>('lunch');

  const canAccess = useMemo(() => canManageOrders(user?.email), [user?.email]);

  const fetchPrices = async () => {
    try {
      const response = await fetch('/api/menu/prices');
      if (response.ok) {
        const data = await response.json();
        setPriceOverrides(data.priceOverrides || {});
      }
    } catch {
      // Use defaults if fetch fails
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/auth/signin?returnUrl=/admin/menu-prices');
      return;
    }

    if (!canAccess) {
      setLoading(false);
      setError('You do not have permission to access this page.');
      return;
    }

    fetchPrices();
  }, [authLoading, user, canAccess, router]);

  const getItemKey = (menuType: string, category: string, itemName: string) =>
    `${menuType}::${category}::${itemName}`;

  const getCurrentPrice = (menuType: string, category: string, itemName: string, defaultPrice: number) => {
    const key = getItemKey(menuType, category, itemName);
    if (key in editedPrices) return editedPrices[key];
    if (key in priceOverrides) return priceOverrides[key];
    return defaultPrice;
  };

  const handlePriceChange = (menuType: string, category: string, itemName: string, value: string) => {
    const key = getItemKey(menuType, category, itemName);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setEditedPrices(prev => ({ ...prev, [key]: numValue }));
    }
  };

  const getChangedPrices = (): PriceEdit[] => {
    const changes: PriceEdit[] = [];
    for (const [key, price] of Object.entries(editedPrices)) {
      const existingOverride = priceOverrides[key];
      if (existingOverride !== price) {
        const [menuType, category, itemName] = key.split('::');
        changes.push({ menuType, category, itemName, price });
      }
    }
    return changes;
  };

  const handleSave = async () => {
    const changes = getChangedPrices();
    if (changes.length === 0) {
      setError('No changes to save.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/menu/prices', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: changes }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save prices');
      }

      const newOverrides = { ...priceOverrides };
      for (const change of changes) {
        const key = getItemKey(change.menuType, change.category, change.itemName);
        newOverrides[key] = change.price;
      }
      setPriceOverrides(newOverrides);
      setEditedPrices({});
      setSuccess(`${changes.length} price(s) updated successfully! Changes are now live.`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to save prices');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setEditedPrices({});
    setError('');
    setSuccess('');
  };

  const changedCount = getChangedPrices().length;

  const filterItems = (menu: MenuCategory[], menuType: string) => {
    if (!searchQuery.trim()) return menu;
    const q = searchQuery.toLowerCase();
    return menu
      .map(cat => ({
        ...cat,
        items: cat.items.filter(item =>
          item.name.toLowerCase().includes(q) ||
          cat.category.toLowerCase().includes(q)
        ),
      }))
      .filter(cat => cat.items.length > 0);
  };

  const currentMenu = activeTab === 'lunch' ? lunchMenu : dinnerMenu;
  const filteredMenu = filterItems(currentMenu, activeTab);

  return (
    <>
      <Head>
        <title>Menu Prices - A-Ru Sushi Admin</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      </Head>
      <Header />

      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          padding: '140px 20px 60px',
        }}
      >
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h1
            style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#f1d00f',
              marginBottom: '8px',
              textAlign: 'center',
            }}
          >
            Menu Prices
          </h1>
          <p style={{ color: '#aaa', textAlign: 'center', marginBottom: '24px', fontSize: '14px' }}>
            Edit prices below and click Save to update the live menu.
          </p>

          {error && (
            <div
              style={{
                marginBottom: '16px',
                padding: '14px',
                borderRadius: '8px',
                background: 'rgba(255, 68, 68, 0.1)',
                border: '1px solid rgba(255, 68, 68, 0.3)',
                color: '#ff7a7a',
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                marginBottom: '16px',
                padding: '14px',
                borderRadius: '8px',
                background: 'rgba(76, 175, 80, 0.1)',
                border: '1px solid rgba(76, 175, 80, 0.3)',
                color: '#81c784',
              }}
            >
              {success}
            </div>
          )}

          {/* Controls */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '20px',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('lunch')}
                style={{
                  background: activeTab === 'lunch' ? '#fc3678' : 'transparent',
                  color: activeTab === 'lunch' ? '#fff' : '#f1d00f',
                  border: activeTab === 'lunch' ? 'none' : '1px solid rgba(241, 208, 15, 0.5)',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Lunch
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('dinner')}
                style={{
                  background: activeTab === 'dinner' ? '#fc3678' : 'transparent',
                  color: activeTab === 'dinner' ? '#fff' : '#f1d00f',
                  border: activeTab === 'dinner' ? 'none' : '1px solid rgba(241, 208, 15, 0.5)',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Dinner
              </button>
            </div>

            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #555',
                background: '#111',
                color: '#fff',
                fontSize: '14px',
                width: '220px',
              }}
            />
          </div>

          {/* Save bar */}
          {changedCount > 0 && (
            <div
              style={{
                position: 'sticky',
                top: '80px',
                zIndex: 10,
                marginBottom: '16px',
                padding: '14px 16px',
                borderRadius: '12px',
                background: 'rgba(252, 54, 120, 0.15)',
                border: '1px solid rgba(252, 54, 120, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
                backdropFilter: 'blur(10px)',
              }}
            >
              <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>
                {changedCount} unsaved price change{changedCount > 1 ? 's' : ''}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={saving}
                  style={{
                    background: 'transparent',
                    color: '#ccc',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    background: '#4CAF50',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 20px',
                    fontWeight: 700,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.6 : 1,
                    fontSize: '14px',
                  }}
                >
                  {saving ? 'Saving...' : 'Save & Publish'}
                </button>
              </div>
            </div>
          )}

          {(authLoading || loading) && (
            <p style={{ color: '#f1d00f', textAlign: 'center' }}>Loading...</p>
          )}

          {!loading && !authLoading && filteredMenu.length === 0 && (
            <p style={{ color: '#ccc', textAlign: 'center' }}>No items match your search.</p>
          )}

          {/* Menu items */}
          {!loading &&
            filteredMenu.map((category) => (
              <div
                key={category.category}
                style={{
                  marginBottom: '20px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(252, 54, 120, 0.2)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '14px 16px',
                    background: 'rgba(252, 54, 120, 0.08)',
                    borderBottom: '1px solid rgba(252, 54, 120, 0.15)',
                  }}
                >
                  <h2 style={{ color: '#f1d00f', fontSize: '18px', margin: 0 }}>
                    {category.category}
                  </h2>
                </div>

                <div style={{ padding: '4px 0' }}>
                  {category.items.map((item) => {
                    const key = getItemKey(activeTab, category.category, item.name);
                    const currentPrice = getCurrentPrice(activeTab, category.category, item.name, item.price);
                    const hasOverride = key in priceOverrides;
                    const isEdited = key in editedPrices && editedPrices[key] !== (priceOverrides[key] ?? item.price);

                    return (
                      <div
                        key={item.name}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 16px',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          background: isEdited ? 'rgba(252, 54, 120, 0.05)' : 'transparent',
                          gap: '12px',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span
                            style={{
                              color: '#fff',
                              fontSize: '14px',
                              display: 'block',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                            title={item.name}
                          >
                            {item.name}
                          </span>
                          {hasOverride && !isEdited && (
                            <span style={{ color: '#81c784', fontSize: '11px' }}>
                              Custom price (default: ${item.price.toFixed(2)})
                            </span>
                          )}
                          {isEdited && (
                            <span style={{ color: '#fc3678', fontSize: '11px' }}>
                              Changed (was: ${(priceOverrides[key] ?? item.price).toFixed(2)})
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                          <span style={{ color: '#f1d00f', fontSize: '16px', fontWeight: 700 }}>$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={currentPrice}
                            onChange={(e) =>
                              handlePriceChange(activeTab, category.category, item.name, e.target.value)
                            }
                            style={{
                              width: '90px',
                              padding: '6px 8px',
                              borderRadius: '6px',
                              border: isEdited
                                ? '2px solid #fc3678'
                                : hasOverride
                                ? '1px solid #81c784'
                                : '1px solid #555',
                              background: '#111',
                              color: '#fff',
                              fontSize: '14px',
                              fontWeight: 600,
                              textAlign: 'right',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      </div>

      <Footer />
    </>
  );
}
