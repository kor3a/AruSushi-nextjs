import Link from 'next/link';
import CapsuleOrderProgress from './CapsuleOrderProgress';
import { isPickupOrderActive } from '../lib/orders/pickupStatus';
import { getDeliveryEventLabel } from '../lib/orders/deliveryStatus';

export interface ActiveOrderSummary {
  id: string;
  orderType: string;
  status: string;
  items: {
    itemName: string;
    itemPrice: number | string;
    quantity: number;
    specialNotes?: string | null;
  }[];
  total: number | string;
  deliveryAddress?: string | null;
  deliveryLastEvent?: string | null;
  doordashDeliveryId?: string | null;
  dasherName?: string | null;
  estimatedDropoffTime?: string | null;
  createdAt: string;
}

export function isOrderActive(order: Pick<ActiveOrderSummary, 'orderType' | 'status'>): boolean {
  if (order.orderType === 'delivery') {
    return order.status !== 'delivered' && order.status !== 'cancelled';
  }

  return isPickupOrderActive(order.status);
}

const sectionDivider = {
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  marginTop: '16px',
  paddingTop: '16px',
};

interface ActiveOrdersProgressProps {
  orders: ActiveOrderSummary[];
}

export default function ActiveOrdersProgress({ orders }: ActiveOrdersProgressProps) {
  if (orders.length === 0) {
    return null;
  }

  return (
    <section style={{ marginBottom: '40px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', marginBottom: '16px' }}>
        {orders.length === 1 ? 'Active Order' : `Active Orders (${orders.length})`}
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {orders.map((order) => {
          const orderType = order.orderType === 'delivery' ? 'delivery' : 'pickup';

          return (
            <div
              key={order.id}
              style={{
                background: 'rgba(252, 54, 120, 0.06)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                border: '1px solid rgba(252, 54, 120, 0.35)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                padding: '20px',
              }}
            >
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                gap: '8px',
                marginBottom: '16px',
              }}>
                <span style={{ color: '#f1d00f', fontSize: '14px', fontWeight: 600 }}>
                  Order #{order.id.slice(0, 8)}
                </span>
                <span style={{ color: '#888', fontSize: '12px' }}>
                  {orderType === 'delivery' ? 'Delivery' : 'Pickup'} · placed{' '}
                  {new Date(order.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </span>
              </div>

              <CapsuleOrderProgress
                orderType={orderType}
                status={order.status}
                deliveryLastEvent={order.deliveryLastEvent}
              />

              {orderType === 'delivery' && (order.deliveryLastEvent || order.dasherName || order.doordashDeliveryId) && (
                <div style={sectionDivider}>
                  {order.deliveryLastEvent && (
                    <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '8px' }}>
                      {getDeliveryEventLabel(order.deliveryLastEvent)}
                    </p>
                  )}
                  {order.dasherName && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '16px' }}>🛵</span>
                      <span style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>
                        {order.dasherName}
                      </span>
                      {order.estimatedDropoffTime && (
                        <span style={{ color: '#4ade80', fontSize: '13px' }}>
                          · ETA {new Date(order.estimatedDropoffTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  )}
                  {order.deliveryAddress && (
                    <p style={{ fontSize: '13px', color: '#ccc', marginBottom: '8px' }}>
                      <span style={{ color: '#f1d00f' }}>Address:</span> {order.deliveryAddress}
                    </p>
                  )}
                  {order.doordashDeliveryId && (
                    <Link
                      href={`/order-tracking?orderId=${order.id}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#fc3678',
                        color: '#fff',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontWeight: 600,
                        fontSize: '13px',
                        boxShadow: '0 2px 8px rgba(252, 54, 120, 0.3)',
                      }}
                    >
                      📍 Track Live Delivery
                    </Link>
                  )}
                </div>
              )}

              {/* Items */}
              <div style={sectionDivider}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#f1d00f', marginBottom: '12px' }}>
                  Items
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {order.items.map((item, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      fontSize: '14px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ color: '#fff' }}>
                          {item.itemName} <span style={{ color: '#888' }}>x{item.quantity}</span>
                        </span>
                        {item.specialNotes && (
                          <p style={{ color: '#888', fontSize: '12px', fontStyle: 'italic', marginTop: '2px' }}>
                            Note: {item.specialNotes}
                          </p>
                        )}
                      </div>
                      <span style={{ color: '#ccc', marginLeft: '16px' }}>
                        ${(Number(item.itemPrice) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div style={{
                ...sectionDivider,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>Total</span>
                <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#fc3678' }}>
                  ${Number(order.total).toFixed(2)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
