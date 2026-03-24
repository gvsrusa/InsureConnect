/** Shared layout for auth pages (login / register) */
export default function PublicAuthLayout({
  children
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 py-12">
      <div className="mb-8 flex items-center gap-2 text-pine">
        <svg width="32" height="32" viewBox="0 0 28 28" fill="none" aria-hidden>
          <rect width="28" height="28" rx="7" fill="var(--color-pine)" />
          <path
            d="M14 5L21 9V15C21 19.1421 17.4183 22.5 14 23C10.5817 22.5 7 19.1421 7 15V9L14 5Z"
            fill="white"
          />
        </svg>
        <span className="text-lg font-bold tracking-tight">InsureConnect</span>
      </div>
      {children}
    </div>
  );
}
