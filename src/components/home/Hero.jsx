import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BUSINESS, HERO_SLIDES } from '../../config/site.js';
import { usePrefersReducedMotion } from '../../lib/hooks.js';
import { fmtMonDay, fmtShort } from '../../lib/time.js';
import { Arrow, Phone } from '../Icons.jsx';

const DURATION = 7000;

export default function Hero({ earliest, season }) {
  const reduced = usePrefersReducedMotion();
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (reduced || paused) return undefined;
    const t = setTimeout(() => setIdx((i) => (i + 1) % HERO_SLIDES.length), DURATION);
    return () => clearTimeout(t);
  }, [idx, reduced, paused]);

  return (
    <section id="hero" className={`hero${reduced ? ' hero--still' : ''}`} aria-label="Introduction">
      <div className="hero__slides" aria-hidden="true">
        {HERO_SLIDES.map((s, i) => (
          <div key={s.src} className={`hero__slide${i === idx ? ' is-active' : ''}`}>
            <img src={s.src} alt="" style={{ objectPosition: s.pos }} loading={i === 0 ? 'eager' : 'lazy'} decoding="async" />
          </div>
        ))}
      </div>
      <div className="hero__shade" aria-hidden="true" />

      <div className="container hero__content">
        <p className="eyebrow eyebrow--gold">{BUSINESS.city}, CA · Permanent &amp; holiday lighting</p>
        <h1 className="hero__title">
          Light it once.
          <br />
          <em>Love it</em> every night.
        </h1>
        <p className="hero__lead">
          Permanent roofline lighting and full-service Christmas installs for {BUSINESS.city} homes — designed, installed and looked after by Brightstone.
        </p>
        <div className="btn-row">
          <Link to="/book" className="btn btn--gold btn--lg">Book Online <Arrow width={20} height={20} /></Link>
          <a href={BUSINESS.phoneHref} className="btn btn--ghost-light btn--lg"><Phone width={20} height={20} /> {BUSINESS.phoneDisplay}</a>
        </div>
      </div>

      <div className="container hero__foot">
        <div className="ledger" role="list">
          <Link to="/book?type=permanent" className="ledger__cell" role="listitem">
            <span className="ledger__k">Permanent</span>
            <span className="ledger__v">Year-round roofline lighting</span>
            <span className="ledger__go">Start <Arrow width={16} height={16} /></span>
          </Link>
          <Link to="/book?type=seasonal" className="ledger__cell" role="listitem">
            <span className="ledger__k">Seasonal</span>
            <span className="ledger__v">Install · maintain · takedown</span>
            <span className="ledger__go">Start <Arrow width={16} height={16} /></span>
          </Link>
          <div className="ledger__cell ledger__cell--info" role="listitem">
            <span className="ledger__k">Season {fmtMonDay(season.start)} – {fmtMonDay(season.end)}</span>
            <span className="ledger__v">{earliest ? <>Earliest open: <span className="gold">{fmtShort(earliest)}</span></> : 'Checking open dates…'}</span>
          </div>
        </div>

        <div className="peaks" role="group" aria-label="Choose a photo" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          {HERO_SLIDES.map((s, i) => (
            <button
              key={s.src}
              type="button"
              className={`peak${i === idx ? ' is-active' : ''}`}
              style={{ '--dur': `${DURATION}ms` }}
              onClick={() => setIdx(i)}
              aria-label={`Show ${s.label}`}
              aria-pressed={i === idx}
            >
              <svg viewBox="0 0 60 24" aria-hidden="true"><path className="peak__base" d="M2 22 30 3l28 19" /><path className="peak__fill" d="M2 22 30 3l28 19" pathLength="1" /></svg>
              <span className="peak__label">{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
