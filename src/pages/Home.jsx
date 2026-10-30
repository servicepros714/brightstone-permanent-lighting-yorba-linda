import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Hero from '../components/home/Hero.jsx';
import Gallery from '../components/home/Gallery.jsx';
import Packages from '../components/home/Packages.jsx';
import Reviews from '../components/home/Reviews.jsx';
import HowItWorks from '../components/home/HowItWorks.jsx';
import ServiceArea from '../components/home/ServiceArea.jsx';
import SeasonStrip from '../components/home/SeasonStrip.jsx';
import Faq from '../components/home/Faq.jsx';
import FinalCta from '../components/home/FinalCta.jsx';
import { apiConfigured, getRangeAvailability } from '../lib/api.js';
import { currentSeason, earliestOpenDate } from '../lib/time.js';

/* Homepage order (unique to this site):
   Hero → Gallery → Packages → Reviews → How it works → Service area → Season calendar → FAQ → Final CTA */
export default function Home() {
  const { hash } = useLocation();
  const season = useMemo(() => currentSeason(), []);
  const [full, setFull] = useState([]);
  const [loaded, setLoaded] = useState(!apiConfigured());

  useEffect(() => {
    if (!apiConfigured()) return undefined;
    let live = true;
    getRangeAvailability(season.start, season.end)
      .then((r) => { if (live) setFull(Array.isArray(r?.full) ? r.full : []); })
      .catch(() => {})
      .finally(() => { if (live) setLoaded(true); });
    return () => { live = false; };
  }, [season]);

  // Arriving from another page with /#section → scroll there once rendered.
  useEffect(() => {
    if (!hash) return undefined;
    const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' }), 60);
    return () => clearTimeout(t);
  }, [hash]);

  const earliest = earliestOpenDate(full);

  return (
    <>
      <Hero earliest={earliest} season={season} />
      <Gallery />
      <Packages />
      <Reviews />
      <HowItWorks />
      <ServiceArea />
      <SeasonStrip season={season} full={full} earliest={earliest} loaded={loaded} />
      <Faq />
      <FinalCta earliest={earliest} />
    </>
  );
}
