import { useEffect, useRef, useState } from 'react';

export function usePrefersReducedMotion() {
  const q = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia?.(q).matches);
  useEffect(() => {
    const mq = window.matchMedia?.(q);
    if (!mq) return undefined;
    const on = () => setReduced(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return reduced;
}

/**
 * "Power-on" reveal: elements with [data-po] inside the returned ref start dimmed and
 * switch on (brief flicker) the first time they scroll into view. Without IntersectionObserver
 * (or with reduced motion, handled in CSS) everything is simply on.
 */
export function usePowerOn() {
  const ref = useRef(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    const els = [...root.querySelectorAll('[data-po]')];
    if (root.hasAttribute('data-po')) els.unshift(root);
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-on'));
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-on');
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.12 },
    );
    els.forEach((el, i) => {
      el.style.setProperty('--po-delay', `${Math.min(i % 6, 5) * 90}ms`);
      io.observe(el);
    });
    return () => io.disconnect();
  }, []);
  return ref;
}

/** Locks page scroll while `on` (mobile sheet). */
export function useScrollLock(on) {
  useEffect(() => {
    if (!on) return undefined;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [on]);
}

/** Jumps to the top without smooth scrolling (route + step changes). */
export function scrollTopNow() {
  const html = document.documentElement;
  const prev = html.style.scrollBehavior;
  html.style.scrollBehavior = 'auto';
  window.scrollTo(0, 0);
  html.style.scrollBehavior = prev;
}
