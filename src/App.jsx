import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { ActionBar, Footer, Nav } from './components/Shell.jsx';
import { scrollTopNow } from './lib/hooks.js';
import Home from './pages/Home.jsx';
import Book from './pages/Book.jsx';
import Checkout from './pages/Checkout.jsx';
import Confirmation from './pages/Confirmation.jsx';
import { Privacy, Terms } from './pages/Legal.jsx';
import NotFound from './pages/NotFound.jsx';

const TITLES = {
  '/book': 'Book Your Install | Brightstone Permanent Lighting',
  '/checkout': 'Checkout | Brightstone Permanent Lighting',
  '/confirmation': 'Booking Confirmed | Brightstone Permanent Lighting',
  '/privacy': 'Privacy Policy | Brightstone Permanent Lighting',
  '/terms': 'Terms & Conditions | Brightstone Permanent Lighting',
};
const HOME_TITLE = document.title;

/** Scroll to top on every route change (hash links on the homepage scroll to their section instead). */
function RouteEffects() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) scrollTopNow();
    document.title = TITLES[pathname] || HOME_TITLE;
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <RouteEffects />
      <Nav />
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/book" element={<Book />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/confirmation" element={<Confirmation />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <ActionBar />
    </>
  );
}
