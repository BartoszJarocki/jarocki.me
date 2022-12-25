import Link from 'next/link';
import { Popover } from '@headlessui/react';
import React from 'react';

export function MobileNavItem({ href, children }: React.PropsWithChildren<{ href: string }>) {
  return (
    <li>
      <Popover.Button as={Link} href={href} className="block py-2">
        {children}
      </Popover.Button>
    </li>
  );
}
