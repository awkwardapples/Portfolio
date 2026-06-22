export function FencingIcon({ className }: { className?: string }) {
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
      <line x1="3" y1="6" x2="3" y2="18" />
      <line x1="9" y1="6" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="18" />
      <line x1="21" y1="6" x2="21" y2="18" />
      <line x1="1" y1="9" x2="23" y2="9" />
      <line x1="1" y1="14" x2="23" y2="14" />
    </svg>
  );
}
