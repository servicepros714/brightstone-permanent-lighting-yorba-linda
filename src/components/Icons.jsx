/* Inline stroke icons (24px grid, currentColor). */
const base = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: 'false' };

export const Phone = (p) => (
  <svg {...base} {...p}><path d="M5 3h3.2l1.6 4-2 1.3a11 11 0 0 0 7.9 7.9l1.3-2 4 1.6V19a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2Z" /></svg>
);
export const Calendar = (p) => (
  <svg {...base} {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
);
export const Arrow = (p) => (
  <svg {...base} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const Back = (p) => (
  <svg {...base} {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
);
export const Check = (p) => (
  <svg {...base} {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
);
export const Close = (p) => (
  <svg {...base} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const Pin = (p) => (
  <svg {...base} {...p}><path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12Z" /><circle cx="12" cy="9" r="2.5" /></svg>
);
export const Clock = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const Lock = (p) => (
  <svg {...base} {...p}><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
);
export const Chevron = (p) => (
  <svg {...base} {...p}><path d="m6 9 6 6 6-6" /></svg>
);
export const Plus = (p) => (
  <svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>
);
export const House = (p) => (
  <svg {...base} {...p}><path d="M3 11 12 4l9 7" /><path d="M5 10v10h14V10" /><path d="M10 20v-5h4v5" /></svg>
);
export const Bulb = (p) => (
  <svg {...base} {...p}><path d="M9 18h6M10 21h4M8.5 14.5A6 6 0 1 1 15.5 14.5c-.8.7-1.5 1.6-1.5 2.5h-4c0-.9-.7-1.8-1.5-2.5Z" /></svg>
);
export const Tree = (p) => (
  <svg {...base} {...p}><path d="M12 3 6 12h3l-4 6h14l-4-6h3L12 3ZM12 18v3" /></svg>
);
export const Wreath = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="3.5" /><path d="M10 18.5 9 21l3-1 3 1-1-2.5" /></svg>
);
export const PathLights = (p) => (
  <svg {...base} {...p}><path d="M6 21V11M18 21V11M12 21v-6" /><circle cx="6" cy="9" r="2" /><circle cx="18" cy="9" r="2" /><circle cx="12" cy="13" r="2" /></svg>
);
export const Box = (p) => (
  <svg {...base} {...p}><path d="M3 8 12 3l9 5v8l-9 5-9-5V8Z" /><path d="m3 8 9 5 9-5M12 13v8" /></svg>
);
export const Stories = (p) => (
  <svg {...base} {...p}><path d="M4 10 12 4l8 6" /><path d="M6 9v12h12V9" /><path d="M6 15h12" /></svg>
);
export const Sun = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
);
export const Loop = (p) => (
  <svg {...base} {...p}><path d="M7 8.5c-2 0-3.5 1.6-3.5 3.5S5 15.5 7 15.5c3.5 0 6.5-7 10-7 2 0 3.5 1.6 3.5 3.5s-1.5 3.5-3.5 3.5c-3.5 0-6.5-7-10-7Z" /></svg>
);
export const Snow = (p) => (
  <svg {...base} {...p}><path d="M12 2v20M4 6.5l16 11M20 6.5l-16 11" /></svg>
);

export const ADDON_ICONS = { tree: Tree, wreath: Wreath, path: PathLights, bulb: Bulb, box: Box, stories: Stories };
