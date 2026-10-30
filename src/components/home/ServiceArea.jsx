import { BUSINESS, CITIES } from '../../config/site.js';
import { usePowerOn } from '../../lib/hooks.js';
import { Phone, Pin } from '../Icons.jsx';

/* Typographic city index — home base in gold, neighbours separated by bulbs. */
export default function ServiceArea() {
  const ref = usePowerOn();
  return (
    <section id="area" className="section section--stone area" ref={ref} aria-labelledby="area-title">
      <div className="container area__grid">
        <div className="area__intro" data-po>
          <p className="eyebrow">05 · Service area</p>
          <h2 id="area-title" className="h-section">Based in {BUSINESS.city}. <em>Lighting the hills around it.</em></h2>
          <p className="area__text">
            We install across {BUSINESS.city} and the neighboring cities below. Don’t see yours? Give us a call and ask.
          </p>
          <a href={BUSINESS.phoneHref} className="btn btn--onyx"><Phone width={18} height={18} /> {BUSINESS.phoneDisplay}</a>
        </div>
        <ul className="cityindex" data-po aria-label="Cities we serve">
          {CITIES.map((c, i) => (
            <li key={c} className={i === 0 ? 'is-home' : ''}>
              {i === 0 && <Pin width={22} height={22} className="cityindex__pin" />}
              {c}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
