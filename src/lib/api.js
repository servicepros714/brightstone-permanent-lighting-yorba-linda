/* Thin client for the Brightstone Worker (brightstone-yorbalinda-api). */
const BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/+$/, '');

export const apiConfigured = () => Boolean(BASE) && !BASE.includes('YOUR-SUBDOMAIN');

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function call(path, opts = {}) {
  if (!apiConfigured()) throw new ApiError('Online booking isn’t connected yet. Please call us to book.', 0);
  let res;
  try {
    res = await fetch(BASE + path, {
      ...opts,
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    });
  } catch {
    throw new ApiError('We couldn’t reach the booking server. Check your connection and try again.', 0);
  }
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) throw new ApiError((data && data.error) || `Request failed (${res.status})`, res.status, data);
  return data;
}

/** Windows already taken (or inside the 48h lead time) for one date. → { date, unavailable: [] } */
export const getDayAvailability = (date) => call(`/api/availability?date=${encodeURIComponent(date)}`);

/** Fully booked dates between two ISO dates. → { full: [] } */
export const getRangeAvailability = (from, to) =>
  call(`/api/availability?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);

/** Creates the $149 reservation PaymentIntent. → { clientSecret, id } */
export const createPaymentIntent = (body) =>
  call('/api/create-payment-intent', { method: 'POST', body: JSON.stringify(body) });

/** Saves the booking. → { ok, id, conflict? } */
export const createBooking = (body) => call('/api/bookings', { method: 'POST', body: JSON.stringify(body) });
