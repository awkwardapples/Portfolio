export function PaintingIcon({ className }: { className?: string }) {
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
      <path d="M8 3l8 8" />
      <path d="M5 6l3-3 11 11-3 3z" />
      <path d="M3 21c0-2 1-3 3-4l1 1c-1 1-2 2-2 3z" />
      <path d="M16 14l3 3" />
    </svg>
  );
}
