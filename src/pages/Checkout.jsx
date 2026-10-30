import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, ExpressCheckoutElement, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { BUSINESS, DEPOSIT } from '../config/site.js';
import { apiConfigured, createPaymentIntent } from '../lib/api.js';
import {
  PI_KEY, estimate, finishBooking, firstIncomplete, formatPhone, money, packageOf, selectedAddons, typeOf, useBooking, windowOf,
} from '../lib/booking.js';
import { fmtLong } from '../lib/time.js';
import { Calendar, Check, Clock, House, Lock, Pin } from '../components/Icons.jsx';

const PK = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
const stripeReady = PK.startsWith('pk_') && !PK.includes('xxxx');
let stripePromise = null;
const getStripe = () => {
  if (!stripePromise && stripeReady) stripePromise = loadStripe(PK);
  return stripePromise;
};

const APPEARANCE = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#1B1B1E',
    colorText: '#1B1B1E',
    colorDanger: '#B42318',
    fontFamily: 'Figtree, system-ui, sans-serif',
    borderRadius: '12px',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': { border: '1.5px solid #DCD3C3', boxShadow: 'none' },
    '.Input:focus': { border: '1.5px solid #1B1B1E', boxShadow: '0 0 0 4px rgba(242,193,46,.3)' },
    '.Tab--selected': { borderColor: '#1B1B1E', boxShadow: '0 0 0 2px rgba(242,193,46,.45)' },
  },
};
const FONTS = [{ cssSrc: 'https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&display=swap' }];

export default function Checkout() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const [b] = useBooking();
  const [pi, setPi] = useState(null); // { clientSecret, id }
  const [piError, setPiError] = useState('');
  const [saveError, setSaveError] = useState(null); // { msg, slot }
  const [busy, setBusy] = useState('');
  const handled = useRef(false);

  const params = new URLSearchParams(search);
  const returnedPi = params.get('payment_intent');
  const redirectStatus = params.get('redirect_status');
  const complete = firstIncomplete(b) === 6;

  // Incomplete booking → back to the first missing step (unless returning from a Stripe redirect).
  useEffect(() => {
    if (!complete && !returnedPi) navigate(`/book?step=${firstIncomplete(b) + 1}`, { replace: true });
  }, [complete, returnedPi, b, navigate]);

  // Returning from a redirect-based payment method (bank, wallet).
  useEffect(() => {
    if (!returnedPi || handled.current) return;
    handled.current = true;
    if (redirectStatus === 'succeeded' || redirectStatus === 'processing') {
      save('Paid', returnedPi);
    } else {
      setSaveError({ msg: 'Your payment wasn’t completed. You can try again or choose to pay at the visit.' });
      navigate('/checkout', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returnedPi, redirectStatus]);

  // Create (or reuse) the $149 PaymentIntent. Elements only mounts once it exists.
  useEffect(() => {
    if (!complete || returnedPi || !stripeReady || !apiConfigured()) return undefined;
    try {
      const cached = JSON.parse(sessionStorage.getItem(PI_KEY) || 'null');
      if (cached && cached.ref === b.ref && cached.clientSecret) { setPi(cached); return undefined; }
    } catch { /* ignore */ }
    let live = true;
    createPaymentIntent({ ref: b.ref, name: b.name, email: b.email, date: b.date, time: b.windowId, service: packageOf(b)?.name })
      .then((r) => {
        if (!live) return;
        const v = { ref: b.ref, clientSecret: r.clientSecret, id: r.id };
        try { sessionStorage.setItem(PI_KEY, JSON.stringify(v)); } catch { /* ignore */ }
        setPi(v);
      })
      .catch((e) => live && setPiError(e.message || 'Card payment is unavailable right now.'));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete, b.ref]);

  async function save(status, piId) {
    setBusy(status);
    setSaveError(null);
    try {
      await finishBooking(navigate, b, status, piId);
    } catch (e) {
      setBusy('');
      if (e.status === 409) {
        setSaveError({ msg: 'Sorry — that time window was just booked by someone else. Please pick another window.', slot: true });
      } else if (status === 'Paid') {
        setSaveError({ msg: `Your payment went through, but we couldn’t save the booking (${e.message}). Tap “Try again”, or call ${BUSINESS.phoneDisplay} and mention reference ${b.ref}.`, retry: piId });
      } else {
        setSaveError({ msg: e.message || 'We couldn’t save your booking. Please try again or call us.' });
      }
    }
  }

  const options = useMemo(() => (pi ? { clientSecret: pi.clientSecret, appearance: APPEARANCE, fonts: FONTS } : null), [pi]);

  if (returnedPi && busy) {
    return (
      <section className="checkout"><div className="container"><p className="checkout__finalizing">Finalizing your booking…</p></div></section>
    );
  }
  if (!complete && !returnedPi) return null;

  return (
    <section className="checkout">
      <div className="container">
        <ol className="crumbs" aria-label="Booking progress">
          <li className="is-done"><Link to="/book?step=2"><Check width={14} height={14} /> Package</Link></li>
          <li className="is-done"><Link to="/book?step=3"><Check width={14} height={14} /> Home</Link></li>
          <li className="is-done"><Link to="/book?step=4"><Check width={14} height={14} /> Schedule</Link></li>
          <li className="is-done"><Link to="/book?step=6"><Check width={14} height={14} /> Info</Link></li>
          <li className="is-current" aria-current="step">Checkout</li>
        </ol>

        <div className="checkout__head">
          <h1 className="checkout__title">Reserve your install</h1>
          <p className="checkout__sub">A {money(DEPOSIT)} reservation deposit holds your date and is applied to your final invoice.</p>
        </div>

        {saveError && (
          <div className="alert" role="alert">
            <p>{saveError.msg}</p>
            {saveError.slot && <Link to="/book?step=5" className="btn btn--onyx btn--sm">Pick another window</Link>}
            {saveError.retry && <button type="button" className="btn btn--onyx btn--sm" onClick={() => save('Paid', saveError.retry)}>Try again</button>}
          </div>
        )}

        <div className="checkout__grid">
          <div className="paycard">
            <div className="paycard__head">
              <div>
                <p className="paycard__k">Reservation deposit</p>
                <p className="paycard__amt">{money(DEPOSIT)}</p>
              </div>
              <span className="paycard__lock"><Lock width={16} height={16} /> Secured by Stripe</span>
            </div>
            {options ? (
              <Elements key={pi.clientSecret} stripe={getStripe()} options={options}>
                <PayForm b={b} onPaid={(id) => save('Paid', id)} busy={busy === 'Paid'} />
              </Elements>
            ) : (
              <div className="paycard__state">
                {!stripeReady || !apiConfigured()
                  ? <p>Card payment isn’t connected yet. You can still reserve below and pay at the visit.</p>
                  : piError
                    ? <p>{piError} You can still reserve below and pay at the visit.</p>
                    : <p className="paycard__loading"><span className="spinner" aria-hidden="true" /> Loading secure payment…</p>}
              </div>
            )}
            <p className="paycard__fine">Applied to your final invoice. Your final price is confirmed at the on-site visit.</p>
          </div>

          <Summary b={b} />
        </div>

        <p className="paylater">
          <button type="button" className="paylater__link" onClick={() => save('Pay Later')} disabled={!!busy}>
            {busy === 'Pay Later' ? 'Saving your booking…' : 'I’ll pay at the visit'}
          </button>
        </p>
      </div>
    </section>
  );
}

function PayForm({ b, onPaid, busy }) {
  const stripe = useStripe();
  const elements = useElements();
  const [err, setErr] = useState('');
  const [working, setWorking] = useState(false);
  const [express, setExpress] = useState(false);
  const returnUrl = `${window.location.origin}/checkout`;

  async function confirm() {
    if (!stripe || !elements) return;
    setErr('');
    setWorking(true);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl, receipt_email: b.email || undefined },
      redirect: 'if_required',
    });
    if (error) {
      setErr(error.message || 'Payment failed. Please try another card.');
      setWorking(false);
      return;
    }
    if (paymentIntent && ['succeeded', 'processing', 'requires_capture'].includes(paymentIntent.status)) {
      onPaid(paymentIntent.id);
    } else {
      setErr('Payment wasn’t completed. Please try again.');
      setWorking(false);
    }
  }

  const disabled = !stripe || working || busy;
  return (
    <form className="payform" onSubmit={(e) => { e.preventDefault(); confirm(); }}>
      <div className={`payform__express${express ? '' : ' is-empty'}`}>
        <ExpressCheckoutElement
          onConfirm={confirm}
          onReady={({ availablePaymentMethods }) => setExpress(Boolean(availablePaymentMethods))}
          options={{ buttonHeight: 48 }}
        />
      </div>
      {express && <p className="payform__or"><span>or pay by card</span></p>}
      <PaymentElement options={{ layout: 'tabs', defaultValues: { billingDetails: { name: b.name, email: b.email, phone: b.phone } } }} />
      {err && <p className="formerr" role="alert">{err}</p>}
      <button type="submit" className="btn btn--gold btn--lg btn--block" disabled={disabled}>
        {working || busy ? 'Processing…' : <>Pay {money(DEPOSIT)} deposit</>}
      </button>
    </form>
  );
}

function Summary({ b }) {
  const t = typeOf(b);
  const p = packageOf(b);
  const w = windowOf(b);
  const adds = selectedAddons(b);
  const est = estimate(b);
  return (
    <aside className="summary" aria-label="Order summary">
      <p className="summary__title">Order summary</p>
      <ul className="summary__lines">
        <li><span>{t?.name} · {p?.name}</span><span className="summary__muted">{t?.id === 'permanent' || p?.price == null ? 'Online quoting' : money(p.price)}</span></li>
        <li><span>{b.stories}-Story home</span><span className="summary__muted">{b.stories === '2' ? '+50%' : 'Included'}</span></li>
        {adds.map((a) => (
          <li key={a.id}><span>{a.name}</span><span className="summary__muted">{a.price == null ? 'Online quoting' : `+${money(a.price)}`}</span></li>
        ))}
      </ul>
      <dl className="summary__meta">
        <div><dt><Calendar width={16} height={16} /> Install date</dt><dd>{fmtLong(b.date)}</dd></div>
        <div><dt><Clock width={16} height={16} /> Time window</dt><dd>{w?.label} (Pacific)</dd></div>
        <div><dt><Pin width={16} height={16} /> Service address</dt><dd>{b.address}</dd></div>
        <div><dt><House width={16} height={16} /> Contact</dt><dd>{b.name} · {formatPhone(b.phone)}<br />{b.email}</dd></div>
      </dl>
      <div className="summary__row"><span>Estimate</span><span>{est.text}</span></div>
      <div className="summary__row summary__row--due"><span>Due today</span><span>{money(DEPOSIT)}</span></div>
      <p className="summary__fine">Deposit applied to your final invoice.</p>
    </aside>
  );
}
