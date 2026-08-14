import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <span className="text-5xl">🔍</span>
      <h1 className="text-xl font-bold text-textPrimary">Page not found</h1>
      <p className="text-sm text-textSecondary">The page you're looking for doesn't exist or may have moved.</p>
      <Link to="/" className="mt-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white">
        Back to Home
      </Link>
    </div>
  );
}
