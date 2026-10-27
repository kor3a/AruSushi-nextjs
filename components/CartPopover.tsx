import { useEffect, useRef, useState, CSSProperties } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaShoppingCart } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import styles from './CartPopover.module.css';

interface CartPopoverProps {
  itemCount: number;
  onOpen?: () => void;
}

const CartPopover = ({ itemCount, onOpen }: CartPopoverProps) => {
  const router = useRouter();
  const { user } = useAuth();
  const { items, getTotalPrice } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [panelTop, setPanelTop] = useState<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Close whenever the page changes
  useEffect(() => {
    const close = () => setIsOpen(false);
    router.events.on('routeChangeStart', close);
    return () => router.events.off('routeChangeStart', close);
  }, [router.events]);

  const toggle = () => {
    if (!isOpen) {
      // On phones the panel is pinned to the viewport just under the header
      const header = wrapperRef.current?.closest('header');
      setPanelTop(header ? header.getBoundingClientRect().bottom + 8 : null);
      onOpen?.();
    }
    setIsOpen(!isOpen);
  };

  const goToCheckout = () => {
    setIsOpen(false);
    router.push(user ? '/checkout' : '/auth/signin?returnUrl=/checkout');
  };

  const panelStyle = panelTop !== null
    ? ({ '--cart-popover-top': `${panelTop}px` } as CSSProperties)
    : undefined;

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={toggle}
        title="Cart"
        aria-label="Cart"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <FaShoppingCart size={20} />
        {itemCount > 0 && <span className={styles.badge}>{itemCount}</span>}
      </button>

      {isOpen && (
        <div className={styles.panel} style={panelStyle} role="dialog" aria-label="Cart preview">
          <div className={styles.header}>
            <span className={styles.title}>Your Cart</span>
            {items.length > 0 && (
              <span className={styles.count}>
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </span>
            )}
          </div>

          {items.length === 0 ? (
            <>
              <p className={styles.empty}>Your cart is empty</p>
              <div className={styles.actions}>
                <Link href="/menu" className={styles.primary}>
                  Browse Menu
                </Link>
              </div>
            </>
          ) : (
            <>
              <ul className={styles.list}>
                {items.map((item) => {
                  const details = [
                    ...Object.values(item.options || {}).filter(Boolean),
                    item.specialNotes,
                  ].filter(Boolean).join(' · ');

                  return (
                    <li key={item.id} className={styles.item}>
                      <span className={styles.qty}>{item.quantity}×</span>
                      <div className={styles.info}>
                        <div className={styles.name}>{item.name}</div>
                        {details && <div className={styles.meta}>{details}</div>}
                      </div>
                      <span className={styles.price}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <div className={styles.subtotal}>
                <span>Subtotal</span>
                <strong>${getTotalPrice().toFixed(2)}</strong>
              </div>

              <div className={styles.actions}>
                <Link href="/cart" className={styles.secondary}>
                  Go to Cart
                </Link>
                <button type="button" className={styles.primary} onClick={goToCheckout}>
                  Checkout
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CartPopover;
