import { PICKUP_STATUS_STEPS, getPickupProgressIndex, getPickupStatusLabel } from '../lib/orders/pickupStatus';

interface HorizontalOrderProgressProps {
  status: string;
}

export default function HorizontalOrderProgress({ status }: HorizontalOrderProgressProps) {
  const activeIndex = getPickupProgressIndex(status);

  return (
    <div style={{ width: '100%', overflowX: 'auto', paddingBottom: '4px' }}>
      <div style={{ minWidth: '650px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${PICKUP_STATUS_STEPS.length}, 1fr)`, gap: '8px' }}>
          {PICKUP_STATUS_STEPS.map((step, index) => {
            const complete = activeIndex >= index;
            const isCurrent = activeIndex === index;

            return (
              <div key={step} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    margin: '0 auto',
                    width: '20px',
                    height: '20px',
                    borderRadius: '9999px',
                    background: complete ? '#4ade80' : 'rgba(255,255,255,0.15)',
                    border: `2px solid ${complete ? '#4ade80' : 'rgba(255,255,255,0.3)'}`,
                    boxShadow: isCurrent ? '0 0 0 5px rgba(74, 222, 128, 0.25)' : 'none',
                  }}
                />
                <p
                  style={{
                    marginTop: '10px',
                    marginBottom: 0,
                    color: complete ? '#fff' : '#9ca3af',
                    fontSize: '12px',
                    fontWeight: isCurrent ? 700 : 500,
                    lineHeight: 1.35,
                  }}
                >
                  {getPickupStatusLabel(step)}
                </p>
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: '-42px',
            padding: '0 38px',
            position: 'relative',
            zIndex: 0,
          }}
        >
          <div style={{ position: 'relative', height: '3px', background: 'rgba(255,255,255,0.15)', borderRadius: '9999px' }}>
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
                    : `${(activeIndex / (PICKUP_STATUS_STEPS.length - 1)) * 100}%`,
                transition: 'width 0.35s ease',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

