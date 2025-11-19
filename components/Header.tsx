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

  return (
    <header>
      <Link href="/" className="logo">
        <img src="/img/aruLogo2.png" alt="A-Ru Sushi Logo" />
      </Link>
      <nav className="navbar">
        <Link href="/">Home</Link>
        <Link href="/menu">Menu</Link>
        {session && <Link href="/my-orders">My Orders</Link>}
        <Link href="/contact">Contact Us</Link>
        <a href="https://www.doordash.com/en-CA/store/a-ru-japanese-restaurant-buellton-632339/" target="_blank" rel="noopener noreferrer">Order via DoorDash</a>
      </nav>
      <div className="icons" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link href="/cart" style={{ position: 'relative', display: 'inline-block' }}>
          <FaShoppingCart size={20} />
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
            <span style={{ fontSize: '14px' }}>
              <FaUser size={16} style={{ marginRight: '5px' }} />
              {session.user.name || session.user.email}
            </span>
            <button
              onClick={() => signOut()}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '5px'
              }}
              title="Sign out"
            >
              <FaSignOutAlt size={18} />
            </button>
          </div>
        ) : (
          <Link href="/auth/signin">
            <FaSignInAlt size={18} title="Sign in" />
          </Link>
        )}
        <i className="fas fa-bars" id="menu"></i>
      </div>
    </header>
  );
};

export default Header;