import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';

export function NotFoundPage() {
  return (
    <div className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <Logo />
        <h1 className="mt-10 text-3xl font-bold">This page doesn&rsquo;t exist</h1>
        <p className="mt-2 text-slate">The link may be broken or the page may have moved.</p>
        <Link to="/" className="btn-ink mt-8">
          Go to the inquiry form
        </Link>
      </div>
    </div>
  );
}
