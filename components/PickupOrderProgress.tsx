import { PICKUP_STATUS_STEPS, getPickupProgressIndex, getPickupStatusLabel } from '../lib/orders/pickupStatus';

interface PickupOrderProgressProps {
  status: string;
}

export default function PickupOrderProgress({ status }: PickupOrderProgressProps) {
  const activeIndex = getPickupProgressIndex(status);

  return (
    <div style={{ marginTop: '12px' }}>
      <p style={{ color: '#f1d00f', fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>
        Pickup Status
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {PICKUP_STATUS_STEPS.map((step, index) => {
          const complete = activeIndex >= index;
          const isCurrent = activeIndex === index;

          return (
            <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '9999px',
                  background: complete ? '#4ade80' : 'rgba(255,255,255,0.2)',
                  boxShadow: isCurrent ? '0 0 0 4px rgba(74, 222, 128, 0.25)' : 'none',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  color: complete ? '#fff' : '#888',
                  fontSize: '13px',
                  fontWeight: isCurrent ? 700 : 500,
                }}
              >
                {getPickupStatusLabel(step)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

