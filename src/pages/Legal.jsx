import { Link } from 'react-router-dom';
import { BUSINESS, DEPOSIT, LEAD_HOURS, TAKEDOWN } from '../config/site.js';
import { money } from '../lib/booking.js';
import { currentSeason, fmtMonDay } from '../lib/time.js';

/* Keep these in step with how the site really works: if the booking data, payment or hosting changes, update them. */
const UPDATED = 'November 1, 2026';

function LegalPage({ title, intro, children }) {
  return (
    <section className="legal">
      <div className="container legal__inner">
        <p className="eyebrow">Last updated {UPDATED}</p>
        <h1 className="legal__title">{title}</h1>
        <p className="legal__intro">{intro}</p>
        {children}
      </div>
    </section>
  );
}

const CallUs = () => <a href={BUSINESS.phoneHref}>{BUSINESS.phoneDisplay}</a>;

export function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={`This policy explains what ${BUSINESS.name} collects when you use this website or book an install, how we use it, and the choices you have.`}
    >
      <h2>What we collect</h2>
      <ul>
        <li><strong>Contact details:</strong> your full name, phone number, email address and service address.</li>
        <li><strong>Booking details:</strong> lighting type, coverage, home height, add-ons, install date and time window.</li>
        <li><strong>Payment records:</strong> whether a deposit was paid and a payment reference. Card details are entered directly with our payment processor, Stripe, and we don’t see or store your full card number.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To schedule, confirm, carry out and support your install.</li>
        <li>To contact you about your booking, on-site visit, quote and any takedown.</li>
        <li>To take payments, keep business records and meet legal obligations.</li>
      </ul>

      <h2>Who we share it with</h2>
      <p>We don’t sell your personal information or share it for advertising. We share it only as needed with service providers that help us run the business, or when the law requires it:</p>
      <ul>
        <li><strong>Stripe</strong> processes deposit payments.</li>
        <li><strong>Cloudflare</strong> runs our booking system and stores booking records.</li>
        <li><strong>Netlify</strong> hosts this website.</li>
        <li><strong>Google Fonts</strong> supplies the site’s fonts, so your browser’s request, including your IP address, reaches Google.</li>
      </ul>

      <h2>Cookies and browser storage</h2>
      <p>We don’t use advertising or analytics cookies. Your browser temporarily stores your booking draft so it survives a page reload, and that draft is removed when you finish booking or close the tab. Stripe may use its own cookies on the checkout page to process payments and prevent fraud.</p>

      <h2>How long we keep it</h2>
      <p>We keep booking and payment records for as long as we need them to provide our services, keep business records and meet legal obligations.</p>

      <h2>Your choices and California rights</h2>
      <p>You can ask us what personal information we hold about you, and ask us to correct or delete it, subject to records we must keep by law. California residents may also have further rights under California privacy law, and we won’t treat you differently for using them. To make a request, call us at <CallUs />.</p>

      <h2>Security</h2>
      <p>We use reasonable safeguards to protect your information, but no website or system can be guaranteed completely secure.</p>

      <h2>Children</h2>
      <p>Our services are for adults arranging work on their homes. We don’t knowingly collect information from children under 13.</p>

      <h2>Changes</h2>
      <p>We may update this policy and will change the date at the top of this page when we do.</p>

      <h2>Contact</h2>
      <p>{BUSINESS.name}, {BUSINESS.city}, {BUSINESS.region}. Call <CallUs />, open {BUSINESS.hours}.</p>
    </LegalPage>
  );
}

export function Terms() {
  const season = currentSeason();
  return (
    <LegalPage
      title="Terms & Conditions"
      intro={`These terms apply when you use this website or book a service with ${BUSINESS.name}. By using the site or making a booking, you agree to them.`}
    >
      <h2>Our services</h2>
      <p>We design and install permanent roofline lighting and seasonal Christmas lighting for homes in {BUSINESS.city} and nearby cities. Seasonal installs use lights that we lease to you for the season and that remain our property. Permanent lighting is mounted on your home and stays up year-round; system details are provided with your quote.</p>

      <h2>Bookings</h2>
      <p>Install dates run from {fmtMonDay(season.start)} through {fmtMonDay(season.end)}, in the time windows shown at booking, and must be at least {LEAD_HOURS} hours away. You agree to give accurate details and confirm that you own the home or have permission to have lighting installed there. If two bookings land on the same window, we’ll call you to confirm a time.</p>

      <h2>Prices and quotes</h2>
      <p>Prices on this site are starting prices, and some items are quoted individually. Your final price is confirmed at the on-site visit, before any work starts.</p>

      <h2>Deposit and payment</h2>
      <p>You can hold your date with a {money(DEPOSIT)} reservation deposit, which is applied to your final invoice, or choose to pay at the visit. Card payments are processed by Stripe.</p>

      <h2>Changes and cancellations</h2>
      <p>To reschedule or cancel, call us as soon as you can at <CallUs />. If wind, rain or other conditions make the roof unsafe on your install date, we’ll call you to move it to the next open window.</p>

      <h2>Your home</h2>
      <p>Please give our crew safe access to the work areas and working exterior power on your install date. Tell us about anything that could affect the work, such as roof damage or electrical problems. We check outlets and power at the on-site visit.</p>

      <h2>Maintenance and takedown</h2>
      <p>Seasonal installs include in-season maintenance and bulb replacement. Seasonal lights are taken down in {TAKEDOWN}, and we’ll contact you to schedule it. Permanent lighting has no takedown.</p>

      <h2>Website content</h2>
      <p>Gallery images marked “Design preview” are illustrations, not photos of finished installs, and your results will vary with your home. Site content belongs to {BUSINESS.name} and may not be copied for commercial use without permission. We work to keep the site accurate and available but can’t guarantee it will be error-free or uninterrupted.</p>

      <h2>Liability</h2>
      <p>To the fullest extent the law allows, we aren’t liable for indirect or consequential losses arising from use of this website. Nothing in these terms limits any rights you have under law that can’t be waived.</p>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of the State of California.</p>

      <h2>Changes</h2>
      <p>We may update these terms and will change the date at the top of this page when we do. Our <Link to="/privacy">Privacy Policy</Link> explains how we handle your information.</p>

      <h2>Contact</h2>
      <p>{BUSINESS.name}, {BUSINESS.city}, {BUSINESS.region}. Call <CallUs />, open {BUSINESS.hours}.</p>
    </LegalPage>
  );
}
