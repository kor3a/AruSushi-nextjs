import Link from 'next/link';

const Header = () => (
  <header>
    <Link href="/" className="logo">
      <img src="/img/aruLogo2.png" alt="A-Ru Sushi Logo" />
    </Link>
    <nav className="navbar">
      <Link href="/">Home</Link>
      <Link href="/menu">Menu</Link>
      <Link href="/contact">Contact Us</Link>
      <a href="https://www.doordash.com/en-CA/store/a-ru-japanese-restaurant-buellton-632339/" target="_blank" rel="noopener noreferrer">Order Now</a>
    </nav>
    <div className="icons">
      <i className="fas fa-bars" id="menu"></i>
    </div>
  </header>
);

export default Header;