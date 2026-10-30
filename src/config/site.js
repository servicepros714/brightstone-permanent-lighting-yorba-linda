/*
 * ─────────────────────────────────────────────────────────────
 *  Brightstone Permanent Lighting — business details & content
 *  Edit this file first. Prices set to `null` read "Online quoting".
 * ─────────────────────────────────────────────────────────────
 */

export const BUSINESS = {
  name: 'Brightstone Permanent Lighting',
  short: 'Brightstone',
  city: 'Yorba Linda',
  region: 'CA',
  // TODO: "555-555-555" is 9 digits — replace with the real 10-digit number (display + tel link).
  phoneDisplay: '555-555-555',
  phoneHref: 'tel:555555555',
  // TODO: add the Google Business Profile review link once the profile is live.
  googleReviewUrl: '',
};

/* Plumbing — must stay unique per site (see layout registry). */
export const SOURCE_TAG = 'brightstone-yorbalinda';
export const BOOKING_PREFIX = 'BSL-';

/* Reservation deposit (USD). Applied to the final invoice. Must match DEPOSIT_CENTS in worker/worker.js. */
export const DEPOSIT = 149;

/* Install season (Pacific time, inclusive). */
export const SEASON = { start: { month: 10, day: 20 }, end: { month: 12, day: 20 } };
export const LEAD_HOURS = 48;

/* `id` is the exact value stored in the D1 `time` column (en dash). `start` is the 24h start hour, Pacific. */
export const TIME_WINDOWS = [
  { id: '8AM–12PM', label: '8 AM – 12 PM', part: 'Morning', start: 8 },
  { id: '12PM–4PM', label: '12 PM – 4 PM', part: 'Afternoon', start: 12 },
];

/* TODO: confirm takedown timing with the crew. */
export const TAKEDOWN = 'the first two weeks of January';

/* Step 1 of booking. Permanent always shows "Online quoting". */
export const LIGHTING_TYPES = [
  {
    id: 'permanent',
    name: 'Permanent',
    tagline: 'Installed once, lit year-round',
    blurb: 'A low-profile lighting channel mounted along your roofline that stays up — no yearly install or takedown.',
  },
  {
    id: 'seasonal',
    name: 'Seasonal',
    tagline: 'Christmas install, maintained & taken down',
    blurb: 'Leased commercial-grade LEDs for the holidays: we design, install, maintain and take them down.',
  },
];

/* Step 2 of booking. `price: null` → "Online quoting". */
export const PACKAGES = [
  {
    id: 'front-only',
    name: 'Front Only',
    price: null,
    features: [
      'Professional design for the front of the home',
      'Commercial-grade LED lights (leased, no purchase needed)',
      'Roofline & gutter-line installation',
      'Timer setup',
      'In-season maintenance & bulb replacement',
      'Takedown after the holidays',
    ],
    // Shown instead of `features` when Permanent is picked in booking.
    permanentFeatures: [
      'Custom design for the front of the home',
      'Permanent channel along the front roofline & gutter line',
      'Professional installation',
    ],
  },
  {
    id: 'front-sides',
    name: 'Front & Sides',
    price: null,
    features: [
      'Everything in Front Only',
      'Side rooflines & gutters',
      'Expanded custom design',
    ],
    permanentFeatures: [
      'Everything in Front Only',
      'Side rooflines & gutters',
      'Expanded custom design',
    ],
  },
];

/* Shown as its own ledger row on the homepage. Coverage is still Front Only / Front & Sides in booking.
   TODO: confirm system details (controller / app, warranty) before adding them here — nothing is claimed yet. */
export const PERMANENT_ROW = {
  name: 'Permanent Lighting',
  features: [
    'Custom roofline design for your home',
    'Low-profile channel mounted along the roofline',
    'Stays up year-round — no yearly install or takedown',
    'Front Only or Front & Sides coverage',
    'Lit for Christmas and every season after',
  ],
};

/* Step 3 add-ons. `percent` = % of package price. `seasonalOnly` hides it for Permanent. */
export const ADDONS = [
  { id: 'tree-wrap', name: 'Tree & bush wrapping', short: 'Tree wrap', price: null, icon: 'tree' },
  { id: 'wreaths', name: 'Wreaths / garland', short: 'Wreaths', price: null, icon: 'wreath' },
  { id: 'pathway', name: 'Pathway / stake lights', short: 'Pathway lights', price: null, icon: 'path' },
  { id: 'own-lights', name: 'Install customer-owned lights', short: 'Own lights', price: null, icon: 'bulb' },
  { id: 'storage', name: 'Off-season storage', short: 'Storage', price: null, icon: 'box', seasonalOnly: true },
];
export const TWO_STORY_PERCENT = 50;

/* TODO: confirm the service-area list. Yorba Linda is home base. */
export const CITIES = [
  'Yorba Linda', 'Anaheim Hills', 'Placentia', 'Brea', 'Fullerton', 'Villa Park',
  'Orange', 'Chino Hills', 'La Habra', 'Diamond Bar', 'Corona',
];

/* Real reviews only — never invent. Leave empty until real ones exist.
   Shape: { name: 'Jane D.', city: 'Yorba Linda', text: '…', rating: 5 }
   TODO: paste real Google reviews here. */
export const REVIEWS = [];

/* Gallery — illustrated design previews until real install photos are added.
   TODO: replace with photos of your own installs (put files in public/images/gallery/ and set preview: false). */
export const GALLERY = [
  { src: '/images/scenes/hero-twin-permanent.svg', w: 1600, h: 900, title: 'Warm white permanent', caption: 'Soffit lights washing the gables in warm white', tags: ['permanent', 'warm'], preview: true },
  { src: '/images/scenes/craftsman-warm.svg', w: 1200, h: 1500, title: 'Craftsman, warm white', caption: 'Roofline, entry gable, shrubs and pathway stakes', tags: ['warm'], preview: true },
  { src: '/images/scenes/hero-mission-gold.svg', w: 1600, h: 900, title: 'Mission, gold C9', caption: 'Gold bulbs on every eave plus wrapped palms', tags: ['gold'], preview: true },
  { src: '/images/scenes/farm-permanent-holiday.svg', w: 1200, h: 1200, title: 'Permanent, holiday scene', caption: 'A permanent system set to red & green for December', tags: ['permanent', 'multi'], preview: true },
  { src: '/images/scenes/ranch-red-white.svg', w: 1200, h: 900, title: 'Ranch, red & white', caption: 'Alternating red and warm white along the hip roof', tags: ['redwhite'], preview: true },
  { src: '/images/scenes/mission-warm-permanent.svg', w: 1200, h: 1500, title: 'Permanent, gold & ivory', caption: 'Two-tone permanent scene on a two-story mission', tags: ['permanent', 'gold'], preview: true },
  { src: '/images/scenes/twin-multi.svg', w: 1200, h: 900, title: 'Twin gable, multicolor', caption: 'Classic multicolor with a wrapped tree and path', tags: ['multi'], preview: true },
  { src: '/images/scenes/ranch-cool-white.svg', w: 1200, h: 1200, title: 'Ranch, cool white', caption: 'Crisp cool white with two wrapped evergreens', tags: ['cool'], preview: true },
  { src: '/images/scenes/hero-farm-multi.svg', w: 1600, h: 900, title: 'Farmhouse, multicolor', caption: 'Main gable, porch line and side wing', tags: ['multi'], preview: true },
];

export const GALLERY_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'permanent', label: 'Permanent' },
  { id: 'warm', label: 'Warm white' },
  { id: 'gold', label: 'Gold' },
  { id: 'multi', label: 'Multicolor' },
  { id: 'redwhite', label: 'Red & white' },
  { id: 'cool', label: 'Cool white' },
];

export const HERO_SLIDES = [
  { src: '/images/scenes/hero-twin-permanent.svg', label: 'Permanent · warm white', pos: '62% 70%' },
  { src: '/images/scenes/hero-mission-gold.svg', label: 'Seasonal · gold C9', pos: '62% 70%' },
  { src: '/images/scenes/hero-farm-multi.svg', label: 'Seasonal · multicolor', pos: '62% 70%' },
];

export const STEPS_HOW = [
  { id: 'book', title: 'Book', text: 'Pick permanent or seasonal, your coverage and an install window online — or call us.' },
  { id: 'design', title: 'Design', text: 'We lay out the roofline, colors and add-ons for your home and confirm the final price at the on-site visit.' },
  { id: 'install', title: 'Install', text: 'Our crew installs on your date, sets the timer and checks every run with you.' },
  { id: 'takedown', title: 'Takedown', text: `Seasonal lights come down in ${TAKEDOWN}. Permanent lighting simply stays up.` },
];

export const FAQ = [
  {
    q: 'Do I need outdoor outlets?',
    a: 'One working exterior outlet near the roofline run is usually enough. We check outlets and power at the on-site visit and plan the runs so nothing overloads a circuit. If you don’t have an outlet where we need one, we’ll tell you before install day.',
  },
  {
    q: 'Do I buy the lights or lease them?',
    a: 'Seasonal installs use commercial-grade LEDs that we lease to you for the season — there’s nothing to buy, store or untangle. Permanent lighting is mounted on your home and stays up year-round; we go over the system details with your online quote.',
  },
  {
    q: 'How do the timers work?',
    a: 'Every seasonal install includes timer setup, so your lights switch on at dusk and off at the time you choose. We set it on install day and can change it any time during the season.',
  },
  {
    q: 'What if it rains or the weather turns?',
    a: 'Seasonal installs use commercial-grade outdoor LEDs. If wind or rain makes the roof unsafe on your install date, we’ll call you to move it to the next open window. In-season maintenance covers any bulb or run that goes out.',
  },
  {
    q: 'When do you take the lights down?',
    a: `Seasonal takedown happens after the holidays, in ${TAKEDOWN}. We’ll contact you to schedule it. Permanent lighting stays up — no takedown needed.`,
  },
  {
    q: 'Permanent or seasonal — which is right for me?',
    a: 'Seasonal is a full-service Christmas install that comes down in January. Permanent is installed once and stays on the roofline for every holiday and season after. Both start with the same Front Only or Front & Sides coverage.',
  },
  {
    q: 'Is the price on the site final?',
    a: 'Prices are “starting at” numbers, and unpriced items show “Online quoting”. Your final price is confirmed at the on-site visit, before any work starts.',
  },
  {
    q: `What is the $${DEPOSIT} deposit?`,
    a: `It reserves your install date and is applied to your final invoice. You can also choose “I’ll pay at the visit” at checkout.`,
  },
];
