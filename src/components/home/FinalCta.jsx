import { Link } from 'react-router-dom';
import { BUSINESS, DEPOSIT } from '../../config/site.js';
import { usePowerOn } from '../../lib/hooks.js';
import { fmtShort } from '../../lib/time.js';
import { Arrow, Phone } from '../Icons.jsx';

export default function FinalCta({ earliest }) {
  const ref = usePowerOn();
  return (
    <section className="section section--onyx finale" ref={ref} aria-labelledby="finale-title">
      <div className="container">
        <div className="marquee-frame" data-po>
          <svg className="marquee-bulbs" aria-hidden="true">
            <rect x="0" y="0" width="100%" height="100%" rx="24" />
            <rect className="alt" x="0" y="0" width="100%" height="100%" rx="24" />
          </svg>
          <p className="eyebrow eyebrow--gold">Ready when you are</p>
          <h2 id="finale-title" className="h-display">Flip the switch on <em>your</em> roofline.</h2>
          <p className="finale__lead">
            Choose permanent or seasonal, pick a date{earliest ? ` (the earliest open is ${fmtShort(earliest)})` : ''} and hold it with a ${DEPOSIT} deposit that’s applied to your invoice.
          </p>
          <div className="btn-row btn-row--center">
            <Link to="/book" className="btn btn--gold btn--lg">Book Online <Arrow width={20} height={20} /></Link>
            <a href={BUSINESS.phoneHref} className="btn btn--ghost-light btn--lg"><Phone width={20} height={20} /> Call {BUSINESS.phoneDisplay}</a>
          </div>
        </div>
      </div>
    </section>
  );
}
