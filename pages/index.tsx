import { useState } from 'react';
import Head from 'next/head';
import Script from 'next/script';
import Image from 'next/image';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CherryBlossom from '@/components/CherryBlossom';
import Chatbot from '../components/Chatbot';
import { AiOutlineClose } from 'react-icons/ai';

const HomePage = () => {
  const [showReviewCard, setShowReviewCard] = useState(true);

  return (
  <>
    
    <Head>
        {/*Google tag (gtag.js)*/}
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-MXRBK3QFC4" strategy='afterInteractive'></Script>
        <Script id='google-analytics' strategy='afterInteractive'>
            {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());

                gtag('config', 'G-MXRBK3QFC4');
            `}
        </Script>
      <title>A-Ru Sushi</title>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      <link rel="stylesheet" href="/style/style.css" />
    </Head>

    <CherryBlossom />

    <div className='relative z-10'>
        <Header />
        <main>
        <div className="home" id="home">
            <div className="swiper home-slider">
                <div className="swiper-wrapper wrapper">
                    <div className="swiper-slide slide slide1">
                        <div className="content">
                            <Image src="/img/homeLogo.png" alt="Logo" width={150} height={100}/>

                            <h3>A-Ru Sushi</h3>
                            <h1>Hungry?</h1>
                            <p>Scroll below to make reservations or order now online!</p>
                            <a href="https://www.doordash.com/en-CA/store/a-ru-japanese-restaurant-buellton-632339/" target="_blank" className="btn">Order Now</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <Chatbot />
        <section className="parallex">
            <div className="parallex-wrapper" style={{ position: 'relative', zIndex: 1 }}>
                <Image
                    src="/img/interior1.png"
                    className="image"
                    alt="Interior Background"
                    width={500}
                    height={500}
                    style={{
                        position: 'absolute',
                        zIndex: 0,
                        pointerEvents: 'none',
                        objectFit: 'cover',
                        width: '100%',
                        height: '100%'
                    }}
                />
                {/* Dark overlay for better contrast */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.5) 100%)',
                    zIndex: 1,
                    pointerEvents: 'none'
                }} />
                {/* Content container */}
                {showReviewCard && (
                <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10,
                    textAlign: 'center',
                    width: '90%',
                    maxWidth: '800px',
                    padding: '40px',
                    pointerEvents: 'auto'
                }}>
                    {/* Glassmorphism card */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '24px',
                        border: '2px solid rgba(252, 54, 120, 0.3)',
                        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.5), 0 0 40px rgba(241, 208, 15, 0.2)',
                        padding: '48px 32px',
                        position: 'relative',
                        pointerEvents: 'auto'
                    }}>
                        {/* Close button */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Close button clicked!'); // Debug log
                                setShowReviewCard(false);
                            }}
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '50%',
                                width: '36px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: '#fff',
                                fontSize: '20px',
                                transition: 'all 0.3s ease',
                                zIndex: 1000,
                                pointerEvents: 'auto'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(252, 54, 120, 0.3)';
                                e.currentTarget.style.transform = 'scale(1.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                            title="Close"
                            aria-label="Close review card"
                        >
                            <AiOutlineClose />
                        </button>
                        {/* Star decoration */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '8px',
                            marginBottom: '24px'
                        }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <span key={star} style={{
                                    fontSize: '32px',
                                    color: '#f1d00f',
                                    textShadow: '0 0 10px rgba(241, 208, 15, 0.5)'
                                }}>★</span>
                            ))}
                        </div>

                        <h2 style={{
                            color: '#fff',
                            fontSize: '3rem',
                            fontWeight: 'bold',
                            textShadow: '2px 2px 8px rgba(0, 0, 0, 0.8)',
                            letterSpacing: '1px',
                            marginBottom: '16px',
                            lineHeight: '1.3'
                        }}>
                            Love Our Sushi?
                        </h2>

                        <p style={{
                            color: '#f1d00f',
                            fontSize: '1.5rem',
                            fontWeight: '500',
                            marginBottom: '32px',
                            textShadow: '1px 1px 4px rgba(0, 0, 0, 0.8)'
                        }}>
                            Share your experience with us!
                        </p>

                        {/* Review buttons */}
                        <div style={{
                            display: 'flex',
                            gap: '16px',
                            justifyContent: 'center',
                            flexWrap: 'wrap'
                        }}>
                            <a
                                href="https://www.yelp.com/biz/a-ru-japanese-restaurant-buellton"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '14px 28px',
                                    background: 'linear-gradient(135deg, #fc3678 0%, #ff5a8f 100%)',
                                    color: '#fff',
                                    borderRadius: '50px',
                                    fontWeight: '600',
                                    fontSize: '16px',
                                    textDecoration: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    boxShadow: '0 8px 24px rgba(252, 54, 120, 0.4)',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(252, 54, 120, 0.5)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(252, 54, 120, 0.4)';
                                }}
                            >
                                <span style={{ fontSize: '20px' }}>⭐</span>
                                Review on Yelp
                            </a>

                            <a
                                href="https://www.google.com/search?q=a-ru+japanese+restaurant+buellton"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '14px 28px',
                                    background: 'linear-gradient(135deg, #f1d00f 0%, #ffd700 100%)',
                                    color: '#333',
                                    borderRadius: '50px',
                                    fontWeight: '600',
                                    fontSize: '16px',
                                    textDecoration: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    boxShadow: '0 8px 24px rgba(241, 208, 15, 0.4)',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(241, 208, 15, 0.5)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(241, 208, 15, 0.4)';
                                }}
                            >
                                <span style={{ fontSize: '20px' }}>⭐</span>
                                Review on Google
                            </a>
                        </div>
                    </div>
                </div>
                )}
            </div>
        </section>
        </main>
        <Footer />
    </div>
  </>
  );
};

export default HomePage;