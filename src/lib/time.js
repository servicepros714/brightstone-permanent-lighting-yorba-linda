import { SEASON, LEAD_HOURS, TIME_WINDOWS } from '../config/site.js';

/* All scheduling is done in Pacific time (America/Los_Angeles), whatever the visitor's own time zone. */
export const TZ = 'America/Los_Angeles';

const partsFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});

/** Pacific wall-clock parts for an epoch (ms). */
export function pacificParts(ms = Date.now()) {
  const o = {};
  for (const p of partsFmt.formatToParts(new Date(ms))) o[p.type] = p.value;
  return { y: +o.year, m: +o.month, d: +o.day, h: +o.hour % 24, min: +o.minute, s: +o.second };
}

/** Epoch (ms) of a Pacific wall-clock time. Handles PST/PDT. */
export function pacificToEpoch(y, m, d, h = 0, min = 0) {
  const guess = Date.UTC(y, m - 1, d, h, min);
  let off = offsetAt(guess);
  let ms = guess - off;
  const off2 = offsetAt(ms);
  if (off2 !== off) ms = guess - off2;
  return ms;
}
function offsetAt(ms) {
  const p = pacificParts(ms);
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.min, p.s) - Math.floor(ms / 1000) * 1000;
}

export const pad = (n) => String(n).padStart(2, '0');
export const iso = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
export function parseIso(s) {
  const [y, m, d] = s.split('-').map(Number);
  return { y, m, d };
}
/** Adds days to an ISO date (calendar math in UTC so DST never shifts it). */
export function addDays(s, n) {
  const { y, m, d } = parseIso(s);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return iso(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}
export function weekday(s) {
  const { y, m, d } = parseIso(s);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function todayPacific() {
  const p = pacificParts();
  return iso(p.y, p.m, p.d);
}

/** The season that is open now (or the next one once this year's has ended). */
export function currentSeason(now = Date.now()) {
  const p = pacificParts(now);
  let year = p.y;
  const end = iso(year, SEASON.end.month, SEASON.end.day);
  if (iso(p.y, p.m, p.d) > end) year += 1;
  return {
    year,
    start: iso(year, SEASON.start.month, SEASON.start.day),
    end: iso(year, SEASON.end.month, SEASON.end.day),
  };
}

/** Every date in the season, inclusive. */
export function seasonDates(season = currentSeason()) {
  const out = [];
  for (let s = season.start; s <= season.end; s = addDays(s, 1)) out.push(s);
  return out;
}

/** Earliest bookable moment: now + 48 hours (California time). */
export const earliestMs = (now = Date.now()) => now + LEAD_HOURS * 3600 * 1000;

/** True when the window's start is at least 48h away and the date is inside the season. */
export function windowOpen(date, win, now = Date.now()) {
  const season = currentSeason(now);
  if (date < season.start || date > season.end) return false;
  const { y, m, d } = parseIso(date);
  return pacificToEpoch(y, m, d, win.start) >= earliestMs(now);
}

/** True when at least one window that day passes the lead-time + season rules. */
export function dateOpen(date, now = Date.now()) {
  return TIME_WINDOWS.some((w) => windowOpen(date, w, now));
}

/** First season date with an open window that isn't in `full`. */
export function earliestOpenDate(full = [], now = Date.now()) {
  const fullSet = new Set(full);
  return seasonDates(currentSeason(now)).find((d) => dateOpen(d, now) && !fullSet.has(d)) || null;
}

const longFmt = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
const shortFmt = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
const monFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const toUtc = (s) => { const { y, m, d } = parseIso(s); return new Date(Date.UTC(y, m - 1, d)); };
export const fmtLong = (s) => (s ? longFmt.format(toUtc(s)) : '');
export const fmtShort = (s) => (s ? shortFmt.format(toUtc(s)) : '');
export const fmtMonDay = (s) => (s ? monFmt.format(toUtc(s)) : '');
