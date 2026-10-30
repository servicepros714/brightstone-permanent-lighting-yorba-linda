import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BUSINESS, DEPOSIT, LIGHTING_TYPES, PACKAGES, TIME_WINDOWS, TWO_STORY_PERCENT } from '../config/site.js';
import { apiConfigured, getDayAvailability, getRangeAvailability } from '../lib/api.js';
import {
  addonsFor, emailOk, estimate, money, firstIncomplete, formatPhone, packageOf, phoneDigits, selectedAddons, typeOf, useBooking, windowOf,
} from '../lib/booking.js';
import { scrollTopNow } from '../lib/hooks.js';
import {
  addDays, currentSeason, dateOpen, fmtLong, fmtShort, iso, parseIso, todayPacific, weekday, windowOpen,
} from '../lib/time.js';
import { ADDON_ICONS, Arrow, Back, Check, Chevron, Loop, Snow, Stories } from '../components/Icons.jsx';

const STEPS = [
  { key: 'type', short: 'Type', title: 'Permanent or seasonal?', sub: 'Pick how you want your home lit. Both use the same coverage options.' },
  { key: 'package', short: 'Package', title: 'Choose your coverage', sub: 'Starting prices — your final price is confirmed at the on-site visit.' },
  { key: 'home', short: 'Home', title: 'Your home & add-ons', sub: 'Tell us the height of the home, then add anything extra.' },
  { key: 'date', short: 'Date', title: 'Pick an install date', sub: 'Install dates run through the season, every day of the week (Pacific time).' },
  { key: 'time', short: 'Time', title: 'Pick a time window', sub: 'Our crew arrives during the window you choose.' },
  { key: 'info', short: 'Info', title: 'Your info', sub: 'So we can confirm your install and reach you on the day.' },
];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Book() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const [b, update] = useBooking();
  const [error, setError] = useState(null); // { msg, field }
  const [orderOpen, setOrderOpen] = useState(false);
  const fieldRefs = useRef({});
  const reg = (k) => (el) => { fieldRefs.current[k] = el; };

  const params = new URLSearchParams(search);
  const allowed = Math.min(firstIncomplete(b), 5); // highest reachable step index
  const asked = Math.max(1, Number(params.get('step')) || 1) - 1;
  const step = Math.min(asked, allowed);

  // Deep links: /book?type=permanent, /book?date=YYYY-MM-DD
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    const t = params.get('type');
    const d = params.get('date');
    const patch = {};
    if (t && LIGHTING_TYPES.some((x) => x.id === t)) {
      patch.type = t;
      patch.addons = b.addons.filter((id) => addonsFor(t).some((a) => a.id === id));
    }
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d) && dateOpen(d)) { patch.date = d; patch.windowId = ''; }
    if (Object.keys(patch).length) {
      update(patch);
      const next = { ...b, ...patch };
      navigate(`/book?step=${Math.min(firstIncomplete(next), 5) + 1}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the URL honest when someone jumps ahead.
  useEffect(() => {
    if (params.get('step') && asked !== step) navigate(`/book?step=${step + 1}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asked, step]);

  // Scroll to top on every step change.
  useEffect(() => { scrollTopNow(); setError(null); }, [step]);

  const goTo = (i) => navigate(`/book?step=${i + 1}`);

  const fail = (msg, field) => {
    setError({ msg, field });
    requestAnimationFrame(() => {
      const el = fieldRefs.current[field];
      if (el) { el.focus({ preventScroll: true }); el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    });
  };

  const validate = () => {
    switch (step) {
      case 0: if (!b.type) return fail('Choose a lighting type: Permanent or Seasonal.', 'type'), false; break;
      case 1: if (!b.packageId) return fail('Choose a package: Front Only or Front & Sides.', 'package'), false; break;
      case 2: if (!b.stories) return fail('Choose your home height: 1-story or 2-story.', 'stories'), false; break;
      case 3: if (!b.date) return fail('Pick an install date.', 'date'), false; break;
      case 4: if (!b.windowId) return fail('Pick a time window.', 'time'), false; break;
      case 5:
        if (!b.name.trim()) return fail('Enter your full name.', 'name'), false;
        if (phoneDigits(b.phone).length !== 10) return fail('Enter a 10-digit phone number.', 'phone'), false;
        if (!emailOk(b.email)) return fail('Enter a valid email address.', 'email'), false;
        if (b.address.trim().length < 6) return fail('Enter the service address.', 'address'), false;
        break;
      default:
    }
    return true;
  };

  const next = () => {
    if (!validate()) return;
    if (step === 5) navigate('/checkout');
    else goTo(step + 1);
  };
  const back = () => {
    if (step === 0) navigate('/');
    else goTo(step - 1);
  };

  const errFor = (f) => (error && error.field === f ? error.msg : null);
  const S = STEPS[step];

  return (
    <section className="book">
      <div className="container book__grid">
        <OrderPanel b={b} open={orderOpen} setOpen={setOrderOpen} goTo={goTo} allowed={allowed} />

        <div className="book__main">
          <ol className="gables" aria-label="Booking progress">
            {STEPS.map((s, i) => {
              const state = i < step ? 'done' : i === step ? 'current' : 'todo';
              const can = i <= allowed && i !== step;
              return (
                <li key={s.key} className={`gable gable--${state}`}>
                  <button type="button" disabled={!can} onClick={() => goTo(i)} aria-current={i === step ? 'step' : undefined} aria-label={`Step ${i + 1}: ${s.short}${state === 'done' ? ' (done)' : ''}`}>
                    <svg viewBox="0 0 40 26" aria-hidden="true"><path d="M3 24 20 4l17 20Z" /></svg>
                    <span>{s.short}</span>
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="stepcard" key={step}>
            <p className="stepcard__count">Step {step + 1} of {STEPS.length}</p>
            <h1 className="stepcard__title">{S.title}</h1>
            <p className="stepcard__sub">{S.sub}</p>

            {step === 0 && (
              <div className="choices choices--2" role="radiogroup" aria-label="Lighting type" aria-invalid={!!errFor('type')}>
                {LIGHTING_TYPES.map((t, i) => (
                  <Choice
                    key={t.id}
                    ref={i === 0 ? reg('type') : undefined}
                    kind="radio"
                    checked={b.type === t.id}
                    onClick={() => update({ type: t.id, addons: b.addons.filter((id) => addonsFor(t.id).some((a) => a.id === id)) })}
                    icon={t.id === 'permanent' ? <Loop /> : <Snow />}
                    title={t.name}
                    meta={t.tagline}
                    text={t.blurb}
                    side={t.id === 'permanent' ? 'Online quoting' : 'Starting prices'}
                  />
                ))}
              </div>
            )}

            {step === 1 && (
              <div className="choices" role="radiogroup" aria-label="Package">
                {PACKAGES.map((p, i) => {
                  const feats = b.type === 'permanent' && p.permanentFeatures ? p.permanentFeatures : p.features;
                  return (
                    <Choice
                      key={p.id}
                      ref={i === 0 ? reg('package') : undefined}
                      kind="radio"
                      checked={b.packageId === p.id}
                      onClick={() => update({ packageId: p.id })}
                      title={p.name}
                      meta={`${typeOf(b)?.name || ''} package`}
                      side={b.type === 'permanent' || p.price == null ? 'Online quoting' : `From ${money(p.price)}`}
                      list={feats}
                    />
                  );
                })}
              </div>
            )}

            {step === 2 && (
              <>
                <fieldset className="group">
                  <legend className="group__label">Home height <span className="req">Required</span></legend>
                  <div className="choices choices--2 choices--compact" role="radiogroup" aria-label="Home height">
                    {[
                      { id: '1', title: '1-Story', meta: 'Single-level roofline' },
                      { id: '2', title: '2-Story', meta: `+${TWO_STORY_PERCENT}% of package price` },
                    ].map((o, i) => (
                      <Choice key={o.id} ref={i === 0 ? reg('stories') : undefined} kind="radio" checked={b.stories === o.id} onClick={() => update({ stories: o.id })} icon={<Stories />} title={o.title} meta={o.meta} />
                    ))}
                  </div>
                </fieldset>
                <fieldset className="group">
                  <legend className="group__label">Add-ons <span className="opt">Optional</span></legend>
                  <div className="choices choices--2 choices--compact">
                    {addonsFor(b.type).map((a) => {
                      const Icon = ADDON_ICONS[a.icon];
                      const on = b.addons.includes(a.id);
                      return (
                        <Choice
                          key={a.id}
                          kind="check"
                          checked={on}
                          onClick={() => update({ addons: on ? b.addons.filter((x) => x !== a.id) : [...b.addons, a.id] })}
                          icon={<Icon />}
                          title={a.name}
                          meta={a.price == null ? 'Online quoting' : `+${money(a.price)}`}
                        />
                      );
                    })}
                  </div>
                </fieldset>
              </>
            )}

            {step === 3 && <DateStep b={b} update={update} reg={reg} />}
            {step === 4 && <TimeStep b={b} update={update} reg={reg} />}

            {step === 5 && (
              <div className="fields">
                <Field label="Full name" id="name" err={errFor('name')}>
                  <input ref={reg('name')} id="name" name="name" autoComplete="name" value={b.name} onChange={(e) => update({ name: e.target.value })} aria-invalid={!!errFor('name')} />
                </Field>
                <Field label="Phone" id="phone" err={errFor('phone')}>
                  <input ref={reg('phone')} id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="(714) 555-0123" value={formatPhone(b.phone)} onChange={(e) => update({ phone: phoneDigits(e.target.value).slice(0, 10) })} aria-invalid={!!errFor('phone')} />
                </Field>
                <Field label="Email" id="email" err={errFor('email')} wide>
                  <input ref={reg('email')} id="email" name="email" type="email" inputMode="email" autoComplete="email" value={b.email} onChange={(e) => update({ email: e.target.value })} aria-invalid={!!errFor('email')} />
                </Field>
                <Field label="Service address" id="address" err={errFor('address')} wide>
                  <input ref={reg('address')} id="address" name="address" autoComplete="street-address" placeholder={`Street, ${BUSINESS.city}, CA`} value={b.address} onChange={(e) => update({ address: e.target.value })} aria-invalid={!!errFor('address')} />
                </Field>
              </div>
            )}

            {error && !['name', 'phone', 'email', 'address'].includes(error.field) && (
              <p className="formerr" role="alert">{error.msg}</p>
            )}
          </div>

          <div className="stepbar">
            <button type="button" className="btn btn--line" onClick={back}><Back width={18} height={18} /> Back</button>
            <button type="button" className="btn btn--gold stepbar__next" onClick={next}>
              {step === 5 ? 'Continue to checkout' : 'Continue'} <Arrow width={18} height={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────── pieces ───────── */

const Choice = forwardRef(function Choice({ kind, checked, onClick, icon, title, meta, text, side, list, disabled }, ref) {
  return (
  <button
    type="button"
    ref={ref}
    role={kind === 'radio' ? 'radio' : 'checkbox'}
    aria-checked={checked}
    aria-disabled={disabled || undefined}
    disabled={disabled}
    className={`choice${icon ? ' choice--icon' : ''}${checked ? ' is-on' : ''}${disabled ? ' is-disabled' : ''}`}
    onClick={onClick}
  >
    <span className={`choice__box choice__box--${kind}`} aria-hidden="true">{checked && kind === 'check' ? <Check width={14} height={14} /> : null}</span>
    {icon && <span className="choice__icon" aria-hidden="true">{icon}</span>}
    <span className="choice__body">
      <span className="choice__title">{title}</span>
      {meta && <span className="choice__meta">{meta}</span>}
      {text && <span className="choice__text">{text}</span>}
      {list && (
        <span className="choice__list">
          {list.map((l) => <span key={l} className="choice__li"><Check width={15} height={15} />{l}</span>)}
        </span>
      )}
    </span>
    {side && <span className="choice__side">{side}</span>}
  </button>
  );
});

function Field({ label, id, err, wide, children }) {
  return (
    <div className={`field${wide ? ' field--wide' : ''}${err ? ' is-invalid' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {err && <p className="field__err" role="alert">{err}</p>}
    </div>
  );
}

function DateStep({ b, update, reg }) {
  const season = useMemo(() => currentSeason(), []);
  const [full, setFull] = useState([]);
  const [status, setStatus] = useState(apiConfigured() ? 'loading' : 'offline');
  const today = todayPacific();
  const firstOpen = useMemo(() => {
    for (let d = season.start; d <= season.end; d = addDays(d, 1)) if (dateOpen(d)) return d;
    return season.start;
  }, [season]);
  const startMonth = parseIso(b.date || firstOpen);
  const [view, setView] = useState({ y: startMonth.y, m: startMonth.m });

  useEffect(() => {
    if (!apiConfigured()) return undefined;
    let live = true;
    getRangeAvailability(season.start, season.end)
      .then((r) => { if (!live) return; const f = Array.isArray(r?.full) ? r.full : []; setFull(f); setStatus('ok'); if (b.date && f.includes(b.date)) update({ date: '', windowId: '' }); })
      .catch(() => live && setStatus('error'));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [season]);

  const s0 = parseIso(season.start);
  const s1 = parseIso(season.end);
  const canPrev = view.y > s0.y || view.m > s0.m;
  const canNext = view.y < s1.y || view.m < s1.m;
  const shift = (n) => setView((v) => { const m = v.m + n; return m < 1 ? { y: v.y - 1, m: 12 } : m > 12 ? { y: v.y + 1, m: 1 } : { y: v.y, m }; });

  const first = iso(view.y, view.m, 1);
  const lead = weekday(first);
  const daysIn = new Date(Date.UTC(view.y, view.m, 0)).getUTCDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: daysIn }, (_, i) => iso(view.y, view.m, i + 1))];
  const fullSet = new Set(full);
  let firstFocusable = true;

  return (
    <div className="cal">
      <div className="cal__head">
        <button type="button" className="cal__nav" onClick={() => shift(-1)} disabled={!canPrev} aria-label="Previous month"><Chevron style={{ transform: 'rotate(90deg)' }} /></button>
        <p className="cal__month" aria-live="polite">{MONTHS[view.m - 1]} {view.y}</p>
        <button type="button" className="cal__nav" onClick={() => shift(1)} disabled={!canNext} aria-label="Next month"><Chevron style={{ transform: 'rotate(-90deg)' }} /></button>
      </div>
      <div className="cal__dow" aria-hidden="true">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <span key={d}>{d}</span>)}</div>
      <div className="cal__grid" role="grid" aria-label={`${MONTHS[view.m - 1]} ${view.y}`}>
        {cells.map((d, i) => {
          if (!d) return <span key={`x${i}`} className="cal__pad" />;
          const inSeason = d >= season.start && d <= season.end;
          const isFull = fullSet.has(d);
          const open = inSeason && dateOpen(d) && !isFull;
          const sel = b.date === d;
          const refProp = open && firstFocusable ? reg('date') : undefined;
          if (open && firstFocusable) firstFocusable = false;
          return (
            <button
              key={d}
              type="button"
              ref={refProp}
              className={`cal__day${sel ? ' is-sel' : ''}${isFull && inSeason ? ' is-full' : ''}${d === today ? ' is-today' : ''}`}
              disabled={!open}
              aria-pressed={sel}
              aria-label={`${fmtLong(d)}${isFull ? ', fully booked' : open ? '' : ', unavailable'}`}
              onClick={() => update({ date: d, windowId: b.date === d ? b.windowId : '' })}
            >
              {parseIso(d).d}
            </button>
          );
        })}
      </div>
      <ul className="cal__legend">
        <li><i className="lg lg--open" /> Open</li>
        <li><i className="lg lg--sel" /> Selected</li>
        <li><i className="lg lg--full" /> Fully booked</li>
      </ul>
      {b.date && <p className="cal__picked">Selected: <span className="gold-ink">{fmtLong(b.date)}</span></p>}
      {status === 'error' && <p className="cal__note">Live availability couldn’t load — we’ll confirm your date by phone.</p>}
    </div>
  );
}

function TimeStep({ b, update, reg }) {
  const [taken, setTaken] = useState([]);
  const [status, setStatus] = useState(apiConfigured() ? 'loading' : 'offline');
  useEffect(() => {
    if (!apiConfigured() || !b.date) return undefined;
    let live = true;
    getDayAvailability(b.date)
      .then((r) => {
        if (!live) return;
        const u = Array.isArray(r?.unavailable) ? r.unavailable : [];
        setTaken(u);
        setStatus('ok');
        if (b.windowId && u.includes(b.windowId)) update({ windowId: '' });
      })
      .catch(() => live && setStatus('error'));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [b.date]);

  let firstRef = true;
  return (
    <>
      <p className="timefor">Install date: <span className="gold-ink">{fmtLong(b.date)}</span></p>
      <div className="choices choices--2" role="radiogroup" aria-label="Time window">
        {TIME_WINDOWS.map((w) => {
          const ok = windowOpen(b.date, w) && !taken.includes(w.id);
          const refProp = ok && firstRef ? reg('time') : undefined;
          if (ok && firstRef) firstRef = false;
          return (
            <Choice
              key={w.id}
              ref={refProp}
              kind="radio"
              checked={b.windowId === w.id}
              onClick={() => ok && update({ windowId: w.id })}
              title={w.part}
              meta={w.label}
              side={ok ? (status === 'loading' ? 'Checking…' : 'Open') : 'Booked'}
              disabled={!ok}
            />
          );
        })}
      </div>
      {TIME_WINDOWS.every((w) => !windowOpen(b.date, w) || taken.includes(w.id)) && status !== 'loading' && (
        <p className="formerr" role="status">Both windows are taken on {fmtShort(b.date)}. Go back and pick another date.</p>
      )}
    </>
  );
}

function OrderPanel({ b, open, setOpen, goTo, allowed }) {
  const t = typeOf(b);
  const p = packageOf(b);
  const w = windowOf(b);
  const adds = selectedAddons(b);
  const est = estimate(b);
  const rows = [
    { k: 'Lighting', v: t?.name, step: 0 },
    { k: 'Coverage', v: p?.name, step: 1 },
    { k: 'Home', v: b.stories ? `${b.stories}-Story${adds.length ? ` · ${adds.map((a) => a.short).join(', ')}` : ''}` : '', step: 2 },
    { k: 'Date', v: b.date ? fmtShort(b.date) : '', step: 3 },
    { k: 'Window', v: w?.label, step: 4 },
  ];
  return (
    <aside className={`order${open ? ' is-open' : ''}`} aria-label="Your order">
      <button type="button" className="order__toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="order__toggle-k">Your order</span>
        <span className="order__toggle-v">{est.text}</span>
        <Chevron width={20} height={20} className="order__chev" />
      </button>
      <div className="order__body">
        <p className="order__eyebrow">Work order</p>
        <p className="order__title">Brightstone install</p>
        <dl className="order__rows">
          {rows.map((r) => (
            <div key={r.k} className={`order__row${r.v ? ' is-set' : ''}`}>
              <dt>{r.k}</dt>
              <dd>
                {r.v || <span className="order__empty">—</span>}
                {r.v && r.step <= allowed && (
                  <button type="button" className="order__edit" onClick={() => { setOpen(false); goTo(r.step); }} aria-label={`Edit ${r.k}`}>Edit</button>
                )}
              </dd>
            </div>
          ))}
        </dl>
        <div className="order__est">
          <span>Estimate</span>
          <span className="order__est-v">{est.text}</span>
        </div>
        <p className="order__fine">Final price confirmed at the on-site visit. ${DEPOSIT} reservation deposit at checkout, applied to your invoice — or pay at the visit.</p>
      </div>
    </aside>
  );
}
