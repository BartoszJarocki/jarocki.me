import Link from 'next/link';
import React from 'react';

type Item = { label: string; href: string; external?: boolean };

const ALL_ITEMS: Item[] = [
  { label: 'home', href: '/' },
  { label: 'notes', href: '/notes' },
  { label: 'work', href: '/work' },
  { label: 'about', href: '/about' },
  { label: 'email', href: 'mailto:bartosz@jarocki.me', external: true },
];

type Props = {
  omit?: string[];
  className?: string;
};

export function SiteNav({ omit = [], className = '' }: Props) {
  const items = ALL_ITEMS.filter((item) => !omit.includes(item.label));
  return (
    <nav className={`flex flex-wrap items-center gap-x-5 gap-y-2 text-xs ${className}`}>
      {items.map((item, i) => (
        <React.Fragment key={item.label}>
          {i > 0 && (
            <span aria-hidden="true" className="text-pip">
              ·
            </span>
          )}
          {item.external ? (
            <a href={item.href} className="ds-nav-link">
              {item.label}
            </a>
          ) : (
            <Link href={item.href} className="ds-nav-link">
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
