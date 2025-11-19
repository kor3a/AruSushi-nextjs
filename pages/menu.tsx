import Head from 'next/head';
import Script from 'next/script';
import Image from 'next/image';
import Header from '../components/Header';
import Footer from '../components/Footer';
import MenuItem from '../components/menu/MenuItem';
import { lunchMenu, dinnerMenu } from '../data/menuData';

const MenuPage = () => (
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
        <h1 className="heading">Lunch (11am - 3pm)</h1>
        <div className="menu-container">
          {lunchMenu.map((category, idx) => (
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
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <h1 className="heading" style={{ marginTop: '60px' }}>Dinner (3pm - 9pm)</h1>
        <div className="menu-container">
          {dinnerMenu.map((category, idx) => (
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

export default MenuPage;
