import { useMemo, useState } from 'react';
import { GALLERY, GALLERY_FILTERS } from '../../config/site.js';
import { usePowerOn } from '../../lib/hooks.js';

export default function Gallery() {
  const ref = usePowerOn();
  const [filter, setFilter] = useState('all');
  const [openIdx, setOpenIdx] = useState(-1);
  const items = useMemo(
    () => (filter === 'all' ? GALLERY : GALLERY.filter((g) => g.tags.includes(filter))),
    [filter],
  );
  const counts = useMemo(() => {
    const c = { all: GALLERY.length };
    GALLERY.forEach((g) => g.tags.forEach((t) => { c[t] = (c[t] || 0) + 1; }));
    return c;
  }, []);

  return (
    <section id="gallery" className="section section--onyx gallery" ref={ref} aria-labelledby="gallery-title">
      <div className="container">
        <div className="sec-head sec-head--split" data-po>
          <div>
            <p className="eyebrow eyebrow--gold">01 · Gallery</p>
            <h2 id="gallery-title" className="h-section">After dark, every <em>line counts.</em></h2>
          </div>
          <p className="sec-head__aside">
            Rooflines, gables, palms and pathways — filter by lighting style.
          </p>
        </div>

        <div className="chips" role="toolbar" aria-label="Filter gallery by style">
          {GALLERY_FILTERS.filter((f) => counts[f.id]).map((f) => (
            <button
              key={f.id}
              type="button"
              className={`chip${filter === f.id ? ' is-active' : ''}`}
              aria-pressed={filter === f.id}
              onClick={() => { setFilter(f.id); setOpenIdx(-1); }}
            >
              {f.label}<span className="chip__n">{counts[f.id]}</span>
            </button>
          ))}
        </div>

        <ul className="masonry" aria-live="polite">
          {items.map((g, i) => (
            <li key={g.src} className={`masonry__item${openIdx === i ? ' is-open' : ''}`}>
              <button
                type="button"
                className="masonry__btn"
                aria-expanded={openIdx === i}
                onClick={() => setOpenIdx(openIdx === i ? -1 : i)}
              >
                <img src={g.src} alt={`${g.title} — ${g.caption}`} width={g.w} height={g.h} loading="lazy" decoding="async" />
                {g.preview && <span className="masonry__tag">Design preview</span>}
                <span className="masonry__cap">
                  <span className="masonry__title">{g.title}</span>
                  <span className="masonry__text">{g.caption}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
