import { Link } from 'react-router-dom';
import { ADDONS, DEPOSIT, LIGHTING_TYPES, PACKAGES, PERMANENT_ROW, TWO_STORY_PERCENT } from '../../config/site.js';
import { money } from '../../lib/booking.js';
import { usePowerOn } from '../../lib/hooks.js';
import { ADDON_ICONS, Arrow, Check, Loop, Snow, Stories } from '../Icons.jsx';

const priceText = (p) => (p == null ? 'Online quoting' : money(p));

export default function Packages() {
  const ref = usePowerOn();
  const rows = [
    ...PACKAGES.map((p, i) => ({ key: p.id, n: i + 1, kind: 'Seasonal', name: p.name, price: priceText(p.price), starting: p.price != null, features: p.features })),
    { key: 'permanent', n: PACKAGES.length + 1, kind: 'Permanent', name: PERMANENT_ROW.name, price: 'Online quoting', starting: false, features: PERMANENT_ROW.features },
  ];
  const addons = [
    { id: 'two-story', name: 'Two-story home', price: `+${TWO_STORY_PERCENT}% of package price`, Icon: Stories },
    ...ADDONS.map((a) => ({ id: a.id, name: a.name, price: a.price == null ? 'Online quoting' : (a.id === 'own-lights' ? money(a.price) : `+${money(a.price)}`), Icon: ADDON_ICONS[a.icon], note: a.seasonalOnly ? 'Seasonal only' : '' })),
  ];

  return (
    <section id="packages" className="section section--stone packages" ref={ref} aria-labelledby="packages-title">
      <div className="container">
        <div className="sec-head" data-po>
          <p className="eyebrow">02 · Packages</p>
          <h2 id="packages-title" className="h-section">Two ways to light it. <em>One crew.</em></h2>
        </div>

        <div className="ways">
          {LIGHTING_TYPES.map((t) => (
            <article key={t.id} className={`way way--${t.id}`} data-po>
              <span className="way__icon" aria-hidden="true">{t.id === 'permanent' ? <Loop /> : <Snow />}</span>
              <div>
                <h3 className="way__name">{t.name}</h3>
                <p className="way__tag">{t.tagline}</p>
                <p className="way__blurb">{t.blurb}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="ledgerrows" role="list">
          {rows.map((r) => (
            <article key={r.key} className={`lrow${r.kind === 'Permanent' ? ' lrow--perm' : ''}`} role="listitem" data-po>
              <div className="lrow__id">
                <span className="lrow__n">{String(r.n).padStart(2, '0')}</span>
                <span className="lrow__kind">{r.kind}</span>
                <h3 className="lrow__name">{r.name}</h3>
              </div>
              <ul className="lrow__list">
                {r.features.map((f) => (
                  <li key={f}><Check width={18} height={18} /><span>{f}</span></li>
                ))}
              </ul>
              <div className="lrow__price">
                <span className="lrow__from">{r.starting ? 'Starting at' : 'Price'}</span>
                <span className="lrow__amt">{r.price}</span>
              </div>
            </article>
          ))}
        </div>

        <div className="addons" data-po>
          <div className="addons__head">
            <h3 className="addons__title">Add-ons</h3>
            <p className="addons__sub">Picked in booking — swipe for more</p>
          </div>
          <ul className="rail" tabIndex={0} aria-label="Add-ons">
            {addons.map(({ id, name, price, Icon, note }) => (
              <li key={id} className="rail__card">
                <span className="rail__icon" aria-hidden="true"><Icon /></span>
                <span className="rail__name">{name}</span>
                <span className="rail__price">{price}</span>
                {note && <span className="rail__note">{note}</span>}
              </li>
            ))}
          </ul>
        </div>

        <div className="packages__cta" data-po>
          <Link to="/book" className="btn btn--onyx btn--lg">Book Now <Arrow width={20} height={20} /></Link>
          <p className="packages__fine">
            Prices shown are “starting at”; your final price is confirmed at the on-site visit. A ${DEPOSIT} reservation deposit holds your date and is applied to your final invoice.
          </p>
        </div>
      </div>
    </section>
  );
}
