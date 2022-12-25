import Link from 'next/link';
import { useRouter } from 'next/router';
import clsx from 'clsx';
import React from 'react';

export function NavItem({ href, children }: React.PropsWithChildren<{ href: string }>) {
  let isActive = useRouter().pathname === href;

  return (
    <li>
      <Link
        href={href}
        className={clsx(
          'relative block px-3 py-2 transition',
          isActive ? 'text-primary' : 'hover:text-primary',
        )}
      >
        {children}
        {isActive && (
          <span className="absolute inset-x-1 -bottom-px h-px bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0" />
        )}
      </Link>
    </li>
  );
}
