import { useEffect, useState, useMemo } from 'react';
import Head from 'next/head';
import Script from 'next/script';
import Image from 'next/image';
import Header from '../components/Header';
import Footer from '../components/Footer';
import MenuItem from '../components/menu/MenuItem';
import { lunchMenu, dinnerMenu, MenuCategory } from '../data/menuData';
import { useAuth } from '../contexts/AuthContext';
import { canManageOrders } from '../lib/auth/roles';

// Lunch is served Monday - Friday, 11am - 3pm, based on the viewer's local time.
function isLunchTime(now: Date): boolean {
  const day = now.getDay();
  const hour = now.getHours();
  return day >= 1 && day <= 5 && hour >= 11 && hour < 15;
}

function applyPriceOverrides(
  menu: MenuCategory[],
  menuType: string,
  overrides: Record<string, number>
): MenuCategory[] {
  return menu.map(cat => ({
    ...cat,
    items: cat.items.map(item => {
      const key = `${menuType}::${cat.category}::${item.name}`;
      const overriddenPrice = overrides[key];
      if (overriddenPrice !== undefined) {
        return { ...item, price: overriddenPrice };
      }
      return item;
    }),
  }));
}

const MenuPage = () => {
  const { user } = useAuth();
  const isAdmin = canManageOrders(user?.email);
  const [lunchHours, setLunchHours] = useState(false);
  const [lunchExpanded, setLunchExpanded] = useState(false);
  const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>({});
  const [pauseInfo, setPauseInfo] = useState<{ ordersPaused: boolean; pauseReason: string | null } | null>(null);
  const orderingEnabled = !pauseInfo?.ordersPaused;

  useEffect(() => {
    fetch('/api/store/settings')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setPauseInfo(data); })
      .catch(() => {});

    fetch('/api/menu/prices')
      .then(res => res.ok ? res.json() : { priceOverrides: {} })
      .then(data => setPriceOverrides(data.priceOverrides || {}))
      .catch(() => {});
  }, []);

  // Checked on the client only (server time may differ from the viewer's),
  // and re-checked every minute so the page flips if left open.
  useEffect(() => {
    const update = () => setLunchHours(isLunchTime(new Date()));
    update();
    const timer = setInterval(update, 60_000);
    return () => clearInterval(timer);
  }, []);

  const showLunch = isAdmin || lunchHours || lunchExpanded;

  const resolvedLunch = useMemo(
    () => applyPriceOverrides(lunchMenu, 'lunch', priceOverrides),
    [priceOverrides]
  );
  const resolvedDinner = useMemo(
    () => applyPriceOverrides(dinnerMenu, 'dinner', priceOverrides),
    [priceOverrides]
  );

  return (
    <>
      <Head>
        {/* Google tag (gtag.js) */}
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-MXRBK3QFC4" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-MXRBK3QFC4');
          `}
        </Script>
        <title>Menu - A-Ru Sushi</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
        <link rel="stylesheet" href="style/style.css" />
      </Head>

      <Header />

      <main>
        <section className="our-menu" id="menu">
          {!orderingEnabled && (
          <div style={{ maxWidth: '500px', margin: '100px auto 20px', padding: '12px 16px', borderRadius: '8px', background: '#fff3cd', border: '1px solid #ffe69c', color: '#664d03', fontWeight: 700, fontSize: '18px', textAlign: 'center' }}>
            Online ordering is temporarily paused.
            {pauseInfo?.pauseReason && (
              <div style={{ fontWeight: 400, fontSize: '15px', marginTop: '6px' }}>{pauseInfo.pauseReason}</div>
            )}
          </div>
          )}
          {!showLunch && (
            <button
              type="button"
              onClick={() => setLunchExpanded(true)}
              aria-expanded={false}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', textAlign: 'left', width: 'calc(100% - 6rem)', maxWidth: '900px', margin: `${orderingEnabled ? '100px' : '0'} auto 0`, padding: '14px 20px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.3)', color: '#fff', fontSize: '18px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' }}
            >
              <span>Lunch (11am - 3pm) <span style={{ fontSize: '14px', opacity: 0.75, textTransform: 'none', letterSpacing: 0 }}>· Mon - Fri</span></span>
              <span aria-hidden="true" style={{ fontSize: '22px' }}>▾</span>
            </button>
          )}

          {showLunch && (
          <>
          <h1 className="heading">Lunch (11am - 3pm)</h1>
          {lunchExpanded && !lunchHours && !isAdmin && (
            <div style={{ textAlign: 'center', marginTop: '-30px', marginBottom: '30px' }}>
              <button
                type="button"
                onClick={() => setLunchExpanded(false)}
                aria-expanded={true}
                style={{ background: 'none', border: '1px solid rgba(255, 255, 255, 0.4)', borderRadius: '6px', color: '#fff', fontSize: '15px', padding: '6px 14px', cursor: 'pointer' }}
              >
                Hide lunch menu ▴
              </button>
            </div>
          )}
          <div className="menu-container">
            {resolvedLunch.map((category, idx) => (
              <div className="item" key={idx}>
                <div className="item-name">
                  <h2>{category.category}</h2>
                  <Image src={category.image} alt={category.category} width={100} height={100} />
                </div>

                <div className="item-body">
                  {category.items.map((item, itemIdx) => (
                    <MenuItem
                      key={itemIdx}
                      name={item.name}
                      price={item.price}
                      description={item.description}
                      options={item.options}
                      orderingEnabled={orderingEnabled}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          </>
          )}

          <h1 className="heading" style={{ marginTop: showLunch ? '60px' : '0' }}>Dinner (Weekends All Day &amp; Daily 3pm - 9pm)</h1>
          <div className="menu-container">
            {resolvedDinner.map((category, idx) => (
              <div className="item" key={idx}>
                <div className="item-name">
                  <h2>{category.category}</h2>
                  <Image src={category.image} alt={category.category} width={100} height={100} />
                </div>

                <div className="item-body">
                  {category.items.map((item, itemIdx) => (
                    <MenuItem
                      key={itemIdx}
                      name={item.name}
                      price={item.price}
                      description={item.description}
                      options={item.options}
                      orderingEnabled={orderingEnabled}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '40px', padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
            <p style={{ fontSize: '16px', color: '#666', marginBottom: '15px' }}>
              <strong>Note:</strong> This is a simplified menu with the most popular items. The full menu is available in-store.
            </p>
            <p style={{ fontSize: '14px', color: '#888' }}>
              All lunch items are served with miso soup and rice unless otherwise noted.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default MenuPage;
