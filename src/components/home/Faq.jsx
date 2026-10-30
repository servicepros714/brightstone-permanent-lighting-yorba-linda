import { useState } from 'react';
import { BUSINESS, FAQ } from '../../config/site.js';
import { usePowerOn } from '../../lib/hooks.js';
import { Plus } from '../Icons.jsx';

export default function Faq() {
  const ref = usePowerOn();
  const [open, setOpen] = useState(0);
  const half = Math.ceil(FAQ.length / 2);
  const cols = [FAQ.slice(0, half), FAQ.slice(half)];
  return (
    <section id="faq" className="section section--stone faq" ref={ref} aria-labelledby="faq-title">
      <div className="container">
        <div className="sec-head sec-head--split" data-po>
          <div>
            <p className="eyebrow">07 · FAQ</p>
            <h2 id="faq-title" className="h-section">Good questions, <em>straight answers.</em></h2>
          </div>
          <p className="sec-head__aside">Still wondering? Call <a href={BUSINESS.phoneHref}>{BUSINESS.phoneDisplay}</a>.</p>
        </div>
        <div className="faq__cols">
          {cols.map((col, c) => (
            <div key={c} className="faq__col">
              {col.map((item, j) => {
                const i = c * half + j;
                const isOpen = open === i;
                return (
                  <div key={item.q} className={`qa${isOpen ? ' is-open' : ''}`} data-po>
                    <h3 className="qa__h">
                      <button type="button" className="qa__q" aria-expanded={isOpen} aria-controls={`qa-${i}`} id={`qa-btn-${i}`} onClick={() => setOpen(isOpen ? -1 : i)}>
                        <span className="qa__n">{String(i + 1).padStart(2, '0')}</span>
                        <span className="qa__text">{item.q}</span>
                        <span className="qa__icon" aria-hidden="true"><Plus width={20} height={20} /></span>
                      </button>
                    </h3>
                    <div className="qa__a" id={`qa-${i}`} role="region" aria-labelledby={`qa-btn-${i}`} hidden={!isOpen}>
                      <p>{item.a}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
