import { DELIVERY_STATUS_STEPS, getDeliveryStatusLabel, getDeliveryProgressIndex } from '../lib/orders/deliveryStatus';

interface DeliveryOrderProgressProps {
  deliveryEvent: string | null | undefined;
  cancelled?: boolean;
}

export default function DeliveryOrderProgress({ deliveryEvent, cancelled }: DeliveryOrderProgressProps) {
  if (cancelled) {
    return (
      <div style={{ textAlign: 'center', padding: '16px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '12px 20px',
          }}
        >
          <span style={{ fontSize: '20px' }}>&#10005;</span>
          <span style={{ color: '#f87171', fontWeight: 600, fontSize: '15px' }}>
            Delivery Cancelled
          </span>
        </div>
      </div>
    );
  }

  const activeIndex = getDeliveryProgressIndex(deliveryEvent);
  const stepCount = DELIVERY_STATUS_STEPS.length;

  const icons: Record<string, string> = {
    confirmed: '\u2713',
    dasher_confirmed: '\uD83D\uDE97',
    dasher_at_store: '\uD83C\uDFEA',
    picked_up: '\uD83D\uDCE6',
    dasher_near_customer: '\uD83D\uDCCD',
    delivered: '\u2705',
  };

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <div style={{ minWidth: '600px', position: 'relative', padding: '0 0 8px' }}>
        {/* Connecting line (behind circles) */}
        <div
          style={{
            position: 'absolute',
            top: '18px',
            left: `${100 / stepCount / 2}%`,
            right: `${100 / stepCount / 2}%`,
            height: '3px',
            zIndex: 0,
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '9999px',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                borderRadius: '9999px',
                background: '#4ade80',
                width:
                  activeIndex <= 0
                    ? '0%'
                    : `${(activeIndex / (stepCount - 1)) * 100}%`,
                transition: 'width 0.35s ease',
              }}
            />
          </div>
        </div>

        {/* Step nodes + labels */}
        <div
          style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: `repeat(${stepCount}, 1fr)`,
            gap: '8px',
            zIndex: 1,
          }}
        >
          {DELIVERY_STATUS_STEPS.map((step, index) => {
            const complete = activeIndex >= index;
            const isCurrent = activeIndex === index;

            return (
              <div key={step} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    margin: '0 auto',
                    width: '36px',
                    height: '36px',
                    borderRadius: '9999px',
                    background: complete ? '#4ade80' : 'rgba(255,255,255,0.1)',
                    border: `2px solid ${complete ? '#4ade80' : 'rgba(255,255,255,0.25)'}`,
                    boxShadow: isCurrent ? '0 0 0 6px rgba(74, 222, 128, 0.25)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {icons[step] || ''}
                </div>
                <p
                  style={{
                    marginTop: '8px',
                    marginBottom: 0,
                    color: complete ? '#fff' : '#9ca3af',
                    fontSize: '11px',
                    fontWeight: isCurrent ? 700 : 500,
                    lineHeight: 1.3,
                  }}
                >
                  {getDeliveryStatusLabel(step)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
