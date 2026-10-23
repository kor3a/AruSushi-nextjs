import { FaFacebook, FaInstagram, FaYelp } from 'react-icons/fa';

// Icons come from react-icons so the footer doesn't depend on a page loading Font Awesome
const Footer = () => (
    <section className="footer">
      <img src="/img/aruLogo2.png" className="logo" alt="A-Ru Sushi Logo" />
      <div className="container">
        <div>
          <h3>ABOUT US</h3>
          <span>A-Ru Sushi, your destination for authentic Japanese flavors</span>
          <ul>
            <li><a href="https://www.facebook.com/arujapaneserestaurant" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><FaFacebook /></a></li>
            <li><a href="https://www.instagram.com/arusushi_/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><FaInstagram /></a></li>
            <li><a href="https://www.yelp.com/biz/a-ru-sushi-buellton-2" target="_blank" rel="noopener noreferrer" aria-label="Yelp"><FaYelp /></a></li>
          </ul>
        </div>
        <div>
          <h3>HOURS</h3>
          <span>Monday: Closed</span>
          <span>Tuesday: 11am - 9pm</span>
          <span>Wednesday: 11am - 9pm</span>
          <span>Thursday: 11am - 9pm</span>
          <span>Friday: 11am - 9pm</span>
          <span>Saturday: 4pm - 9pm</span>
          <span>Sunday: 4pm - 9pm</span>
        </div>
        <div>
          <h3>CONTACT US</h3> 
          <span>Aru Sushi Japanese Restaurant</span>
          <span>(805)686-9001</span>
          <span>info@aru-sushi.com</span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span>225 McMurray Rd Suite D. Buellton, CA 93427</span>
        </div>
      </div>
      <p>&copy;2019 A-Ru Sushi</p>
    </section>
  );
  
  export default Footer;