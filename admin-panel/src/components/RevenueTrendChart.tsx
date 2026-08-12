import { useMemo, useState } from 'react';
import type { RevenuePoint } from '../types/analytics';
import { useTheme } from '../context/ThemeContext';

const WIDTH = 720;
const HEIGHT = 260;
const PAD = { top: 16, right: 16, bottom: 32, left: 64 };
const PRIMARY = '#660033';

const LIGHT = {
  cardBg: '#FFFFFF',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  gridline: '#F3F4F6',
  baseline: '#D1D5DB',
  labelInk: '#111827',
};
const DARK = {
  cardBg: '#141414',
  textSecondary: 'rgba(255,255,255,0.65)',
  textMuted: 'rgba(255,255,255,0.45)',
  gridline: 'rgba(255,255,255,0.08)',
  baseline: 'rgba(255,255,255,0.2)',
  labelInk: 'rgba(255,255,255,0.85)',
};

function niceMax(value: number): number {
  if (value <= 0) return 10;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  let step: number;
  if (normalized <= 1) step = 1;
  else if (normalized <= 2) step = 2;
  else if (normalized <= 5) step = 5;
  else step = 10;
  return step * magnitude;
}

function formatCurrency(v: number): string {
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDateShort(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface Props {
  data: RevenuePoint[];
}

export default function RevenueTrendChart({ data }: Props) {
  const { isDark } = useTheme();
  const c = isDark ? DARK : LIGHT;
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const { points, yTicks, xTickIndices, plotW, plotH, maxRevenue } = useMemo(() => {
    const plotW = WIDTH - PAD.left - PAD.right;
    const plotH = HEIGHT - PAD.top - PAD.bottom;
    const maxRevenue = niceMax(Math.max(...data.map((d) => d.revenue), 1));
    const n = data.length;

    const points = data.map((d, i) => {
      const x = PAD.left + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
      const y = PAD.top + plotH - (d.revenue / maxRevenue) * plotH;
      return { x, y, ...d };
    });

    const tickCount = 4;
    const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => (maxRevenue / tickCount) * i);

    // Spread ~6 x-axis labels across the range regardless of how many days.
    const desiredLabels = Math.min(6, n);
    const stride = Math.max(1, Math.round((n - 1) / Math.max(1, desiredLabels - 1)));
    const xTickIndices: number[] = [];
    for (let i = 0; i < n; i += stride) xTickIndices.push(i);
    if (xTickIndices[xTickIndices.length - 1] !== n - 1) xTickIndices.push(n - 1);

    return { points, yTicks, xTickIndices, plotW, plotH, maxRevenue };
  }, [data]);

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? PAD.left} ${PAD.top + plotH} L ${points[0]?.x ?? PAD.left} ${PAD.top + plotH} Z`;

  function handlePointerMove(e: React.PointerEvent<SVGRectElement>) {
    const svg = (e.target as SVGRectElement).ownerSVGElement;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = WIDTH / rect.width;
    const localX = (e.clientX - rect.left) * scaleX;
    let nearest = 0;
    let nearestDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - localX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;
  const last = points[points.length - 1];

  return (
    <div style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{ width: '100%', height: 'auto', display: 'block', fontFamily: 'Inter, sans-serif' }}
        role="img"
        aria-label="Revenue trend over time"
      >
        {/* gridlines */}
        {yTicks.map((t, i) => {
          const y = PAD.top + plotH - (t / maxRevenue) * plotH;
          return (
            <g key={i}>
              <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y} y2={y} stroke={c.gridline} strokeWidth={1} />
              <text x={PAD.left - 10} y={y + 4} textAnchor="end" fontSize={11} fill={c.textMuted}>
                {formatCurrency(t)}
              </text>
            </g>
          );
        })}

        {/* baseline */}
        <line
          x1={PAD.left}
          x2={WIDTH - PAD.right}
          y1={PAD.top + plotH}
          y2={PAD.top + plotH}
          stroke={c.baseline}
          strokeWidth={1}
        />

        {/* x-axis labels */}
        {xTickIndices.map((i) => (
          <text key={i} x={points[i].x} y={HEIGHT - 8} textAnchor="middle" fontSize={11} fill={c.textMuted}>
            {formatDateShort(points[i].date)}
          </text>
        ))}

        {/* area wash */}
        {points.length > 1 && <path d={areaPath} fill={PRIMARY} opacity={0.1} />}

        {/* line */}
        {points.length > 1 && (
          <path d={linePath} fill="none" stroke={PRIMARY} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        )}

        {/* end marker + direct label */}
        {last && (
          <>
            <circle cx={last.x} cy={last.y} r={5} fill={PRIMARY} stroke={c.cardBg} strokeWidth={2} />
            <text
              x={last.x}
              y={Math.max(PAD.top + 10, last.y - 12)}
              textAnchor="end"
              fontSize={12}
              fontWeight={600}
              fill={c.labelInk}
            >
              {formatCurrency(last.revenue)}
            </text>
          </>
        )}

        {/* crosshair + hover point */}
        {hovered && (
          <>
            <line
              x1={hovered.x}
              x2={hovered.x}
              y1={PAD.top}
              y2={PAD.top + plotH}
              stroke={c.textSecondary}
              strokeWidth={1}
              opacity={0.5}
            />
            <circle cx={hovered.x} cy={hovered.y} r={5} fill={PRIMARY} stroke={c.cardBg} strokeWidth={2} />
          </>
        )}

        {/* hit layer */}
        <rect
          x={PAD.left}
          y={PAD.top}
          width={plotW}
          height={plotH}
          fill="transparent"
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHoverIndex(null)}
        />
      </svg>

      {hovered && (
        <div
          style={{
            position: 'absolute',
            left: `${(hovered.x / WIDTH) * 100}%`,
            top: 4,
            transform: hovered.x > WIDTH * 0.7 ? 'translateX(-100%)' : 'translateX(8px)',
            background: '#111827',
            color: '#fff',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 12,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          <div style={{ color: '#D1D5DB', marginBottom: 2 }}>
            {new Date(`${hovered.date}T00:00:00`).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </div>
          <div style={{ fontWeight: 700 }}>{formatCurrency(hovered.revenue)}</div>
          <div style={{ color: '#D1D5DB' }}>{hovered.orders} order{hovered.orders === 1 ? '' : 's'}</div>
        </div>
      )}
    </div>
  );
}
