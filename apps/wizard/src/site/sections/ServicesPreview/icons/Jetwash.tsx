export function JetwashIcon({ className }: { className?: string }) {
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
      <path d="M4 6h10a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H4" />
      <line x1="4" y1="10" x2="4" y2="18" />
      <line x1="14" y1="10" x2="21" y2="17" />
      <line x1="17" y1="14" x2="20" y2="17" />
      <line x1="20" y1="14" x2="20" y2="20" />
      <line x1="17" y1="17" x2="17" y2="20" />
    </svg>
  );
}
