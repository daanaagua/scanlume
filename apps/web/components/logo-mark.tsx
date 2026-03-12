type LogoMarkProps = {
  className?: string;
};

export function LogoMark({ className }: LogoMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="scanlume-logo-gradient" x1="10" x2="56" y1="8" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0E7C66" />
          <stop offset="1" stopColor="#07594C" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="18" fill="url(#scanlume-logo-gradient)" />
      <path
        d="M21 22.5C21 18.3579 24.3579 15 28.5 15H43"
        opacity="0.98"
        stroke="white"
        strokeLinecap="round"
        strokeWidth="4.4"
      />
      <path
        d="M21 41.5C21 45.6421 24.3579 49 28.5 49H43"
        opacity="0.78"
        stroke="white"
        strokeLinecap="round"
        strokeWidth="4.4"
      />
      <path d="M17 32H45" stroke="white" strokeLinecap="round" strokeWidth="4.4" />
      <circle cx="47" cy="32" r="3.8" fill="#FFD28A" />
    </svg>
  );
}
