import { useCallback, useEffect, useRef, useState } from 'react';
import { ADDONS, DEPOSIT, LIGHTING_TYPES, PACKAGES, TIME_WINDOWS, TWO_STORY_PERCENT } from '../config/site.js';
import { createBooking } from './api.js';

const KEY = 'bsl-booking';
export const CONFIRM_KEY = 'bsl-confirmation';
export const PI_KEY = 'bsl-pi';

const blank = () => ({
  ref: 'BSR-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase(),
  type: '',
  packageId: '',
  stories: '',
  addons: [],
  date: '',
  windowId: '',
  name: '',
  phone: '',
  email: '',
  address: '',
});

export function loadBooking() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return { ...blank(), ...JSON.parse(raw) };
  } catch { /* storage blocked */ }
  return blank();
}
function saveBooking(b) {
  try { sessionStorage.setItem(KEY, JSON.stringify(b)); } catch { /* ignore */ }
  window.dispatchEvent(new Event('bsl-booking'));
}
export function clearBooking() {
  try {
    sessionStorage.removeItem(KEY);
    sessionStorage.removeItem(PI_KEY);
  } catch { /* ignore */ }
}

/** Shared booking state (sessionStorage-backed, survives reloads and the Stripe redirect). */
export function useBooking() {
  const [b, setB] = useState(loadBooking);
  const ref = useRef(b);
  ref.current = b;
  useEffect(() => {
    const sync = () => {
      const next = loadBooking();
      if (JSON.stringify(next) !== JSON.stringify(ref.current)) setB(next);
    };
    window.addEventListener('bsl-booking', sync);
    return () => window.removeEventListener('bsl-booking', sync);
  }, []);
  const update = useCallback((patch) => {
    const prev = ref.current;
    const next = { ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) };
    ref.current = next;
    setB(next);
    saveBooking(next);
  }, []);
  return [b, update];
}

/* ───────── lookups ───────── */
export const typeOf = (b) => LIGHTING_TYPES.find((t) => t.id === b.type) || null;
export const packageOf = (b) => PACKAGES.find((p) => p.id === b.packageId) || null;
export const windowOf = (b) => TIME_WINDOWS.find((w) => w.id === b.windowId) || null;
export const addonsFor = (type) => ADDONS.filter((a) => !(a.seasonalOnly && type === 'permanent'));
export const selectedAddons = (b) => addonsFor(b.type).filter((a) => b.addons.includes(a.id));

export const money = (n) => '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });

/** Estimate text. Permanent, or anything unpriced, reads "Online quoting". */
export function estimate(b) {
  const pkg = packageOf(b);
  if (!pkg) return { text: '—', amount: null };
  if (b.type === 'permanent') return { text: 'Online quoting', amount: null };
  const parts = [pkg.price];
  if (b.stories === '2') parts.push(pkg.price == null ? null : (pkg.price * TWO_STORY_PERCENT) / 100);
  for (const a of selectedAddons(b)) parts.push(a.price);
  if (parts.some((p) => p == null)) return { text: 'Online quoting', amount: null };
  const total = parts.reduce((s, p) => s + p, 0);
  return { text: `Starting at ${money(total)}`, amount: total };
}

/** Home details for the shared `vehicle` column, e.g. "Seasonal · 2-Story · Front & Sides · +Wreaths". */
export function homeSummary(b) {
  const t = typeOf(b);
  const p = packageOf(b);
  const bits = [t ? t.name : '', b.stories ? `${b.stories}-Story` : '', p ? p.name : ''].filter(Boolean);
  for (const a of selectedAddons(b)) bits.push('+' + a.short);
  return bits.join(' · ');
}

export const phoneDigits = (s) => String(s || '').replace(/\D/g, '');
export function formatPhone(s) {
  const d = phoneDigits(s).slice(0, 10);
  if (d.length < 4) return d;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}
export const emailOk = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s).trim());

/** Index of the first step that isn't complete (0-based, 6 = all done). */
export function firstIncomplete(b) {
  if (!b.type) return 0;
  if (!b.packageId) return 1;
  if (!b.stories) return 2;
  if (!b.date) return 3;
  if (!b.windowId) return 4;
  if (!b.name.trim() || phoneDigits(b.phone).length !== 10 || !emailOk(b.email) || b.address.trim().length < 6) return 5;
  return 6;
}

/** Payload for POST /api/bookings — matches the shared D1 columns. */
export function bookingPayload(b) {
  const pkg = packageOf(b);
  const t = typeOf(b);
  const est = estimate(b);
  return {
    ref: b.ref,
    lighting_type: t ? t.name : '',
    date: b.date,
    time: b.windowId,
    service: pkg ? pkg.name : '',
    vehicle: homeSummary(b),
    name: b.name.trim(),
    phone: phoneDigits(b.phone),
    email: b.email.trim(),
    address: b.address.trim(),
    addons: selectedAddons(b).map((a) => a.name),
    estimate: est.text,
    deposit: DEPOSIT,
  };
}

/** Saves via the Worker, stores the confirmation snapshot, clears the draft and routes to /confirmation. */
export async function finishBooking(navigate, b, paymentStatus, paymentIntentId) {
  const res = await createBooking({
    ...bookingPayload(b),
    payment_status: paymentStatus,
    payment_intent_id: paymentIntentId || undefined,
  });
  const snap = { id: res.id, conflict: Boolean(res.conflict), paymentStatus, booking: b, at: Date.now() };
  try { sessionStorage.setItem(CONFIRM_KEY, JSON.stringify(snap)); } catch { /* ignore */ }
  clearBooking();
  navigate('/confirmation', { replace: true });
  return res;
}
