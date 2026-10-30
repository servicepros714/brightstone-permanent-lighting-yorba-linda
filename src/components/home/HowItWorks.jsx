import { STEPS_HOW } from '../../config/site.js';
import { usePowerOn } from '../../lib/hooks.js';

/* Four rocker switches that flip on, one after another, as the row scrolls into view. */
export default function HowItWorks() {
  const ref = usePowerOn();
  return (
    <section id="how" className="section section--onyx how" ref={ref} aria-labelledby="how-title">
      <div className="container">
        <div className="sec-head" data-po>
          <p className="eyebrow eyebrow--gold">04 · How it works</p>
          <h2 id="how-title" className="h-section">Four switches <em>to a lit home.</em></h2>
        </div>
        <ol className="switches">
          {STEPS_HOW.map((s, i) => (
            <li key={s.id} className="switch" data-po>
              <div className="switch__plate" aria-hidden="true">
                <span className="switch__rocker"><i /></span>
                <span className="switch__led" />
              </div>
              <div className="switch__body">
                <span className="switch__n">Step {i + 1}</span>
                <h3 className="switch__title">{s.title}</h3>
                <p className="switch__text">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
