import Head from 'next/head';
import Script from 'next/script';
import Image from 'next/image';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CherryBlossom from '@/components/CherryBlossom';
import Chatbot from '../components/Chatbot';

const HomePage = () => (
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
                        <Chatbot />
                        {/* <div className="content">
                            <Image src="/img/homeLogo.png" alt="Logo" width={150} height={100}/>

                            <h3>A-Ru Sushi</h3>
                            <h1>Hungry?</h1>
                            <p>Scroll below to make reservations or order now online!</p>
                            <a href="https://www.doordash.com/en-CA/store/a-ru-japanese-restaurant-buellton-632339/" target="_blank" className="btn">Order Now</a>
                        </div> */}
                    </div>
                </div>
            </div>
        </div>
        <section className="parallex">
            <div className="parallex-wrapper">
                <Image src="/img/interior1.png" className="image" alt="Interior Background" width={500} height={500} />
                <div className="text">
                    <h2>Write us a review on Yelp & Google!</h2>
                </div>
            </div>
        </section>
        </main>
        <Footer />
    </div>
  </>
);

export default HomePage;