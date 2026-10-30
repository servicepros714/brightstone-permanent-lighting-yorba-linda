import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePowerOn } from '../../lib/hooks.js';
import { dateOpen, fmtLong, fmtMonDay, fmtShort, parseIso, seasonDates, todayPacific, weekday } from '../../lib/time.js';
import { Arrow } from '../Icons.jsx';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* Day-by-day heat strip of the install season, built from live Worker availability. */
export default function SeasonStrip({ season, full, earliest, loaded }) {
  const ref = usePowerOn();
  const navigate = useNavigate();
  const track = useRef(null);
  const today = todayPacific();
  // On narrow screens the strip scrolls sideways — start it at the first open day, not at Oct 20.
  useEffect(() => {
    const el = track.current;
    if (!el || !earliest || el.scrollWidth <= el.clientWidth) return;
    const cell = el.querySelector(`[data-date="${earliest}"]`);
    if (cell) el.scrollLeft = Math.max(0, cell.offsetLeft - el.offsetLeft - 60);
  }, [earliest]);
  const fullSet = new Set(full);
  const days = seasonDates(season).map((d) => {
    let status = 'open';
    if (d < today || !dateOpen(d)) status = 'closed';
    else if (fullSet.has(d)) status = 'full';
    return { d, status, isToday: d === today, monthStart: parseIso(d).d === 1 || d === season.start, weekend: [0, 6].includes(weekday(d)) };
  });
  const openCount = days.filter((x) => x.status === 'open').length;
  const started = today >= season.start;

  return (
    <section id="season" className="section section--onyx season" ref={ref} aria-labelledby="season-title">
      <div className="container">
        <div className="sec-head sec-head--split" data-po>
          <div>
            <p className="eyebrow eyebrow--gold">06 · The {season.year} season</p>
            <h2 id="season-title" className="h-section">Install days are <em>finite.</em></h2>
          </div>
          <p className="sec-head__aside">
            We install {fmtMonDay(season.start)} through {fmtMonDay(season.end)}, two windows a day. Book early for the date you want — tap any open day to start.
          </p>
        </div>

        <div className="stats" data-po>
          <div className="stat">
            <span className="stat__k">Season</span>
            <span className="stat__v">{fmtMonDay(season.start)} – {fmtMonDay(season.end)}</span>
          </div>
          <div className="stat">
            <span className="stat__k">Earliest open install</span>
            <span className="stat__v stat__v--gold">{earliest ? fmtShort(earliest) : '—'}</span>
          </div>
          <div className="stat">
            <span className="stat__k">{started ? 'Open install days left' : 'Open install days'}</span>
            <span className="stat__v">{loaded ? openCount : '…'}</span>
          </div>
        </div>

        <div className="strip" data-po>
          <div className="strip__track" role="list" aria-label="Install season calendar" ref={track}>
            {days.map((x) => {
              const label = `${fmtLong(x.d)} — ${x.status === 'open' ? 'open' : x.status === 'full' ? 'fully booked' : 'closed'}`;
              const cls = `day day--${x.status}${x.isToday ? ' is-today' : ''}${x.monthStart ? ' is-mstart' : ''}${x.weekend ? ' is-wknd' : ''}`;
              return (
                <div key={x.d} className="strip__cell" role="listitem" data-date={x.d}>
                  {x.monthStart && <span className="strip__month">{MONTHS[parseIso(x.d).m - 1]}</span>}
                  {x.status === 'open' ? (
                    <button type="button" className={cls} title={label} aria-label={label} onClick={() => navigate(`/book?date=${x.d}`)}>
                      <span className="day__num">{parseIso(x.d).d}</span>
                    </button>
                  ) : (
                    <span className={cls} title={label} aria-label={label}><span className="day__num">{parseIso(x.d).d}</span></span>
                  )}
                </div>
              );
            })}
          </div>
          <ul className="legend">
            <li><i className="day day--open" /> Open</li>
            <li><i className="day day--full" /> Fully booked</li>
            <li><i className="day day--closed" /> Closed (past or within 48 hours)</li>
            <li><i className="legend__today" /> Today</li>
          </ul>
        </div>

        <div className="season__cta" data-po>
          <Link to="/book" className="btn btn--gold btn--lg">Reserve a date <Arrow width={20} height={20} /></Link>
        </div>
      </div>
    </section>
  );
}
