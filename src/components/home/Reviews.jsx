import { BUSINESS, DEPOSIT, REVIEWS, TAKEDOWN } from '../../config/site.js';
import { usePowerOn } from '../../lib/hooks.js';

/* Real reviews only (src/config/site.js → REVIEWS). Until there are some, the section shows
   service commitments taken straight from the package terms — no ratings or quotes are invented. */
const PROMISES = [
  { k: 'Quote first', v: 'Starting prices online, and your final price confirmed at the on-site visit — before any work begins.' },
  { k: 'Deposit counts', v: `Your $${DEPOSIT} reservation deposit is applied to your final invoice. Or pay at the visit.` },
  { k: 'Looked after', v: `Seasonal installs include in-season maintenance and bulb replacement, then takedown in ${TAKEDOWN}.` },
];

export default function Reviews() {
  const ref = usePowerOn();
  const has = REVIEWS.length > 0;
  return (
    <section id="reviews" className="section section--graphite reviews" ref={ref} aria-labelledby="reviews-title">
      <div className="container">
        <div className="sec-head sec-head--split" data-po>
          <div>
            <p className="eyebrow eyebrow--gold">03 · Reviews</p>
            <h2 id="reviews-title" className="h-section">{has ? <>What {BUSINESS.city} <em>is saying.</em></> : <>What you can <em>hold us to.</em></>}</h2>
          </div>
          <p className="sec-head__aside">
            {has
              ? 'Straight from our customers.'
              : `Reviews from ${BUSINESS.city} homeowners will appear here after our first installs.`}
          </p>
        </div>

        {has ? (
          <ul className="quotes">
            {REVIEWS.map((r, i) => (
              <li key={i} className="quote" data-po>
                {r.rating ? <span className="quote__stars" aria-label={`${r.rating} out of 5 stars`}>{'★'.repeat(r.rating)}</span> : null}
                <blockquote className="quote__text">“{r.text}”</blockquote>
                <p className="quote__who">{r.name}{r.city ? ` · ${r.city}` : ''}</p>
              </li>
            ))}
          </ul>
        ) : (
          <ol className="promises">
            {PROMISES.map((p, i) => (
              <li key={p.k} className="promise" data-po>
                <span className="promise__n">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="promise__k">{p.k}</h3>
                <p className="promise__v">{p.v}</p>
              </li>
            ))}
          </ol>
        )}
        {BUSINESS.googleReviewUrl && (
          <p className="reviews__link"><a href={BUSINESS.googleReviewUrl} target="_blank" rel="noreferrer">Read or leave a review on Google →</a></p>
        )}
      </div>
    </section>
  );
}
