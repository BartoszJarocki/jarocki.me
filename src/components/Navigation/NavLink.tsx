import Link from 'next/link';
import React from 'react';

export function NavLink({ href, children }: React.PropsWithChildren<{ href: string }>) {
  return (
    <Link href={href} className="transition hover:text-primary">
      {children}
    </Link>
  );
}
