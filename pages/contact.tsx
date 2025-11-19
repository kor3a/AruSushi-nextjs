import Head from 'next/head';
import Script from 'next/script';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ContactForm from '../components/ContactForm';

const ContactPage = () => (
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
      <title>Contact Us - A-Ru Sushi</title>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      <link rel="stylesheet" href="style/style.css" />
    </Head>
    <Header />
    <main>
      <ContactForm />
    </main>
    <Footer />
  </>
);

export default ContactPage;