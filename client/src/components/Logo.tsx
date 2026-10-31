import { Link } from 'react-router-dom';

interface LogoProps {
  to?: string;
  tone?: 'light' | 'dark';
}

export function Logo({ to = '/', tone = 'dark' }: LogoProps) {
  const text = tone === 'light' ? 'text-white' : 'text-ink';
  return (
    <Link to={to} className={`inline-flex items-center gap-2.5 ${text}`} aria-label="K12 Hunar home">
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill={tone === 'light' ? '#F7F8FC' : '#1D2A5B'} />
        <path
          d="M9 8v16M9 16h8M17 8v16"
          stroke={tone === 'light' ? '#1D2A5B' : '#F7F8FC'}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="23.5" cy="21.5" r="3" fill="#E8A317" />
      </svg>
      <span className="font-display text-lg font-bold tracking-tight">K12 Hunar</span>
    </Link>
  );
}
