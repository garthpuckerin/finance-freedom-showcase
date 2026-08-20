/* Finance Freedom — chart primitives (Ledger system) */
import React from 'react';
import { AppData, fmt } from './data.js';
const { useState: useChS, useRef: useChR, useEffect: useChE, useLayoutEffect } = React;

export function useMeasure() {
  const ref = useChR(null);
  const [w, setW] = useChS(640);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((entries) => {
      const cw = entries[0].contentRect.width;
      if (cw > 0) setW(cw);
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

export function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || name;
}

/* Honor prefers-reduced-motion — when set, callers drop CSS transitions. */
export function useReducedMotion() {
  const [reduced, setReduced] = useChS(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  useChE(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = (e) => setReduced(e.matches);
    mq.addEventListener ? mq.addEventListener('change', on) : mq.addListener(on);
    return () => { mq.removeEventListener ? mq.removeEventListener('change', on) : mq.removeListener(on); };
  }, []);
  return reduced;
}

/* ---------- Income vs Expense trend (bars + line) ---------- */
export function AreaTrend({ data, height = 220 }) {
  const [ref, w] = useMeasure();
  const [hover, setHover] = useChS(null);
  const padL = 48, padR = 12, padT = 14, padB = 26;
  const iw = Math.max(10, w - padL - padR), ih = height - padT - padB;
  const max = Math.max(...data.map(d => Math.max(d.income, d.expense))) * 1.1;
  const x = (i) => padL + (iw / (data.length - 1)) * i;
  const y = (v) => padT + ih - (v / max) * ih;
  const line = (key) => data.map((d, i) => `${x(i)},${y(d[key])}`).join(' ');
  const area = (key) => `${line(key)} ${x(data.length - 1)},${padT + ih} ${x(0)},${padT + ih}`;
  const gridYs = [0, 0.25, 0.5, 0.75, 1].map(f => padT + ih - f * ih);

  function onMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const i = Math.round(((mx - padL) / iw) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  }
  const hd = hover != null ? data[hover] : null;
  const tipW = 116;

  return (
    <div ref={ref} style={{ width: '100%', position: 'relative' }}>
      <svg width={w} height={height} style={{ display: 'block' }} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="trendInc" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--pos)" stopOpacity="0.18" /><stop offset="100%" stopColor="var(--pos)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {gridYs.map((gy, i) => <line key={i} x1={padL} y1={gy} x2={w - padR} y2={gy} stroke="var(--line)" strokeWidth="1" />)}
        {[0, 0.5, 1].map((f, i) => <text key={i} x={padL - 8} y={padT + ih - f * ih + 3} textAnchor="end" fontSize="9" fontFamily="var(--font-num)" fill="var(--text-faint)">${Math.round(max * f / 1000)}k</text>)}
        <polygon points={area('income')} fill="url(#trendInc)" />
        <polyline points={line('income')} fill="none" stroke="var(--pos)" strokeWidth="2.5" strokeLinejoin="round" />
        <polyline points={line('expense')} fill="none" stroke="var(--neg)" strokeWidth="2.5" strokeLinejoin="round" strokeDasharray="0" />
        {hd && <line x1={x(hover)} y1={padT} x2={x(hover)} y2={padT + ih} stroke="var(--line-strong)" strokeWidth="1" />}
        {data.map((d, i) => {
          const on = i === hover;
          return <g key={i}>
            <circle cx={x(i)} cy={y(d.income)} r={on ? 4 : 3} fill="var(--surface)" stroke="var(--pos)" strokeWidth={on ? 2.5 : 2} />
            {on && <circle cx={x(i)} cy={y(d.expense)} r="4" fill="var(--surface)" stroke="var(--neg)" strokeWidth="2.5" />}
            <text x={x(i)} y={height - 8} textAnchor="middle" fontSize="10" fill={on ? 'var(--text)' : 'var(--text-3)'} fontWeight={on ? 600 : 400} fontFamily="var(--font-ui)">{d.m}</text>
          </g>;
        })}
      </svg>
      {hd && (
        <div style={{
          position: 'absolute', top: 6, left: Math.min(Math.max(x(hover) - tipW / 2, 4), Math.max(4, w - tipW - 4)),
          background: 'var(--text)', color: 'var(--surface)', borderRadius: 8, padding: '7px 10px', pointerEvents: 'none',
          fontSize: 11, boxShadow: 'var(--shadow)', width: tipW, boxSizing: 'border-box',
        }}>
          <div style={{ opacity: 0.7, fontSize: 10, marginBottom: 3 }}>{hd.m}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><span style={{ opacity: 0.85 }}>Income</span><span style={{ fontFamily: 'var(--font-num)', fontWeight: 700 }}>{fmt(hd.income)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 1 }}><span style={{ opacity: 0.85 }}>Expense</span><span style={{ fontFamily: 'var(--font-num)', fontWeight: 700 }}>{fmt(hd.expense)}</span></div>
        </div>
      )}
    </div>
  );
}

/* ---------- Donut ---------- */
export function Donut({ segments, size = 168, inner = 0.62 }) {
  const [hover, setHover] = useChS(null);
  const reduced = useReducedMotion();
  const r = size / 2, ir = r * inner, cx = r, cy = r;
  const total = segments.reduce((s, d) => s + d.value, 0);
  // hovered arc bulges outward slightly; build paths at a per-arc outer radius
  let a0 = -Math.PI / 2;
  const arcs = segments.map((d, i) => {
    const a1 = a0 + (d.value / total) * Math.PI * 2;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const ro = hover === i ? r : r - 1; // hovered keeps full radius; others recede a hair
    const p = (a, rad) => [cx + rad * Math.cos(a), cy + rad * Math.sin(a)];
    const [x0, y0] = p(a0, ro), [x1, y1] = p(a1, ro), [x2, y2] = p(a1, ir), [x3, y3] = p(a0, ir);
    const path = `M${x0},${y0} A${ro},${ro} 0 ${large} 1 ${x1},${y1} L${x2},${y2} A${ir},${ir} 0 ${large} 0 ${x3},${y3} Z`;
    a0 = a1;
    return { path, color: d.color, seg: d };
  });
  const hs = hover != null ? segments[hover] : null;
  const hsPct = hs ? (hs.pct != null ? hs.pct : Math.round((hs.value / total) * 100)) : null;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ display: 'block' }}>
        {arcs.map((a, i) => (
          <path key={i} d={a.path} fill={a.color}
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
            style={{ cursor: 'pointer', opacity: hover == null || hover === i ? 1 : 0.45, transition: reduced ? 'none' : 'opacity .14s ease, d .14s ease' }} />
        ))}
      </svg>
      {hs && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', textAlign: 'center', padding: '0 12%' }}>
          {hs.label != null && <div style={{ fontSize: Math.max(9, size * 0.066), color: 'var(--text-3)', fontWeight: 500, lineHeight: 1.15, marginBottom: 2 }}>{hs.label}</div>}
          <div className="num" style={{ fontSize: Math.max(13, size * 0.11), fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{hsPct}%</div>
          <div className="num" style={{ fontSize: Math.max(10, size * 0.072), fontWeight: 600, color: 'var(--text-2)', lineHeight: 1.2, marginTop: 2 }}>{fmt(hs.value, { maximumFractionDigits: hs.value >= 1000 ? 0 : 2 })}</div>
        </div>
      )}
    </div>
  );
}

/* ---------- Gauge bar ---------- */
export function GaugeBar({ value, max, color, height = 6 }) {
  const [hover, setHover] = useChS(false);
  const reduced = useReducedMotion();
  const pct = Math.min(100, (value / max) * 100);
  const over = value > max;
  const fill = over ? 'var(--neg)' : (color || 'var(--accent)');
  return (
    <div
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      title={`${Math.round(pct)}% of limit`}
      style={{ height, background: 'var(--inset)', borderRadius: 99, overflow: 'hidden', cursor: 'default' }}>
      <div style={{
        width: pct + '%', height: '100%', background: fill, borderRadius: 99,
        filter: hover ? 'brightness(1.12)' : 'none',
        transition: reduced ? 'none' : 'width .3s ease, filter .14s ease',
      }} />
    </div>
  );
}

/* ---------- Bars ---------- */
export function MiniBars({ data, height = 90, color = 'var(--accent)' }) {
  const [hover, setHover] = useChS(null);
  const reduced = useReducedMotion();
  const max = Math.max(...data);
  return (
    <div style={{ position: 'relative', height }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height }}>
        {data.map((v, i) => {
          const on = i === hover;
          return (
            <div key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
              style={{
                flex: 1, height: (v / max * 100) + '%', background: color, minHeight: 2,
                borderRadius: '3px 3px 0 0', cursor: 'pointer',
                opacity: hover == null ? 0.85 : (on ? 1 : 0.4),
                transition: reduced ? 'none' : 'opacity .12s ease',
              }} />
          );
        })}
      </div>
      {hover != null && (
        <div style={{ position: 'absolute', top: -4, left: 0, right: 0, textAlign: 'center', pointerEvents: 'none' }}>
          <span className="num" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', background: 'var(--surface)', border: '1px solid var(--line-2)', borderRadius: 6, padding: '1px 6px', boxShadow: 'var(--shadow-sm)' }}>{data[hover]}</span>
        </div>
      )}
    </div>
  );
}

/* ---------- The Cash-Flow Forecast (signature) ---------- */
/* Shared interactive single-series line — the SAME chart language as the Net
 * Worth screen trend (gradient fill, grid + axis labels, hover dots, dashed
 * hover rule, value readout). Reports and any other screen reuse this so a
 * trend never ships as a dead sparkline. data: [{ label, sub?, value }] in $. */
export function LineTrend({ data, height = 260, color = 'var(--accent)', fmtVal }) {
  const [hover, setHover] = useChS(null);
  const kfmt = fmtVal || (v => (v < 0 ? '−' : '') + '$' + (Math.abs(v) / 1000).toFixed(0) + 'k');
  const W = 880, pl = 58, pr = 16, ptop = 18, pb = 30;
  const iw = W - pl - pr, ih = height - ptop - pb;
  const vals = data.map(d => d.value);
  const max = Math.max(...vals) * 1.04;
  const min = Math.min(...vals) * 0.96;
  const xx = i => pl + iw / (data.length - 1) * i;
  const yy = v => ptop + ih - ((v - min) / (max - min || 1)) * ih;
  const pts = data.map((d, i) => `${xx(i)},${yy(d.value)}`).join(' ');
  const hi = hover != null ? hover : data.length - 1;
  const hp = data[hi];
  const gid = 'ltFill' + color.replace(/[^a-z]/gi, '');
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
        <span className="num" style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)' }}>{fmt(hp.value, { maximumFractionDigits: 0 })}</span>
        <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{hp.label}{hp.sub ? ` ${hp.sub}` : ''}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }} onMouseLeave={() => setHover(null)}>
        <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.16" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
        {[0, 0.25, 0.5, 0.75, 1].map((f, i) => { const v = min + (max - min) * f; return <g key={i}><line x1={pl} y1={ptop + ih - f * ih} x2={W - pr} y2={ptop + ih - f * ih} stroke="var(--line)" /><text x={pl - 8} y={ptop + ih - f * ih + 3} textAnchor="end" fontSize="10" fontFamily="var(--font-num)" fill="var(--text-faint)">{kfmt(v)}</text></g>; })}
        <polygon points={`${pts} ${xx(data.length - 1)},${ptop + ih} ${xx(0)},${ptop + ih}`} fill={`url(#${gid})`} />
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
        {data.map((d, i) => (
          <g key={i}>
            <rect x={xx(i) - iw / data.length / 2} y={ptop} width={iw / data.length} height={ih} fill="transparent" onMouseEnter={() => setHover(i)} />
            <circle cx={xx(i)} cy={yy(d.value)} r={i === hi ? 4.5 : 3} fill="var(--surface)" stroke={color} strokeWidth={i === hi ? 2.5 : 2} />
            <text x={xx(i)} y={height - 9} textAnchor="middle" fontSize="10" fill={i === hi ? 'var(--text)' : 'var(--text-3)'} fontWeight={i === hi ? 600 : 400} fontFamily="var(--font-ui)">{d.label}</text>
          </g>
        ))}
        {hover != null && <line x1={xx(hi)} y1={ptop} x2={xx(hi)} y2={ptop + ih} stroke={color} strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />}
      </svg>
    </div>
  );
}

export function CashFlowChart({ height = 300, compact = false, days = 60 }) {
  // Window the forecast horizon (history always shows; future clips to `days`).
  const pts = AppData.forecast.pts.filter(p => p.t <= days);
  const eventMarks = AppData.forecast.eventMarks.filter(m => m.t <= days);
  const { floor } = AppData.forecast;
  const [ref, w] = useMeasure();
  const [hover, setHover] = useChS(null);
  const padL = 52, padR = 16, padT = 18, padB = compact ? 30 : 52;
  const iw = Math.max(10, w - padL - padR), ih = height - padT - padB;
  const xs = pts.map(p => p.t), bals = pts.map(p => p.bal);
  const minB = Math.min(0, ...bals), maxB = Math.max(...bals) * 1.05;
  const tMin = Math.min(...xs), tMax = Math.max(...xs);
  const x = (t) => padL + ((t - tMin) / (tMax - tMin)) * iw;
  const y = (v) => padT + ih - ((v - minB) / (maxB - minB)) * ih;
  const todayX = x(0);

  const actual = pts.filter(p => p.actual);
  const forecast = pts.filter(p => !p.actual);
  // include the last actual point as the start of the forecast for a continuous line
  const lastActual = actual[actual.length - 1];
  const fcLine = [lastActual, ...forecast];

  const toPts = (arr) => arr.map(p => `${x(p.t)},${y(p.bal)}`).join(' ');
  // Past (actual): solid fill = permanence. Future (forecast): gradient fill =
  // projection. (MS Money's actual-vs-projected visual language.)
  const areaActual = `${toPts(actual)} ${x(lastActual.t)},${y(minB)} ${x(actual[0].t)},${y(minB)}`;
  const lastFc = fcLine[fcLine.length - 1];
  const areaForecast = `${toPts(fcLine)} ${x(lastFc.t)},${y(minB)} ${x(fcLine[0].t)},${y(minB)}`;

  // danger segments: where forecast bal < floor
  const dangerSegs = [];
  for (let i = 1; i < fcLine.length; i++) {
    const a = fcLine[i - 1], b = fcLine[i];
    if (a.bal < floor || b.bal < floor) dangerSegs.push(`${x(a.t)},${y(a.bal)} ${x(b.t)},${y(b.bal)}`);
  }
  const lowPt = forecast.reduce((m, p) => p.bal < m.bal ? p : m, forecast[0]);

  // gridlines (4 levels)
  const levels = 4;
  const gridYs = Array.from({ length: levels + 1 }, (_, i) => minB + (maxB - minB) * (i / levels));

  function onMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const t = tMin + ((mx - padL) / iw) * (tMax - tMin);
    let nearest = pts[0];
    pts.forEach(p => { if (Math.abs(p.t - t) < Math.abs(nearest.t - t)) nearest = p; });
    setHover(nearest);
  }

  return (
    <div ref={ref} style={{ width: '100%', position: 'relative' }}>
      <svg width={w} height={height} style={{ display: 'block' }} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <defs>
          {/* Forecast fill = PROJECTION: a clear gradient, kept lighter than the
              solid history so the two are distinct at the TODAY boundary. Densest
              at the baseline (low amounts — more certain), fading up toward the
              projected line (higher amounts — less certain). */}
          <linearGradient id="cfArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.015" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.11" />
          </linearGradient>
        </defs>
        {gridYs.map((v, i) => <g key={i}>
          <line x1={padL} y1={y(v)} x2={w - padR} y2={y(v)} stroke="var(--line)" strokeWidth="1" />
          <text x={padL - 8} y={y(v) + 3} textAnchor="end" fontSize="9" fontFamily="var(--font-num)" fill="var(--text-faint)">${Math.round(v / 1000)}k</text>
        </g>)}
        {/* floor */}
        <line x1={padL} y1={y(floor)} x2={w - padR} y2={y(floor)} stroke="var(--neg)" strokeWidth="1" strokeDasharray="2 4" opacity="0.7" />
        <text x={padL + 4} y={y(floor) - 5} fontSize="8.5" fontFamily="var(--font-num)" fill="var(--neg)">SAFETY FLOOR · ${floor.toLocaleString()}</text>
        {/* future (forecast) — fading gradient = projection */}
        <polygon points={areaForecast} fill="url(#cfArea)" />
        {/* past (actual) — solid fill at the gradient's peak density = permanence */}
        <polygon points={areaActual} fill="var(--accent)" fillOpacity="0.18" />
        <polyline points={toPts(actual)} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {/* forecast dashed line */}
        <polyline points={toPts(fcLine)} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeDasharray="5 5" strokeLinejoin="round" strokeLinecap="round" opacity="0.85" />
        {/* danger overlay */}
        {dangerSegs.map((s, i) => <polyline key={i} points={s} fill="none" stroke="var(--neg)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />)}
        {/* today divider */}
        <line x1={todayX} y1={padT - 2} x2={todayX} y2={padT + ih} stroke="var(--text-2)" strokeWidth="1" strokeDasharray="3 3" />
        <rect x={todayX - 27} y={padT - 16} width="54" height="15" rx="4" fill="var(--text)" />
        <text x={todayX} y={padT - 5} textAnchor="middle" fontSize="9" fontWeight="700" fontFamily="var(--font-num)" fill="var(--surface)">TODAY</text>
        <circle cx={todayX} cy={y(lastActual.bal)} r="4" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2.5" />
        {/* low point */}
        <circle cx={x(lowPt.t)} cy={y(lowPt.bal)} r="4.5" fill="var(--neg)" />
        {/* event ticks — skip labels that would collide with the previous one */}
        {!compact && (() => {
          let lastLabelX = -999;
          return eventMarks.map((e, i) => {
            const ex = x(e.t);
            const showLabel = ex - lastLabelX > 34;
            if (showLabel) lastLabelX = ex;
            return (
              <g key={i}>
                <text x={ex} y={padT + ih + 18} textAnchor="middle" fontSize="10" fill={e.pos ? 'var(--pos)' : 'var(--neg)'} fontFamily="var(--font-num)">{e.pos ? '▴' : '▾'}</text>
                {showLabel && <text x={ex} y={padT + ih + 32} textAnchor="middle" fontSize="8.5" fill="var(--text-faint)" fontFamily="var(--font-ui)">{e.label}</text>}
              </g>
            );
          });
        })()}
        {/* hover */}
        {hover && <g>
          <line x1={x(hover.t)} y1={padT} x2={x(hover.t)} y2={padT + ih} stroke="var(--line-strong)" strokeWidth="1" />
          <circle cx={x(hover.t)} cy={y(hover.bal)} r="4" fill={hover.bal < floor ? 'var(--neg)' : 'var(--accent)'} stroke="var(--surface)" strokeWidth="2" />
        </g>}
      </svg>
      {hover && (
        <div style={{
          position: 'absolute', top: 6, left: Math.min(Math.max(x(hover.t) - 70, 4), w - 150),
          background: 'var(--text)', color: 'var(--surface)', borderRadius: 8, padding: '7px 10px', pointerEvents: 'none',
          fontSize: 11, boxShadow: 'var(--shadow)', minWidth: 132,
        }}>
          <div style={{ opacity: 0.7, fontSize: 10 }}>{hover.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {hover.actual ? 'Actual' : 'Forecast'}</div>
          <div style={{ fontFamily: 'var(--font-num)', fontWeight: 700, fontSize: 14, marginTop: 2 }}>{fmt(hover.bal)}</div>
        </div>
      )}
    </div>
  );
}
