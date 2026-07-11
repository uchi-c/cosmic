/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { TrendingUp, Boxes, PieChart, Landmark, Layers, Coins } from 'lucide-react';
import { Product, Order } from '../../types';
import { CountUp } from '../ui/reactbits';

interface AnalyticsChartsProps {
  products: Product[];
  orders: Order[];
  /** Number of trailing days for the revenue trend. */
  days?: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  mens: 'MENS',
  womens: 'WOMENS',
  gym: 'GYM',
  jewelry: 'JEWELRY',
  accessories: 'ACCESS.',
};

// Reserved status palette (good / info / warning / critical) — always shipped
// with a text label + count, never colour alone.
const STATUS_META: { key: Order['order_status']; label: string; color: string }[] = [
  { key: 'completed', label: 'COMPLETED', color: '#39FF14' },
  { key: 'processing', label: 'PROCESSING', color: '#9B6DFF' },
  { key: 'pending', label: 'PENDING', color: '#B68D40' },
  { key: 'cancelled', label: 'CANCELLED', color: '#FF4444' },
];

const money = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  products,
  orders,
  days = 14,
}) => {
  // ---- Finance: revenue per day over the trailing window ----------------
  const revenue = useMemo(() => {
    const buckets: { label: string; iso: string; value: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      buckets.push({
        iso: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: 0,
      });
    }
    const index = new Map(buckets.map((b, i) => [b.iso, i]));
    for (const o of orders) {
      const settled = o.payment_status === 'paid' || o.order_status === 'completed';
      if (!settled) continue;
      const key = new Date(o.created_at).toISOString().slice(0, 10);
      const i = index.get(key);
      if (i !== undefined) buckets[i].value += o.total || 0;
    }
    return buckets;
  }, [orders, days]);

  const revTotal = revenue.reduce((a, b) => a + b.value, 0);
  const revMax = Math.max(...revenue.map((b) => b.value), 1);
  const paidOrders = orders.filter(
    (o) => o.payment_status === 'paid' || o.order_status === 'completed'
  );
  const avgOrder = paidOrders.length ? revTotal / paidOrders.length : 0;

  // ---- Inventory: units + retail value by category ----------------------
  const stockByCat = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      if (!p.is_active) continue;
      map.set(p.category, (map.get(p.category) || 0) + Math.max(0, p.stock));
    }
    return Array.from(map.entries())
      .map(([category, units]) => ({ category, units }))
      .sort((a, b) => b.units - a.units);
  }, [products]);

  const stockMax = Math.max(...stockByCat.map((s) => s.units), 1);
  const totalUnits = stockByCat.reduce((a, b) => a + b.units, 0);
  const inventoryValue = useMemo(
    () =>
      products
        .filter((p) => p.is_active)
        .reduce((acc, p) => acc + (p.sale_price ?? p.price) * Math.max(0, p.stock), 0),
    [products]
  );

  // ---- Orders: status distribution --------------------------------------
  const statusCounts = useMemo(() => {
    const counts = STATUS_META.map((s) => ({
      ...s,
      count: orders.filter((o) => o.order_status === s.key).length,
    }));
    const total = counts.reduce((a, b) => a + b.count, 0) || 1;
    return { counts, total };
  }, [orders]);

  // ---- Revenue SVG geometry ---------------------------------------------
  const W = 720;
  const H = 190;
  const PAD = 6;
  const n = revenue.length;
  const xFor = (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * W);
  const yFor = (v: number) => PAD + (1 - v / revMax) * (H - PAD * 2);
  const linePath = revenue
    .map((b, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(1)} ${yFor(b.value).toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L ${W} ${H} L 0 ${H} Z`;

  const [hover, setHover] = useState<number | null>(null);

  const onTrendMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    setHover(Math.round(ratio * (n - 1)));
  };

  const panel =
    'bg-retro-surface border-2 border-retro-border p-5 flex flex-col';
  const eyebrow =
    'text-[10px] font-body-mono text-retro-gold tracking-[0.25em] font-bold uppercase flex items-center gap-2';

  return (
    <div className="space-y-6">
      {/* Section header with a rotating telemetry accent */}
      <div className="flex items-center gap-3">
        <span className="relative w-4 h-4 shrink-0">
          <span className="absolute inset-0 border-2 border-accent-purple/70 border-t-transparent border-l-transparent rounded-full animate-spin3d" />
        </span>
        <h3 className="text-sm font-retro-heading uppercase text-accent-purple tracking-widest">
          :: ANALYTICS TELEMETRY
        </h3>
      </div>

      {/* Finance KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Landmark, label: `REVENUE / ${days}D`, value: revTotal, prefix: '$', color: 'text-retro-green' },
          { icon: Coins, label: 'AVG ORDER VALUE', value: avgOrder, prefix: '$', color: 'text-accent-purple' },
          { icon: Layers, label: 'UNITS IN STOCK', value: totalUnits, prefix: '', color: 'text-cream' },
          { icon: Boxes, label: 'INVENTORY VALUE', value: inventoryValue, prefix: '$', color: 'text-retro-gold' },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-retro-surface border-2 border-retro-border p-4 flex flex-col gap-1.5">
              <span className="text-[9px] text-cream-muted uppercase tracking-widest font-bold font-body-mono flex items-center gap-1.5">
                <Icon size={12} className="text-retro-gold" />
                {k.label}
              </span>
              <span className={`font-retro-heading text-lg md:text-xl leading-none py-0.5 ${k.color}`}>
                <CountUp value={k.value} prefix={k.prefix} decimals={k.prefix === '$' ? 2 : 0} separator />
              </span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* --- Revenue trend (finance) --- */}
        <div className={`${panel} lg:col-span-2`}>
          <div className="flex items-end justify-between mb-4">
            <span className={eyebrow}>
              <TrendingUp size={13} className="text-retro-green" /> REVENUE TREND // {days} SOLAR DAYS
            </span>
            <span className="font-retro-mono text-retro-green text-lg leading-none">${money(revTotal)}</span>
          </div>

          <div
            className="relative w-full"
            onMouseMove={onTrendMove}
            onMouseLeave={() => setHover(null)}
          >
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-44 overflow-visible">
              <defs>
                <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9B6DFF" stopOpacity="0.42" />
                  <stop offset="100%" stopColor="#9B6DFF" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {/* recessive baseline */}
              <line x1="0" y1={H} x2={W} y2={H} stroke="#2A1F45" strokeWidth="1" />
              <path d={areaPath} fill="url(#revFill)" />
              <path d={linePath} fill="none" stroke="#9B6DFF" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
              {hover !== null && (
                <>
                  <line
                    x1={xFor(hover)} y1="0" x2={xFor(hover)} y2={H}
                    stroke="#9B6DFF" strokeWidth="1" strokeDasharray="3 3"
                    vectorEffect="non-scaling-stroke" opacity="0.6"
                  />
                  <circle cx={xFor(hover)} cy={yFor(revenue[hover].value)} r="4.5" fill="#9B6DFF" stroke="#0A0812" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                </>
              )}
            </svg>

            {/* hover tooltip */}
            {hover !== null && (
              <div
                className="pointer-events-none absolute -top-2 z-20 -translate-x-1/2 -translate-y-full bg-space-black border border-accent-purple px-2.5 py-1.5 whitespace-nowrap shadow-[0_0_12px_rgba(155,109,255,0.4)]"
                style={{ left: `${n <= 1 ? 0 : (hover / (n - 1)) * 100}%` }}
              >
                <div className="text-[9px] text-cream-muted font-body-mono uppercase tracking-wider">{revenue[hover].label}</div>
                <div className="text-sm font-retro-mono text-accent-purple font-bold leading-none">${money(revenue[hover].value)}</div>
              </div>
            )}
          </div>

          {/* sparse day ticks */}
          <div className="flex justify-between mt-2 text-[8px] font-body-mono text-cream-muted uppercase tracking-wider">
            <span>{revenue[0]?.label}</span>
            <span>{revenue[Math.floor(n / 2)]?.label}</span>
            <span>{revenue[n - 1]?.label}</span>
          </div>
        </div>

        {/* --- Order status distribution --- */}
        <div className={panel}>
          <span className={`${eyebrow} mb-4`}>
            <PieChart size={13} className="text-accent-purple" /> ORDER STATUS SPLIT
          </span>

          {/* stacked status bar */}
          <div className="flex h-3 w-full gap-[2px] mb-5 bg-space-black">
            {statusCounts.counts.map((s) =>
              s.count > 0 ? (
                <div
                  key={s.key}
                  title={`${s.label}: ${s.count}`}
                  style={{ width: `${(s.count / statusCounts.total) * 100}%`, backgroundColor: s.color }}
                  className="h-full"
                />
              ) : null
            )}
          </div>

          {/* legend + counts (identity is never colour-alone) */}
          <ul className="space-y-2.5 mt-auto">
            {statusCounts.counts.map((s) => (
              <li key={s.key} className="flex items-center justify-between text-[11px] font-body-mono uppercase">
                <span className="flex items-center gap-2 text-cream/80">
                  <span className="w-2.5 h-2.5 border border-black/40" style={{ backgroundColor: s.color }} />
                  {s.label}
                </span>
                <span className="text-cream font-bold tabular-nums">
                  {s.count}
                  <span className="text-cream-muted font-normal ml-1">
                    ({Math.round((s.count / statusCounts.total) * 100)}%)
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* --- Inventory by category (stock) --- */}
      <div className={panel}>
        <div className="flex items-end justify-between mb-5">
          <span className={eyebrow}>
            <Boxes size={13} className="text-retro-gold" /> INVENTORY BY DEPARTMENT
          </span>
          <span className="font-retro-mono text-retro-gold text-lg leading-none">{totalUnits} UNITS</span>
        </div>

        {stockByCat.length > 0 ? (
          <div className="space-y-3">
            {stockByCat.map((s) => (
              <div key={s.category} className="flex items-center gap-3 group">
                <span className="w-16 shrink-0 text-[10px] font-body-mono text-cream-muted uppercase tracking-wider text-right">
                  {CATEGORY_LABELS[s.category] || s.category}
                </span>
                <div className="flex-1 h-6 bg-space-black border border-retro-border/60 relative overflow-hidden">
                  <div
                    className="h-full bg-retro-gold/80 group-hover:bg-retro-gold transition-all rounded-r-[3px]"
                    style={{ width: `${(s.units / stockMax) * 100}%` }}
                    title={`${s.category}: ${s.units} units`}
                  />
                  <span className="absolute inset-y-0 right-2 flex items-center text-[10px] font-retro-mono font-bold text-cream">
                    {s.units}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-cream-muted font-body-mono text-xs uppercase">
            NO ACTIVE INVENTORY TO CHART.
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsCharts;
