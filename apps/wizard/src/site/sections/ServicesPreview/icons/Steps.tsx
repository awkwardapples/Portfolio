export function StepsIcon({ className }: { className?: string }) {
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
      <polyline points="3,21 3,15 9,15 9,9 15,9 15,3 21,3" />
      <line x1="3" y1="15" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="9" />
    </svg>
  );
}
