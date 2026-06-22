export function DeckingIcon({ className }: { className?: string }) {
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
      <rect x="2" y="14" width="20" height="3" rx="0.5" />
      <line x1="5" y1="14" x2="5" y2="17" />
      <line x1="9" y1="14" x2="9" y2="17" />
      <line x1="13" y1="14" x2="13" y2="17" />
      <line x1="17" y1="14" x2="17" y2="17" />
      <line x1="7" y1="17" x2="7" y2="20" />
      <line x1="17" y1="17" x2="17" y2="20" />
      <line x1="5" y1="20" x2="19" y2="20" />
    </svg>
  );
}
