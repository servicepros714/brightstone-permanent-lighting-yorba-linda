/**
 * brightstone-yorbalinda-api — Cloudflare Worker for Brightstone Permanent Lighting (Yorba Linda)
 *
 * Paste this whole file into: Cloudflare dashboard → Workers & Pages → brightstone-yorbalinda-api → Edit code → Deploy.
 *
 * Bindings / secrets (Settings → Bindings / Variables and Secrets):
 *   DB                 D1 binding → the shared bookings database
 *   STRIPE_SECRET_KEY  Secret (sk_live_… / sk_test_…)
 *   ADMIN_TOKEN        Optional secret. GET/PATCH /api/bookings stay closed unless it is set.
 *   ALLOWED_ORIGIN     Optional. Your live site origin (e.g. https://brightstonelighting.com). Defaults to *.
 *
 * Routes
 *   GET   /api/availability?date=YYYY-MM-DD     → { date, unavailable: [time…] }   (taken + inside 48h lead time)
 *   GET   /api/availability?from=…&to=…         → { full: [date…] }               (no window left)
 *   POST  /api/create-payment-intent            → { clientSecret, id }            ($149, never touches D1)
 *   POST  /api/bookings                         → { ok, id, conflict }
 *   GET   /api/bookings                         → admin list (Bearer ADMIN_TOKEN)
 *   PATCH /api/bookings/:id                     → admin update of PATCHABLE fields (Bearer ADMIN_TOKEN)
 */

const SOURCE = 'brightstone-yorbalinda';
const PREFIX = 'BSL-';
const DEPOSIT_CENTS = 14900;
const TZ = 'America/Los_Angeles';
const LEAD_HOURS = 48;
const SEASON = { start: { m: 10, d: 20 }, end: { m: 12, d: 20 } };
// Exact strings stored in the D1 `time` column (en dash).
const WINDOWS = [
  { id: '8AM–12PM', start: 8 },
  { id: '12PM–4PM', start: 12 },
];
const LIGHTING_TYPES = ['Permanent', 'Seasonal'];
const PACKAGES = ['Front Only', 'Front & Sides'];
const PATCHABLE = ['status', 'reschedule_date', 'reschedule_time', 'notes2', 'original_date', 'original_time', 'payment_status', 'date', 'time'];
const PAYMENT_STATUSES = ['Paid', 'Pay Later'];

// A booking holds its rescheduled slot when one is set, otherwise its original slot.
const ACTIVE = "COALESCE(status, '') NOT IN ('Cancelled', 'Canceled', 'Deleted')";
const SLOT_DATE = 'COALESCE(NULLIF(reschedule_date, \'\'), date)';
const SLOT_TIME = 'COALESCE(NULLIF(reschedule_time, \'\'), time)';

// Single-line statements run one at a time with prepare().run() — never exec() (newline parsing bug).
const SCHEMA = [
  'CREATE TABLE IF NOT EXISTS bookings (id TEXT PRIMARY KEY, date TEXT, time TEXT, service TEXT, name TEXT, phone TEXT, email TEXT, vehicle TEXT, address TEXT, notes TEXT, source TEXT, created_at TEXT, status TEXT, reschedule_date TEXT, reschedule_time TEXT, notes2 TEXT, original_date TEXT, original_time TEXT, payment_status TEXT)',
  'CREATE INDEX IF NOT EXISTS idx_bookings_source_date ON bookings (source, date)',
];

export default {
  async fetch(request, env) {
    const cors = corsHeaders(env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    try {
      if (path === '/api/health') return json({ ok: true, source: SOURCE }, 200, cors);
      if (path === '/api/availability' && request.method === 'GET') return await availability(url, env, cors);
      if (path === '/api/create-payment-intent' && request.method === 'POST') return await createPaymentIntent(request, env, cors);
      if (path === '/api/bookings' && request.method === 'POST') return await createBooking(request, env, cors);
      if (path === '/api/bookings' && request.method === 'GET') return await listBookings(request, url, env, cors);
      const m = path.match(/^\/api\/bookings\/([A-Za-z0-9-]+)$/);
      if (m && request.method === 'PATCH') return await patchBooking(request, m[1], env, cors);
      return json({ error: 'Not found' }, 404, cors);
    } catch (err) {
      console.error('Unhandled error', err && err.stack ? err.stack : err);
      return json({ error: 'Server error. Please call us to book.' }, 500, cors);
    }
  },
};

/* ───────── schema (memoized, never blocks payments) ───────── */
let schemaReady = null;
async function ensureSchema(env) {
  if (!env.DB) throw new Error('D1 binding "DB" is missing');
  if (!schemaReady) {
    schemaReady = (async () => {
      for (const sql of SCHEMA) await env.DB.prepare(sql).run();
    })().catch((e) => {
      schemaReady = null; // retry next request
      console.error('ensureSchema failed (continuing):', e && e.message);
    });
  }
  await schemaReady;
}

/* ───────── availability ───────── */
async function availability(url, env, cors) {
  const date = url.searchParams.get('date');
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  await ensureSchema(env);

  if (date) {
    if (!isIsoDate(date)) return json({ error: 'Invalid date' }, 400, cors);
    const { results } = await env.DB.prepare(
      `SELECT ${SLOT_TIME} AS t FROM bookings WHERE source = ? AND ${ACTIVE} AND ${SLOT_DATE} = ?`,
    ).bind(SOURCE, date).all();
    const taken = new Set((results || []).map((r) => r.t));
    const unavailable = WINDOWS.filter((w) => taken.has(w.id) || !windowOpen(date, w)).map((w) => w.id);
    return json({ date, unavailable }, 200, cors);
  }

  if (from && to) {
    if (!isIsoDate(from) || !isIsoDate(to) || to < from) return json({ error: 'Invalid range' }, 400, cors);
    if (daysBetween(from, to) > 120) return json({ error: 'Range too long' }, 400, cors);
    const { results } = await env.DB.prepare(
      `SELECT ${SLOT_DATE} AS d, ${SLOT_TIME} AS t FROM bookings WHERE source = ? AND ${ACTIVE} AND ${SLOT_DATE} BETWEEN ? AND ?`,
    ).bind(SOURCE, from, to).all();
    const byDate = new Map();
    for (const r of results || []) {
      if (!byDate.has(r.d)) byDate.set(r.d, new Set());
      byDate.get(r.d).add(r.t);
    }
    const full = [];
    for (const [d, set] of byDate) {
      if (WINDOWS.every((w) => set.has(w.id) || !windowOpen(d, w))) full.push(d);
    }
    full.sort();
    return json({ full }, 200, cors, 'public, max-age=30');
  }
  return json({ error: 'Pass ?date= or ?from=&to=' }, 400, cors);
}

/* ───────── Stripe ───────── */
async function stripe(env, method, path, params) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      ...(params ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: params ? new URLSearchParams(params).toString() : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data.error && data.error.message) || `Stripe error ${res.status}`);
  return data;
}

async function createPaymentIntent(request, env, cors) {
  // Deliberately no D1 access here: a schema problem can never block a payment.
  if (!env.STRIPE_SECRET_KEY) return json({ error: 'Card payments aren’t set up yet. Choose “I’ll pay at the visit”.' }, 503, cors);
  const body = await readJson(request);
  const params = {
    amount: String(DEPOSIT_CENTS),
    currency: 'usd',
    'automatic_payment_methods[enabled]': 'true',
    description: 'Brightstone Permanent Lighting — install reservation deposit',
    'metadata[source]': SOURCE,
  };
  if (body.ref) params['metadata[ref]'] = clip(body.ref, 40);
  if (body.date) params['metadata[date]'] = clip(body.date, 10);
  if (body.time) params['metadata[time]'] = clip(body.time, 20);
  if (body.service) params['metadata[service]'] = clip(body.service, 60);
  if (body.name) params['metadata[name]'] = clip(body.name, 80);
  if (validEmail(body.email)) params.receipt_email = String(body.email).trim();
  try {
    const pi = await stripe(env, 'POST', 'payment_intents', params);
    return json({ clientSecret: pi.client_secret, id: pi.id }, 200, cors);
  } catch (e) {
    console.error('PaymentIntent create failed:', e.message);
    return json({ error: 'Card payment is unavailable right now. You can still reserve and pay at the visit.' }, 502, cors);
  }
}

/* ───────── bookings ───────── */
async function createBooking(request, env, cors) {
  const b = await readJson(request);

  const type = String(b.lighting_type || '').trim();
  const service = String(b.service || '').trim();
  const date = String(b.date || '').trim();
  const time = String(b.time || '').trim();
  const name = clip(b.name, 120).trim();
  const phone = String(b.phone || '').replace(/\D/g, '');
  const email = clip(b.email, 160).trim();
  const address = clip(b.address, 240).trim();
  // Both end up inside LIKE patterns below, so they can never carry wildcards.
  const ref = clip(b.ref, 40).replace(/[^A-Za-z0-9-]/g, '');
  const wantsPaid = b.payment_status === 'Paid';
  const piId = wantsPaid ? String(b.payment_intent_id || '').trim() : '';

  if (!LIGHTING_TYPES.includes(type)) return json({ error: 'Choose a lighting type: Permanent or Seasonal.' }, 400, cors);
  if (!PACKAGES.includes(service)) return json({ error: 'Choose a package.' }, 400, cors);
  if (!isIsoDate(date) || !inSeason(date)) return json({ error: 'Pick an install date inside the season.' }, 400, cors);
  if (!WINDOWS.some((w) => w.id === time)) return json({ error: 'Pick a time window.' }, 400, cors);
  if (!name) return json({ error: 'Enter your full name.' }, 400, cors);
  if (phone.length !== 10) return json({ error: 'Enter a 10-digit phone number.' }, 400, cors);
  if (!validEmail(email)) return json({ error: 'Enter a valid email address.' }, 400, cors);
  if (address.length < 6) return json({ error: 'Enter the service address.' }, 400, cors);
  if (wantsPaid && !/^pi_[A-Za-z0-9]+$/.test(piId)) return json({ error: 'Missing payment reference.' }, 400, cors);

  // Verify the deposit with Stripe before saving "Paid".
  if (wantsPaid) {
    if (!env.STRIPE_SECRET_KEY) return json({ error: 'Payments are not configured.' }, 503, cors);
    let pi;
    try {
      pi = await stripe(env, 'GET', `payment_intents/${encodeURIComponent(piId)}`);
    } catch (e) {
      return json({ error: 'We couldn’t verify your payment. Please call us.' }, 502, cors);
    }
    const okStatus = ['succeeded', 'processing', 'requires_capture'].includes(pi.status);
    const okAmount = Number(pi.amount) === DEPOSIT_CENTS && pi.currency === 'usd';
    const okSource = Boolean(pi.metadata) && pi.metadata.source === SOURCE;
    if (!okStatus || !okAmount || !okSource) return json({ error: 'Payment not completed.' }, 402, cors);
  }

  await ensureSchema(env);

  // Idempotency: the same PaymentIntent or draft ref never creates two rows.
  const dupe = await env.DB.prepare(
    "SELECT id FROM bookings WHERE source = ? AND ((? <> '' AND notes LIKE ?) OR (? <> '' AND notes LIKE ?)) LIMIT 1",
  ).bind(SOURCE, piId, `%PI: ${piId}%`, ref, `%Ref: ${ref}%`).first();
  if (dupe && dupe.id) return json({ ok: true, id: dupe.id, duplicate: true }, 200, cors);

  const vehicleRaw = clip(b.vehicle, 200).trim();
  const vehicle = vehicleRaw.startsWith(type) ? vehicleRaw : [type, vehicleRaw].filter(Boolean).join(' · ');
  const addons = Array.isArray(b.addons) ? b.addons.map((a) => clip(a, 60)).filter(Boolean) : [];
  const estimate = clip(b.estimate, 60) || 'Online quoting';
  const lateOrClosed = !windowOpen(date, WINDOWS.find((w) => w.id === time));
  if (lateOrClosed && !wantsPaid) return json({ error: 'That window is no longer available. Please pick another.' }, 409, cors);

  const id = newId();
  const createdAt = new Date().toISOString();
  const paymentStatus = wantsPaid ? 'Paid' : 'Pay Later';
  const baseNotes = [
    `Type: ${type}`,
    `Add-ons: ${addons.length ? addons.join(', ') : 'None'}`,
    `Estimate: ${estimate}`,
    wantsPaid ? `Deposit: $${DEPOSIT_CENTS / 100} paid` : 'Deposit: pay at visit',
    piId ? `PI: ${piId}` : '',
    ref ? `Ref: ${ref}` : '',
  ].filter(Boolean);
  const cols = 'id, date, time, service, name, phone, email, vehicle, address, notes, source, created_at, status, reschedule_date, reschedule_time, notes2, original_date, original_time, payment_status';
  const values = (notes) => [id, date, time, service, name, phone, email, vehicle, address, notes, SOURCE, createdAt, 'Booked', null, null, null, null, null, paymentStatus];

  // Atomic insert only if the slot is still free.
  const guarded = await env.DB.prepare(
    `INSERT INTO bookings (${cols}) SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM bookings WHERE source = ? AND ${ACTIVE} AND ${SLOT_DATE} = ? AND ${SLOT_TIME} = ?)`,
  ).bind(...values(baseNotes.join(' | ')), SOURCE, date, time).run();
  const inserted = guarded && guarded.meta ? guarded.meta.changes > 0 : false;
  if (inserted && !lateOrClosed) return json({ ok: true, id, conflict: false }, 200, cors);

  if (!wantsPaid) return json({ error: 'That time window was just booked. Please pick another.' }, 409, cors);

  // A paid booking is never lost: save it and flag it for a call.
  const flag = lateOrClosed ? 'SLOT CONFLICT — window inside lead time, call to confirm' : 'SLOT CONFLICT — window already booked, call to confirm';
  if (inserted) {
    await env.DB.prepare('UPDATE bookings SET notes = ? WHERE id = ?').bind([...baseNotes, flag].join(' | '), id).run();
  } else {
    await env.DB.prepare(`INSERT INTO bookings (${cols}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(...values([...baseNotes, flag].join(' | '))).run();
  }
  return json({ ok: true, id, conflict: true }, 200, cors);
}

function adminDenied(request, env, cors) {
  if (!env.ADMIN_TOKEN) return json({ error: 'Admin routes are disabled. Set the ADMIN_TOKEN secret to enable them.' }, 403, cors);
  const auth = request.headers.get('Authorization') || '';
  if (auth !== `Bearer ${env.ADMIN_TOKEN}`) return json({ error: 'Unauthorized' }, 401, cors);
  return null;
}

async function listBookings(request, url, env, cors) {
  const denied = adminDenied(request, env, cors);
  if (denied) return denied;
  await ensureSchema(env);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  let sql = 'SELECT * FROM bookings WHERE source = ?';
  const args = [SOURCE];
  if (from && isIsoDate(from)) { sql += ' AND date >= ?'; args.push(from); }
  if (to && isIsoDate(to)) { sql += ' AND date <= ?'; args.push(to); }
  sql += ' ORDER BY date ASC, time ASC, created_at ASC LIMIT 1000';
  const { results } = await env.DB.prepare(sql).bind(...args).all();
  return json({ bookings: results || [] }, 200, cors);
}

async function patchBooking(request, id, env, cors) {
  const denied = adminDenied(request, env, cors);
  if (denied) return denied;
  const body = await readJson(request);
  const sets = [];
  const args = [];
  for (const k of PATCHABLE) {
    if (!(k in body)) continue;
    let v = body[k] == null ? null : String(body[k]).trim();
    if (k === 'payment_status' && v !== null && !PAYMENT_STATUSES.includes(v)) return json({ error: 'payment_status must be Paid or Pay Later' }, 400, cors);
    if ((k === 'date' || k === 'reschedule_date' || k === 'original_date') && v && !isIsoDate(v)) return json({ error: `${k} must be YYYY-MM-DD` }, 400, cors);
    if (v !== null) v = v.slice(0, 2000);
    sets.push(`${k} = ?`);
    args.push(v);
  }
  if (!sets.length) return json({ error: 'No patchable fields in body', patchable: PATCHABLE }, 400, cors);
  await ensureSchema(env);
  const res = await env.DB.prepare(`UPDATE bookings SET ${sets.join(', ')} WHERE id = ? AND source = ?`).bind(...args, id, SOURCE).run();
  if (!res.meta || !res.meta.changes) return json({ error: 'Booking not found' }, 404, cors);
  const row = await env.DB.prepare('SELECT * FROM bookings WHERE id = ? AND source = ?').bind(id, SOURCE).first();
  return json({ ok: true, booking: row }, 200, cors);
}

/* ───────── helpers ───────── */
function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}
function json(data, status, cors, cache = 'no-store') {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cache, ...cors } });
}
async function readJson(request) {
  try { const v = await request.json(); return v && typeof v === 'object' ? v : {}; } catch { return {}; }
}
const clip = (v, n) => (v == null ? '' : String(v)).slice(0, n);
const validEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || '').trim());
// Round-trips through Date because Date.parse quietly accepts impossible days like Nov 31.
function isIsoDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s || ''))) return false;
  const ms = Date.parse(`${s}T00:00:00Z`);
  return !Number.isNaN(ms) && new Date(ms).toISOString().slice(0, 10) === s;
}
const pad = (n) => String(n).padStart(2, '0');
function daysBetween(a, b) {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
}

const partsFmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
function pacificParts(ms) {
  const o = {};
  for (const p of partsFmt.formatToParts(new Date(ms))) o[p.type] = p.value;
  return { y: +o.year, m: +o.month, d: +o.day, h: +o.hour % 24, min: +o.minute, s: +o.second };
}
function offsetAt(ms) {
  const p = pacificParts(ms);
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.min, p.s) - Math.floor(ms / 1000) * 1000;
}
function pacificToEpoch(y, m, d, h) {
  const guess = Date.UTC(y, m - 1, d, h, 0);
  const off = offsetAt(guess);
  let ms = guess - off;
  const off2 = offsetAt(ms);
  if (off2 !== off) ms = guess - off2;
  return ms;
}
function currentSeason(now = Date.now()) {
  const p = pacificParts(now);
  let year = p.y;
  const today = `${p.y}-${pad(p.m)}-${pad(p.d)}`;
  if (today > `${year}-${pad(SEASON.end.m)}-${pad(SEASON.end.d)}`) year += 1;
  return { start: `${year}-${pad(SEASON.start.m)}-${pad(SEASON.start.d)}`, end: `${year}-${pad(SEASON.end.m)}-${pad(SEASON.end.d)}` };
}
function inSeason(date) {
  const s = currentSeason();
  return date >= s.start && date <= s.end;
}
function windowOpen(date, win) {
  if (!win || !inSeason(date)) return false;
  const [y, m, d] = date.split('-').map(Number);
  return pacificToEpoch(y, m, d, win.start) >= Date.now() + LEAD_HOURS * 3600 * 1000;
}
function newId() {
  const p = pacificParts(Date.now());
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(4)), (x) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[x % 32]).join('');
  return `${PREFIX}${String(p.y).slice(2)}${pad(p.m)}${pad(p.d)}-${rand}`;
}
