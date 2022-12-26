import Link from 'next/link';
import React from 'react';

export const NavLink = ({ href, children }: React.PropsWithChildren<{ href: string }>) => {
  return (
    <Link href={href} className="transition hover:text-primary">
      {children}
    </Link>
  );
};
