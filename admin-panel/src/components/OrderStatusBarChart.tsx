import { useState } from 'react';
import type { OrderStatusCount } from '../types/analytics';
import { useTheme } from '../context/ThemeContext';

const STATUS_META: Record<OrderStatusCount['status'], { label: string; color: string }> = {
  pending: { label: 'Pending', color: '#F59E0B' },
  processing: { label: 'Processing', color: '#3B82F6' },
  shipped: { label: 'Shipped', color: '#6366F1' },
  delivered: { label: 'Delivered', color: '#10B981' },
  cancelled: { label: 'Cancelled', color: '#EF4444' },
};

const LIGHT = { rowLabel: '#4B5563', count: '#111827', track: '#F3F4F6' };
const DARK = { rowLabel: 'rgba(255,255,255,0.65)', count: 'rgba(255,255,255,0.85)', track: 'rgba(255,255,255,0.08)' };

const BAR_HEIGHT = 20;
const ROW_HEIGHT = 36;
const LABEL_WIDTH = 90;

interface Props {
  data: OrderStatusCount[];
}

export default function OrderStatusBarChart({ data }: Props) {
  const { isDark } = useTheme();
  const c = isDark ? DARK : LIGHT;
  const [hovered, setHovered] = useState<string | null>(null);
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div>
      {data.map((d) => {
        const meta = STATUS_META[d.status];
        const pct = (d.count / max) * 100;
        const isHovered = hovered === d.status;
        return (
          <div
            key={d.status}
            style={{
              display: 'flex',
              alignItems: 'center',
              height: ROW_HEIGHT,
              cursor: 'default',
            }}
            onPointerEnter={() => setHovered(d.status)}
            onPointerLeave={() => setHovered(null)}
          >
            <div
              style={{
                width: LABEL_WIDTH,
                flexShrink: 0,
                fontSize: 13,
                color: c.rowLabel,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {meta.label}
            </div>
            <div style={{ flex: 1, position: 'relative', height: BAR_HEIGHT }}>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: c.track,
                  borderRadius: 4,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: 0,
                  width: `${Math.max(pct, d.count > 0 ? 3 : 0)}%`,
                  background: meta.color,
                  borderRadius: '0 4px 4px 0',
                  opacity: isHovered ? 0.85 : 1,
                  transition: 'opacity 0.12s ease, width 0.2s ease',
                }}
              />
            </div>
            <div
              style={{
                width: 36,
                flexShrink: 0,
                textAlign: 'right',
                fontSize: 13,
                fontWeight: 600,
                color: c.count,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {d.count}
            </div>
          </div>
        );
      })}
    </div>
  );
}
