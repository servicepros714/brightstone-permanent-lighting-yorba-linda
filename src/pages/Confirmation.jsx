import { Link } from 'react-router-dom';
import { BUSINESS, DEPOSIT } from '../config/site.js';
import { CONFIRM_KEY, estimate, homeSummary, money, windowOf } from '../lib/booking.js';
import { fmtLong } from '../lib/time.js';
import { Check, Phone } from '../components/Icons.jsx';

function readSnap() {
  try { return JSON.parse(sessionStorage.getItem(CONFIRM_KEY) || 'null'); } catch { return null; }
}

export default function Confirmation() {
  const snap = readSnap();
  if (!snap) {
    return (
      <section className="confirm">
        <div className="container confirm__inner">
          <h1 className="confirm__title">No booking to show</h1>
          <p className="confirm__lead">Start a new booking, or call us and we’ll help.</p>
          <div className="btn-row btn-row--center">
            <Link to="/book" className="btn btn--gold">Book online</Link>
            <a href={BUSINESS.phoneHref} className="btn btn--line"><Phone width={18} height={18} /> {BUSINESS.phoneDisplay}</a>
          </div>
        </div>
      </section>
    );
  }
  const b = snap.booking;
  const w = windowOf(b);
  const paid = snap.paymentStatus === 'Paid';
  return (
    <section className="confirm">
      <div className="container confirm__inner">
        <span className="confirm__badge" aria-hidden="true"><Check width={34} height={34} /></span>
        <p className="eyebrow">Booking {snap.id}</p>
        <h1 className="confirm__title">You’re on the install calendar.</h1>
        <p className="confirm__lead">
          {snap.conflict
            ? 'Your deposit went through. That window was booked at the same moment, so we’ll call you shortly to confirm your install time.'
            : `We’ll reach out to confirm your on-site visit. A copy of your details is below.`}
        </p>

        <dl className="ticket">
          <div><dt>Install date</dt><dd>{fmtLong(b.date)}</dd></div>
          <div><dt>Time window</dt><dd>{w?.label} (Pacific)</dd></div>
          <div><dt>Your home</dt><dd>{homeSummary(b)}</dd></div>
          <div><dt>Address</dt><dd>{b.address}</dd></div>
          <div><dt>Estimate</dt><dd>{estimate(b).text}</dd></div>
          <div><dt>Deposit</dt><dd>{paid ? `${money(DEPOSIT)} paid — applied to your invoice` : 'Pay at the visit'}</dd></div>
        </dl>

        <div className="btn-row btn-row--center">
          <Link to="/" className="btn btn--gold">Back to home</Link>
          <a href={BUSINESS.phoneHref} className="btn btn--line"><Phone width={18} height={18} /> Questions? {BUSINESS.phoneDisplay}</a>
        </div>
      </div>
    </section>
  );
}
