import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BUSINESS } from '../config/site.js';
import { usePrefersReducedMotion, useScrollLock } from '../lib/hooks.js';
import { Calendar, Close, Lock, Phone } from './Icons.jsx';

export const SECTIONS = [
  { id: 'gallery', label: 'Gallery' },
  { id: 'packages', label: 'Packages' },
  { id: 'how', label: 'How it works' },
  { id: 'area', label: 'Service area' },
  { id: 'faq', label: 'FAQ' },
];
export const FOCUS_ROUTES = ['/book', '/checkout', '/confirmation'];

export function Logo({ size = 'sm', className = '' }) {
  const file = size === 'lg' ? 'logo' : 'logo-480';
  return (
    <picture className={className}>
      <source srcSet={`/brand/${file}.webp`} type="image/webp" />
      <img src={`/brand/${file}.png`} alt={BUSINESS.name} width={size === 'lg' ? 900 : 480} height={size === 'lg' ? 428 : 228} decoding="async" />
    </picture>
  );
}

/** Scrolls to a homepage section, routing home first when needed. */
export function useSectionNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();
  return useCallback(
    (id) => {
      if (pathname === '/') {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
        window.history.replaceState(window.history.state, '', `#${id}`);
      } else {
        navigate(`/#${id}`);
      }
    },
    [pathname, navigate, reduced],
  );
}

export function Nav() {
  const { pathname } = useLocation();
  const focus = FOCUS_ROUTES.includes(pathname);
  const goSection = useSectionNav();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('');
  const closeMenu = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  // Highlight the section in view (home only).
  useEffect(() => {
    if (pathname !== '/' || !('IntersectionObserver' in window)) return undefined;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    );
    const t = setTimeout(() => SECTIONS.forEach((s) => { const el = document.getElementById(s.id); if (el) io.observe(el); }), 50);
    return () => { clearTimeout(t); io.disconnect(); };
  }, [pathname]);

  return (
    <>
      <header className={`nav${scrolled ? ' is-scrolled' : ''}${focus ? ' nav--focus' : ''}`}>
        <div className="container nav__inner">
          <Link to="/" className="plaque" aria-label={`${BUSINESS.name} — home`}>
            <Logo />
          </Link>

          {!focus && (
            <nav className="nav__links" aria-label="Main">
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`/#${s.id}`}
                  className={`nav__link${active === s.id ? ' is-active' : ''}`}
                  onClick={(e) => { e.preventDefault(); goSection(s.id); }}
                >
                  {s.label}
                </a>
              ))}
            </nav>
          )}

          <div className="nav__actions">
            {focus && (
              <span className="nav__secure"><Lock width={16} height={16} /> Secure booking</span>
            )}
            <a href={BUSINESS.phoneHref} className="nav__call">
              <Phone width={18} height={18} />
              <span>{BUSINESS.phoneDisplay}</span>
            </a>
            {!focus && (
              <Link to="/book" className="btn btn--gold btn--sm nav__book">Book Online</Link>
            )}
            {!focus && (
              <button type="button" className="nav__menu" aria-expanded={open} aria-controls="menu-sheet" onClick={() => setOpen(true)}>
                <span className="nav__menu-bars" aria-hidden="true"><i /><i /><i /></span>
                Menu
              </button>
            )}
          </div>
        </div>
      </header>
      {!focus && <MenuSheet open={open} onClose={closeMenu} goSection={goSection} />}
    </>
  );
}

function MenuSheet({ open, onClose, goSection }) {
  useScrollLock(open);
  const panel = useRef(null);
  const wrap = useRef(null);
  // `inert` set directly so it behaves the same on React 18 and 19.
  useEffect(() => { if (wrap.current) wrap.current.inert = !open; }, [open]);
  useEffect(() => {
    if (!open) return undefined;
    const prevFocus = document.activeElement;
    const t = setTimeout(() => panel.current?.querySelector('button, a')?.focus(), 60);
    const key = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && panel.current) {
        const f = [...panel.current.querySelectorAll('a, button')];
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    };
    document.addEventListener('keydown', key);
    return () => { clearTimeout(t); document.removeEventListener('keydown', key); prevFocus?.focus?.(); };
  }, [open, onClose]);

  return (
    <div className={`sheet${open ? ' is-open' : ''}`} aria-hidden={!open} ref={wrap}>
      <button type="button" className="sheet__backdrop" tabIndex={-1} aria-label="Close menu" onClick={onClose} />
      <div className="sheet__panel" role="dialog" aria-modal="true" aria-label="Menu" id="menu-sheet" ref={panel}>
        <div className="sheet__grip" aria-hidden="true" />
        <div className="sheet__head">
          <span className="sheet__title">Menu</span>
          <button type="button" className="sheet__close" onClick={onClose} aria-label="Close menu"><Close /></button>
        </div>
        <ol className="sheet__links">
          {SECTIONS.map((s, i) => (
            <li key={s.id}>
              <a
                href={`/#${s.id}`}
                onClick={(e) => { e.preventDefault(); onClose(); setTimeout(() => goSection(s.id), 220); }}
              >
                <span className="sheet__num">{String(i + 1).padStart(2, '0')}</span>
                {s.label}
              </a>
            </li>
          ))}
        </ol>
        <div className="sheet__actions">
          <a href={BUSINESS.phoneHref} className="btn btn--ghost-dark"><Phone width={18} height={18} /> Call Now</a>
          <Link to="/book" className="btn btn--gold" onClick={onClose}><Calendar width={18} height={18} /> Book Online</Link>
        </div>
      </div>
    </div>
  );
}

/** Mobile Call / Book bar — slides in after the hero, hidden on booking routes. */
export function ActionBar() {
  const { pathname } = useLocation();
  const [show, setShow] = useState(false);
  const hidden = FOCUS_ROUTES.includes(pathname);
  useEffect(() => {
    if (hidden) return undefined;
    const on = () => {
      const hero = document.getElementById('hero');
      setShow(hero ? hero.getBoundingClientRect().bottom < 80 : window.scrollY > 480);
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); };
  }, [hidden, pathname]);
  if (hidden) return null;
  return (
    <div className={`actionbar${show ? ' is-shown' : ''}`} aria-hidden={!show}>
      <a href={BUSINESS.phoneHref} className="btn btn--ghost-light" tabIndex={show ? 0 : -1}><Phone width={18} height={18} /> Call Now</a>
      <Link to="/book" className="btn btn--gold" tabIndex={show ? 0 : -1}><Calendar width={18} height={18} /> Book Online</Link>
    </div>
  );
}

export function Footer() {
  const { pathname } = useLocation();
  const goSection = useSectionNav();
  if (pathname === '/book' || pathname === '/checkout') return null;
  const year = new Date().getFullYear();
  return (
    <footer className="foot">
      <div className="foot__grid">
        <div className="foot__gable">
          <Logo size="lg" className="foot__logo" />
          <p className="foot__line">Permanent roofline lighting and full-service Christmas installs for {BUSINESS.city} homes.</p>
          <Link to="/book" className="btn btn--onyx">Book your install <span aria-hidden="true">→</span></Link>
        </div>
        <div className="foot__index">
          <div>
            <p className="foot__label">Index</p>
            <ol className="foot__links">
              {SECTIONS.map((s, i) => (
                <li key={s.id}>
                  <a href={`/#${s.id}`} onClick={(e) => { e.preventDefault(); goSection(s.id); }}>
                    <span>{String(i + 1).padStart(2, '0')}</span>{s.label}
                  </a>
                </li>
              ))}
              <li><Link to="/book"><span>06</span>Book online</Link></li>
            </ol>
          </div>
          <div>
            <p className="foot__label">Contact</p>
            <a className="foot__phone" href={BUSINESS.phoneHref}>{BUSINESS.phoneDisplay}</a>
            <p className="foot__meta">{BUSINESS.city}, {BUSINESS.region}</p>
            <p className="foot__meta">Open {BUSINESS.hours}</p>
            <p className="foot__meta">Install season Oct 20 – Dec 20</p>
          </div>
        </div>
      </div>
      <div className="foot__legal">
        <span className="foot__bulbs" aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <i key={i} />)}</span>
        <p>© {year} {BUSINESS.name} · {BUSINESS.city}, {BUSINESS.region}</p>
        <p className="foot__policies"><Link to="/privacy">Privacy Policy</Link> · <Link to="/terms">Terms &amp; Conditions</Link></p>
      </div>
    </footer>
  );
}
