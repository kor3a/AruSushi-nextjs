import { useEffect, useState, useMemo } from 'react';
import Head from 'next/head';
import Script from 'next/script';
import Image from 'next/image';
import Header from '../components/Header';
import Footer from '../components/Footer';
import MenuItem from '../components/menu/MenuItem';
import { lunchMenu, dinnerMenu, MenuCategory } from '../data/menuData';

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
  const orderingEnabled = false;
  const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch('/api/menu/prices')
      .then(res => res.ok ? res.json() : { priceOverrides: {} })
      .then(data => setPriceOverrides(data.priceOverrides || {}))
      .catch(() => {});
  }, []);

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
          <div
            style={{
              maxWidth: '1000px',
              margin: '0 auto 24px',
              padding: '12px 16px',
              borderRadius: '8px',
              background: '#fff3cd',
              border: '1px solid #ffe69c',
              color: '#664d03',
              fontWeight: 700,
              textAlign: 'center'
            }}
          >
            Ordering Online is coming soon!
          </div>

          <h1 className="heading">Lunch (11am - 3pm)</h1>
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

          <h1 className="heading" style={{ marginTop: '60px' }}>Dinner (3pm - 9pm)</h1>
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
        </section>
      </main>

      <Footer />
    </>
  );
};

export default MenuPage;