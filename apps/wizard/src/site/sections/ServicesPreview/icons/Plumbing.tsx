export function PlumbingIcon({ className }: { className?: string }) {
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
      <path d="M3 12h4v4H3z" />
      <path d="M7 14h6" />
      <path d="M13 11v6" />
      <path d="M13 11a3 3 0 1 1 6 0v8" />
      <path d="M17 19h2" />
    </svg>
  );
}
