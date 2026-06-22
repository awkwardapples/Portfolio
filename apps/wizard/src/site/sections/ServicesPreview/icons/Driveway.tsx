export function DrivewayIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M2 20h20" />
      <path d="M6 20V8l6-5 6 5v12" />
      <line x1="9" y1="20" x2="9" y2="14" />
      <line x1="15" y1="20" x2="15" y2="14" />
      <rect x="10" y="14" width="4" height="6" />
    </svg>
  );
}
