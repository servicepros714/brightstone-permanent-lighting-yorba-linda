import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="notfound">
      <div className="container">
        <p className="eyebrow">404</p>
        <h1 className="h-display">This light’s out.</h1>
        <p className="lead">The page you’re looking for doesn’t exist.</p>
        <div className="btn-row">
          <Link to="/" className="btn btn--gold">Back to home</Link>
          <Link to="/book" className="btn btn--ghost-light">Book online</Link>
        </div>
      </div>
    </section>
  );
}
