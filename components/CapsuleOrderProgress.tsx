import { PICKUP_STATUS_STEPS, getPickupProgressIndex, getPickupStatusLabel } from '../lib/orders/pickupStatus';
import { DELIVERY_STATUS_STEPS, getDeliveryProgressIndex, getDeliveryStatusLabel } from '../lib/orders/deliveryStatus';

interface CapsuleOrderProgressProps {
  orderType: 'pickup' | 'delivery';
  status: string;
  deliveryLastEvent?: string | null;
}

// One capsule per order state; every capsule up to and including the
// current state is filled, and the current one pulses.
export default function CapsuleOrderProgress({
  orderType,
  status,
  deliveryLastEvent,
}: CapsuleOrderProgressProps) {
  const isDelivery = orderType === 'delivery';
  const steps: readonly string[] = isDelivery ? DELIVERY_STATUS_STEPS : PICKUP_STATUS_STEPS;
  const activeIndex = isDelivery
    ? getDeliveryProgressIndex(deliveryLastEvent)
    : getPickupProgressIndex(status);

  const getLabel = (step: string) =>
    isDelivery ? getDeliveryStatusLabel(step) : getPickupStatusLabel(step);

  return (
    <div style={{ width: '100%' }}>
      {activeIndex >= 0 && (
        <p style={{ color: '#fff', fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>
          {getLabel(steps[activeIndex])}
        </p>
      )}

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={steps.length}
        aria-valuenow={activeIndex + 1}
        aria-valuetext={activeIndex >= 0 ? getLabel(steps[activeIndex]) : undefined}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${steps.length}, 1fr)`,
          gap: '6px',
        }}
      >
        {steps.map((step, index) => {
          const isFilled = index <= activeIndex;
          const isCurrent = index === activeIndex;

          return (
            <div key={step} style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
              <div
                className={isCurrent ? 'capsule-current' : undefined}
                style={{
                  height: '12px',
                  borderRadius: '9999px',
                  background: isFilled
                    ? '#fc3678'
                    : 'rgba(255, 255, 255, 0.1)',
                  border: isFilled ? 'none' : '1px solid rgba(255, 255, 255, 0.15)',
                  transition: 'background 0.4s ease',
                }}
              />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: isCurrent ? 700 : 500,
                  color: isCurrent ? '#fff' : isFilled ? '#bbb' : '#666',
                  textAlign: 'center',
                  lineHeight: 1.3,
                }}
              >
                {getLabel(step)}
              </span>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .capsule-current {
          animation: capsulePulse 2s ease-in-out infinite;
        }
        @keyframes capsulePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(252, 54, 120, 0.35); }
          50% { box-shadow: 0 0 0 4px rgba(252, 54, 120, 0.15); }
        }
        @media (prefers-reduced-motion: reduce) {
          .capsule-current { animation: none; }
        }
      `}</style>
    </div>
  );
}
