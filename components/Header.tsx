import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useCart } from '../contexts/CartContext';
import { FaShoppingCart, FaUser, FaSignOutAlt, FaSignInAlt } from 'react-icons/fa';

const Header = () => {
  const { data: session } = useSession();
  const { getTotalItems, items } = useCart();
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Only get cart count on client side to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update cart count when items change
  useEffect(() => {
    if (mounted) {
      setCartItemsCount(getTotalItems());
    }
  }, [mounted, items, getTotalItems]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header>
      <Link href="/" className="logo">
        <img src="/img/aruLogo2.png" alt="A-Ru Sushi Logo" />
      </Link>
      <nav className={`navbar ${isMenuOpen ? 'active' : ''}`}>
        <Link href="/" onClick={closeMenu}>Home</Link>
        <Link href="/menu" onClick={closeMenu}>Menu</Link>
        {session && <Link href="/my-orders" onClick={closeMenu}>My Orders</Link>}
        <Link href="/contact" onClick={closeMenu}>Contact Us</Link>
        <a href="https://www.doordash.com/en-CA/store/a-ru-japanese-restaurant-buellton-632339/" target="_blank" rel="noopener noreferrer" onClick={closeMenu}>Order via DoorDash</a>
      </nav>
      <div className="icons" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link href="/cart" style={{ position: 'relative', display: 'inline-block' }}>
          <FaShoppingCart size={20} style={{ color: '#f1d00f' }} />
          {cartItemsCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              background: '#fc3678',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {cartItemsCount}
            </span>
          )}
        </Link>
        {session ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link href="/profile" style={{ color: '#f1d00f', display: 'flex', alignItems: 'center' }} title="Profile">
              <FaUser size={18} style={{ color: '#f1d00f' }} />
            </Link>
            <button
              onClick={() => signOut()}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '5px',
                color: '#f1d00f'
              }}
              title="Sign out"
            >
              <FaSignOutAlt size={18} style={{ color: '#f1d00f' }} />
            </button>
          </div>
        ) : (
          <Link href="/auth/signin" style={{ color: '#f1d00f' }}>
            <FaSignInAlt size={18} title="Sign in" style={{ color: '#f1d00f' }} />
          </Link>
        )}
        <button
          id="menu"
          onClick={toggleMenu}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '5px',
            color: '#f1d00f',
            fontSize: '20px'
          }}
          aria-label="Toggle menu"
        >
          <i className="fas fa-bars"></i>
        </button>
      </div>
    </header>
  );
};

export default Header;