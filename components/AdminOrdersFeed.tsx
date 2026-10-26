import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { FaArrowRight, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { formatTimeAgo, getPageNumbers, getStatusColor, getStatusLabel, isCompletedStatus } from '../lib/orders/orderDisplay';
import { useNow, type StoreOrder } from '../lib/orders/useLiveStoreOrders';
import styles from './AdminHome.module.css';

const FLASH_MS = 2400;

function formatClock(dateString: string): string {
  const date = new Date(dateString);
  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (date.toDateString() === new Date().toDateString()) return time;
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`;
}

function formatDuration(from: string, to: string): string {
  const mins = Math.max(0, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 60000));
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

interface Props {
  orders: StoreOrder[];
  page: number;
  totalPages: number;
  goToPage: (page: number) => void;
  loading: boolean;
  error: string;
}

export default function AdminOrdersFeed({ orders, page, totalPages, goToPage, loading, error }: Props) {
  useNow();

  // Highlight rows that change status, or a new order landing on top of page 1 (not page changes)
  const seen = useRef<Map<string, string> | null>(null);
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (loading) return;
    const prev = seen.current;
    seen.current = new Map(orders.map((o) => [o.id, o.status]));
    if (!prev) return;

    const changed = orders
      .filter((o, idx) => {
        if (prev.has(o.id)) return prev.get(o.id) !== o.status;
        // A live insert pushes the rest of page 1 down by one
        return page === 1 && idx === 0 && orders.length > 1 && prev.has(orders[1].id);
      })
      .map((o) => o.id);
    if (changed.length === 0) return;
    setFlashIds((ids) => new Set(Array.from(ids).concat(changed)));
    timeouts.current.push(
      setTimeout(() => {
        setFlashIds((ids) => new Set(Array.from(ids).filter((id) => !changed.includes(id))));
      }, FLASH_MS)
    );
  }, [orders, loading, page]);

  useEffect(() => () => timeouts.current.forEach(clearTimeout), []);

  return (
    <section className={`${styles.root} ${styles.feedRoot}`} aria-labelledby="orders-feed-title">
      <div className={styles.inner}>
        <div className={styles.head}>
          <div>
            <p className={styles.eyebrow}>
              Order feed <span className={styles.eyebrowKanji}>注文</span>
            </p>
            <h2 id="orders-feed-title" className={styles.title}>Latest orders</h2>
          </div>
          <span className={styles.live}>
            <span className={styles.liveDot} aria-hidden="true" />
            Live
          </span>
        </div>

        {error ? (
          <p className={styles.error}>{error}</p>
        ) : loading && orders.length === 0 ? (
          <p className={styles.empty}>Loading orders…</p>
        ) : orders.length === 0 ? (
          <p className={styles.empty}>No orders yet.</p>
        ) : (
          <div className={`${styles.tableWrap} ${loading ? styles.busy : ''}`} aria-busy={loading}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Order #</th>
                  <th scope="col">Status</th>
                  <th scope="col">Customer</th>
                  <th scope="col">Ordered</th>
                  <th scope="col">Completed</th>
                </tr>
              </thead>
              <tbody aria-live="polite">
                {orders.map((order) => {
                  const color = getStatusColor(order.status);
                  const done = isCompletedStatus(order.status);
                  return (
                    <tr key={order.id} className={flashIds.has(order.id) ? styles.flash : undefined}>
                      <td className={styles.idCell}>#{order.id.slice(0, 8)}</td>
                      <td>
                        <span
                          className={styles.pill}
                          style={{
                            '--status-bg': color.bg,
                            '--status-border': color.border,
                            '--status-text': color.text,
                          } as CSSProperties}
                        >
                          {getStatusLabel(order.orderType, order.status)}
                        </span>
                      </td>
                      <td className={styles.customerCell}>{order.customerName || 'Guest'}</td>
                      <td>
                        {formatClock(order.createdAt)}
                        <span className={styles.timeSub}>{formatTimeAgo(order.createdAt)}</span>
                      </td>
                      <td>
                        {done ? (
                          <>
                            {formatClock(order.updatedAt)}
                            {order.status !== 'cancelled' && (
                              <span className={styles.timeSub}>took {formatDuration(order.createdAt, order.updatedAt)}</span>
                            )}
                          </>
                        ) : (
                          <span className={styles.muted}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className={styles.feedFoot}>
          {totalPages > 1 && (
            <nav className={styles.pager} aria-label="Order feed pages">
              <button
                type="button"
                className={styles.pageBtn}
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                aria-label="Previous page"
              >
                <FaChevronLeft size={11} />
              </button>
              {getPageNumbers(page, totalPages).map((p, idx) =>
                p === 'ellipsis' ? (
                  <span key={`ellipsis-${idx}`} className={styles.pageGap}>…</span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    className={`${styles.pageBtn} ${p === page ? styles.pageCurrent : ''}`}
                    onClick={() => goToPage(p)}
                    aria-current={p === page ? 'page' : undefined}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                type="button"
                className={styles.pageBtn}
                onClick={() => goToPage(page + 1)}
                disabled={page === totalPages}
                aria-label="Next page"
              >
                <FaChevronRight size={11} />
              </button>
            </nav>
          )}
          <Link href="/admin/orders" className={styles.textLink}>
            Manage orders <FaArrowRight size={12} />
          </Link>
        </div>
      </div>
    </section>
  );
}
