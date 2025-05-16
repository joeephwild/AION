import type { SVGProps } from 'react';

export function AionLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <linearGradient id="aionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: 'hsl(var(--accent))', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <path
        d="M50 10 L15 40 L15 70 L50 100 L85 70 L85 40 Z M50 10 L50 55 M15 40 L50 55 M85 40 L50 55 M15 70 L50 55 M85 70 L50 55"
        stroke="url(#aionGradient)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="50" cy="55" r="10" fill="hsl(var(--background))" />
      <circle cx="50" cy="55" r="7" fill="url(#aionGradient)" />
    </svg>
  );
}
