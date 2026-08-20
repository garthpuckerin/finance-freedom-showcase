/* Finance Freedom — relative-date engine.
 *
 * Everything in the demo is anchored on the REAL "today" at module-eval time,
 * so the register, forecast, and labels always look fresh whenever the app is
 * opened. Each fixture stores a fixed OFFSET (in whole days) from today; the
 * relationships between events (biweekly payroll, monthly rent, etc.) are
 * preserved because the offsets never change — they just slide with the clock.
 *
 * Deterministic: TODAY is computed once, from the system date. No Math.random,
 * no external deps.
 */

const MS_PER_DAY = 86_400_000;

/** Midnight (local) of the supplied date — strips the time component. */
export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** The real "today", frozen at module evaluation. */
export const TODAY = startOfDay(new Date());

/** A Date exactly `n` whole days from TODAY (n may be negative). */
export function daysFromToday(n) {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + n);
  return d;
}

/** 'YYYY-MM-DD' for a Date (local). */
export function iso(date) {
  const d = startOfDay(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Shorthand: ISO string for an offset from today. */
export function isoFromToday(n) {
  return iso(daysFromToday(n));
}

/* ---- The migration anchor ---------------------------------------------- *
 * The original fixtures were frozen on this date. To re-express any legacy
 * ISO date as a today-relative offset:  offsetFromAnchor('2026-05-18') === -11
 * which then becomes daysFromToday(-11).
 */
export const ANCHOR_ISO = '2026-05-29';
const ANCHOR = startOfDay(new Date(ANCHOR_ISO + 'T00:00:00'));

/** Whole-day offset of a legacy ISO date relative to the old 2026-05-29 anchor. */
export function offsetFromAnchor(isoDate) {
  const d = startOfDay(new Date(isoDate + 'T00:00:00'));
  return Math.round((d - ANCHOR) / MS_PER_DAY);
}

/* ---- Display formatters (match the strings the UI used to hardcode) ----- */

/** "Friday, May 29" (weekday + month + day, no year). */
export function fmtLongNoYear(date) {
  return startOfDay(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

/** "Friday, May 29, 2026" (weekday + full date). */
export function fmtLong(date) {
  return startOfDay(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

/** "May 2026" (month + year). */
export function fmtMonthYear(date) {
  return startOfDay(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/** "May 29, 2026" (medium date). */
export function fmtMedium(date) {
  return startOfDay(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** "May 29" (month + day). */
export function fmtMonthDay(date) {
  return startOfDay(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** '2026-05' (year-month) for a Date — used for currentMonth. */
export function fmtYearMonth(date) {
  const d = startOfDay(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Four-digit year. */
export function fmtYear(date) {
  return String(startOfDay(date).getFullYear());
}

/* Convenience: today expressed in each common format. */
export const TODAY_ISO = iso(TODAY);
export const TODAY_LONG = fmtLong(TODAY);
export const TODAY_LONG_NO_YEAR = fmtLongNoYear(TODAY);
export const TODAY_MONTH_YEAR = fmtMonthYear(TODAY);
export const TODAY_YEAR = fmtYear(TODAY);
