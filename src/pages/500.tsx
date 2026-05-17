import Link from 'next/link';

export default function ServerError() {
  return (
    <div className="mx-auto max-w-[40rem] px-6 pt-32 sm:px-12 sm:pt-40">
      <p className="ds-mono-date text-muted">500</p>
      <h1 className="mt-3 text-base font-medium text-ink">Something broke.</h1>
      <p className="mt-2 text-base text-body">The server is having a moment.</p>
      <Link href="/" className="ds-link mt-12 inline-block text-xs">
        ← home
      </Link>
    </div>
  );
}
