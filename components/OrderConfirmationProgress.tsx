import { PICKUP_STATUS_STEPS, getPickupProgressIndex, getPickupStatusLabel } from '../lib/orders/pickupStatus';
import { DELIVERY_STATUS_STEPS, getDeliveryProgressIndex, getDeliveryStatusLabel } from '../lib/orders/deliveryStatus';

interface OrderConfirmationProgressProps {
  orderType: 'pickup' | 'delivery';
  status: string;
  deliveryLastEvent?: string | null;
}

export default function OrderConfirmationProgress({
  orderType,
  status,
  deliveryLastEvent,
}: OrderConfirmationProgressProps) {
  const isDelivery = orderType === 'delivery';
  const isCancelled = status === 'cancelled';

  const steps = isDelivery ? [...DELIVERY_STATUS_STEPS] : [...PICKUP_STATUS_STEPS];
  const activeIndex = isDelivery
    ? getDeliveryProgressIndex(deliveryLastEvent)
    : getPickupProgressIndex(status);

  const getLabel = (step: string) =>
    isDelivery ? getDeliveryStatusLabel(step) : getPickupStatusLabel(step);

  const icons: Record<string, string> = {
    confirmed: '✓',
    preparing: '🍣',
    ready: '✅',
    picked_up: isDelivery ? '📦' : '🎉',
    dasher_confirmed: '🚗',
    dasher_at_store: '🏪',
    dasher_near_customer: '📍',
    delivered: '🎉',
  };

  if (isCancelled) {
    return (
      <div style={{ width: '100%', padding: '24px 0' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '16px 24px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
          }}
        >
          <span style={{ fontSize: '24px' }}>✕</span>
          <span style={{ color: '#f87171', fontWeight: 700, fontSize: '16px' }}>
            Order Cancelled
          </span>
        </div>
      </div>
    );
  }

  const fillPercent =
    activeIndex <= 0 ? 0 : (activeIndex / (steps.length - 1)) * 100;

  return (
    <div style={{ width: '100%', padding: '8px 0 0' }}>
      <div style={{ position: 'relative', padding: '0 0 12px' }}>
        {/* Background track */}
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: `${100 / steps.length / 2}%`,
            right: `${100 / steps.length / 2}%`,
            height: '4px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            zIndex: 0,
          }}
        />

        {/* Filled track */}
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: `${100 / steps.length / 2}%`,
            width: `calc(${fillPercent}% * ${(steps.length - 1) / steps.length})`,
            height: '4px',
            background: 'linear-gradient(90deg, #fc3678, #f1d00f)',
            borderRadius: '4px',
            zIndex: 1,
            transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />

        {/* Step nodes */}
        <div
          style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: `repeat(${steps.length}, 1fr)`,
            zIndex: 2,
          }}
        >
          {steps.map((step, index) => {
            const isComplete = activeIndex > index;
            const isCurrent = activeIndex === index;
            const isUpcoming = activeIndex < index;

            let circleBackground = 'rgba(255, 255, 255, 0.08)';
            let circleBorder = '2px solid rgba(255, 255, 255, 0.2)';
            let shadow = 'none';

            if (isComplete) {
              circleBackground = 'linear-gradient(135deg, #fc3678, #f1d00f)';
              circleBorder = '2px solid transparent';
            } else if (isCurrent) {
              circleBackground = 'linear-gradient(135deg, #fc3678, #f1d00f)';
              circleBorder = '2px solid transparent';
              shadow = '0 0 0 6px rgba(252, 54, 120, 0.2), 0 0 20px rgba(252, 54, 120, 0.15)';
            }

            return (
              <div
                key={step}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: circleBackground,
                    border: circleBorder,
                    boxShadow: shadow,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    transition: 'all 0.4s ease',
                    animation: isCurrent ? 'confirmPulse 2s ease-in-out infinite' : 'none',
                    opacity: isUpcoming ? 0.4 : 1,
                  }}
                >
                  {isComplete ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <span style={{ filter: isUpcoming ? 'grayscale(1)' : 'none' }}>
                      {icons[step] || '•'}
                    </span>
                  )}
                </div>

                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: isCurrent ? 700 : 500,
                    color: isUpcoming ? '#666' : isCurrent ? '#fff' : '#bbb',
                    textAlign: 'center',
                    lineHeight: 1.3,
                    maxWidth: '90px',
                    transition: 'color 0.3s ease',
                  }}
                >
                  {getLabel(step)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes confirmPulse {
          0%, 100% { box-shadow: 0 0 0 6px rgba(252, 54, 120, 0.2), 0 0 20px rgba(252, 54, 120, 0.15); }
          50% { box-shadow: 0 0 0 10px rgba(252, 54, 120, 0.1), 0 0 30px rgba(252, 54, 120, 0.2); }
        }
      `}</style>
    </div>
  );
}
