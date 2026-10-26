import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';
import Link from 'next/link';
import { FaChevronLeft, FaChevronRight, FaArrowRight } from 'react-icons/fa';
import { formatTimeAgo, getStatusColor, getStatusLabel, isCompletedStatus } from '../lib/orders/orderDisplay';
import { useNow, type StoreOrder } from '../lib/orders/useLiveStoreOrders';
import styles from './AdminHome.module.css';

// Movement past this many pixels turns a press into a drag instead of a click
const DRAG_THRESHOLD = 6;

function summarizeItems(order: StoreOrder): string {
  const count = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const names = order.items.map((item) => (item.quantity > 1 ? `${item.quantity}× ${item.itemName}` : item.itemName));
  return `${count} item${count !== 1 ? 's' : ''} · ${names.join(', ')}`;
}

interface Props {
  orders: StoreOrder[];
  loading: boolean;
  error: string;
}

export default function AdminActiveOrders({ orders, loading, error }: Props) {
  useNow();
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ pointerId: -1, startX: 0, startScroll: 0, moved: false });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  // Oldest first, so the order that has waited longest sits at the front
  const activeOrders = orders
    .filter((o) => !isCompletedStatus(o.status))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const updateArrows = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setCanPrev(track.scrollLeft > 4);
    setCanNext(track.scrollLeft + track.clientWidth < track.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    const track = trackRef.current;
    if (!track) return;
    const observer = new ResizeObserver(updateArrows);
    observer.observe(track);
    return () => observer.disconnect();
  }, [updateArrows, activeOrders.length]);

  const scrollByPage = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.85, behavior: 'smooth' });
  };

  // Mouse drag-to-scroll; touch and trackpads already scroll natively
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    drag.current = { pointerId: e.pointerId, startX: e.clientX, startScroll: e.currentTarget.scrollLeft, moved: false };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (state.pointerId !== e.pointerId) return;
    const dx = e.clientX - state.startX;
    if (!state.moved) {
      if (Math.abs(dx) < DRAG_THRESHOLD) return;
      state.moved = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      e.currentTarget.classList.add(styles.dragging);
    }
    e.currentTarget.scrollLeft = state.startScroll - dx;
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (state.pointerId !== e.pointerId) return;
    state.pointerId = -1;
    // Turning snapping back on settles the track onto the nearest card
    if (state.moved) e.currentTarget.classList.remove(styles.dragging);
  };

  // A drag that ends over a card must not open it
  const onClickCapture = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  };

  return (
    <section className={styles.root} aria-labelledby="active-orders-title">
      <div className={styles.inner}>
        <div className={styles.head}>
          <div>
            <p className={styles.eyebrow}>
              Kitchen <span className={styles.eyebrowKanji}>厨房</span>
            </p>
            <h2 id="active-orders-title" className={styles.title}>
              Active orders
              {!loading && !error && <span className={styles.count}>{activeOrders.length}</span>}
            </h2>
          </div>
          <div className={styles.headActions}>
            <Link href="/admin/orders#completed" className={styles.textLink}>
              View completed orders <FaArrowRight size={12} />
            </Link>
            {activeOrders.length > 0 && (
              <div className={styles.arrows}>
                <button
                  type="button"
                  className={styles.arrow}
                  onClick={() => scrollByPage(-1)}
                  disabled={!canPrev}
                  aria-label="Previous orders"
                >
                  <FaChevronLeft />
                </button>
                <button
                  type="button"
                  className={styles.arrow}
                  onClick={() => scrollByPage(1)}
                  disabled={!canNext}
                  aria-label="Next orders"
                >
                  <FaChevronRight />
                </button>
              </div>
            )}
          </div>
        </div>

        {error ? (
          <p className={styles.error}>{error}</p>
        ) : loading ? (
          <p className={styles.empty}>Loading orders…</p>
        ) : activeOrders.length === 0 ? (
          <p className={styles.empty}>No active orders right now.</p>
        ) : (
          <div
            ref={trackRef}
            className={styles.track}
            onScroll={updateArrows}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onClickCapture={onClickCapture}
            onDragStart={(e) => e.preventDefault()}
          >
            {activeOrders.map((order) => {
              const color = getStatusColor(order.status);
              return (
                <Link
                  key={order.id}
                  href="/admin/orders"
                  className={styles.card}
                  draggable={false}
                  style={{
                    '--status-bg': color.bg,
                    '--status-border': color.border,
                    '--status-text': color.text,
                  } as CSSProperties}
                >
                  <div className={styles.cardStatus}>
                    <span className={styles.statusLabel}>{getStatusLabel(order.orderType, order.status)}</span>
                    <span className={styles.typeChip}>{order.orderType}</span>
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.cardTop}>
                      <span className={styles.orderId}>#{order.id.slice(0, 8)}</span>
                      <span className={styles.muted}>{formatTimeAgo(order.createdAt)}</span>
                    </div>
                    <p className={styles.customer}>{order.customerName || 'Guest'}</p>
                    <p className={styles.items}>{summarizeItems(order)}</p>
                    <div className={styles.cardFoot}>
                      <span className={styles.total}>${Number(order.total).toFixed(2)}</span>
                      <span className={styles.muted}>
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
