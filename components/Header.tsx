import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useRewards } from '../contexts/RewardsContext';
import { canManageOrders } from '../lib/auth/roles';
import { FaShoppingCart, FaUser, FaBars } from 'react-icons/fa';

const Header = () => {
  const { user, signOut } = useAuth();
  const { pointsBalance, loading: rewardsLoading } = useRewards();
  const { getTotalItems, items } = useCart();
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const showAdminOrders = canManageOrders(user?.email);

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
        {showAdminOrders ? (
          <>
            <Link href="/admin/orders" onClick={closeMenu}>Orders</Link>
            <Link href="/admin/menu-prices" onClick={closeMenu}>Menu Prices</Link>
          </>
        ) : (
          <>
            <Link href="/menu" onClick={closeMenu}>Menu</Link>
            {user && <Link href="/my-orders" onClick={closeMenu}>My Orders</Link>}
            <Link href="/members" onClick={closeMenu}>Members</Link>
            <Link href="/contact" onClick={closeMenu}>Contact Us</Link>
            {user && <Link href="/profile" onClick={closeMenu}>Profile</Link>}
          </>
        )}
      </nav>
      <div className="icons" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user && !showAdminOrders && (
          <Link
            href="/rewards"
            style={{
              color: '#f1d00f',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 8px',
              border: '1px solid rgba(241, 208, 15, 0.3)',
              borderRadius: '999px',
              textDecoration: 'none',
            }}
            title="Sushi Rewards"
          >
            <span role="img" aria-label="Sushi icon" style={{ fontSize: '16px', lineHeight: 1 }}>
              🍣
            </span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#f1d00f', whiteSpace: 'nowrap', minWidth: '36px', textAlign: 'center', display: 'inline-block' }}>
              {rewardsLoading && pointsBalance === 0 ? '...' : `${pointsBalance} pts`}
            </span>
          </Link>
        )}
        {!showAdminOrders && (
          <>
            <Link href="/cart" className="cart-mobile" style={{ position: 'relative' }} title="Cart">
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
            <Link href="/cart" className="cart-desktop" style={{ position: 'relative', color: '#f1d00f', textDecoration: 'none', fontSize: '1.7rem', fontWeight: 600 }}>
              Cart
              {cartItemsCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-14px',
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
          </>
        )}
        {user ? (
          <>
            <Link href="/profile" className="auth-mobile" style={{ color: '#f1d00f', alignItems: 'center' }} title="Profile">
              <FaUser size={18} style={{ color: '#f1d00f' }} />
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="auth-desktop"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#f1d00f',
                fontSize: '1.7rem',
                fontWeight: 600,
                padding: 0,
                fontFamily: 'inherit',
              }}
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link href="/auth/signin" className="auth-mobile" style={{ color: '#f1d00f' }} title="Sign in">
              <FaUser size={18} style={{ color: '#f1d00f' }} />
            </Link>
            <Link href="/auth/signin" className="auth-desktop" style={{ color: '#f1d00f', textDecoration: 'none', fontSize: '1.7rem', fontWeight: 600 }}>
              Sign In
            </Link>
          </>
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
          <FaBars />
        </button>
      </div>
    </header>
  );
};

export default Header;
