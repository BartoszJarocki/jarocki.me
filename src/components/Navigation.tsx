import { Popover, Transition } from '@headlessui/react';
import clsx from 'clsx';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Fragment } from 'react';

import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { CloseIcon } from './icons/CloseIcon';

export const NavigationItems = [
  {
    name: 'Home',
    href: '/',
    type: 'internal',
  },
  {
    name: 'Notes',
    href: '/notes',
    type: 'internal',
  },
  {
    name: 'Creating',
    href: '/creating',
    type: 'internal',
  },
  {
    name: 'Uses',
    href: '/uses',
    type: 'internal',
  },
  {
    name: 'Resume',
    href: 'https://cv.jarocki.me',
    type: 'external',
  },
  {
    name: 'About',
    href: '/about',
    type: 'internal',
  },
] as const;

export const NavLink = ({ href, children }: React.PropsWithChildren<{ href: string }>) => {
  return (
    <Link href={href} className="transition hover:text-primary">
      {children}
    </Link>
  );
};

const NavItem = ({ href, children }: React.PropsWithChildren<{ href: string }>) => {
  const isActive = useRouter().pathname === href;

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
      </Link>
    </li>
  );
};

export const MobileNavItem = ({ href, children }: React.PropsWithChildren<{ href: string }>) => {
  return (
    <li>
      <Popover.Button as={Link} href={href} className="block py-2">
        {children}
      </Popover.Button>
    </li>
  );
};

export const DesktopNavigation = (
  props: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>,
) => {
  return (
    <nav {...props}>
      <ul className="flex rounded-full bg-white/90 px-3 text-sm font-medium text-zinc-800 shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur dark:bg-zinc-800/90 dark:text-zinc-200 dark:ring-white/10">
        {NavigationItems.map((item) => {
          if (item.type === 'internal') {
            return (
              <NavItem key={item.href} href={item.href}>
                {item.name}
              </NavItem>
            );
          }

          return (
            <a
              key={item.href}
              className="transition hover:text-primary px-3 py-2"
              href={item.href}
              target="_blank"
            >
              {item.name}
            </a>
          );
        })}
      </ul>
    </nav>
  );
};

export const MobileNavigation = (props: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <Popover {...props}>
      <Popover.Button className="group flex items-center rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-zinc-800 shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur dark:bg-zinc-800/90 dark:text-zinc-200 dark:ring-white/10 dark:hover:ring-white/20">
        Menu
        <ChevronDownIcon className="ml-3 h-auto w-2 stroke-zinc-500 group-hover:stroke-zinc-700 dark:group-hover:stroke-zinc-400" />
      </Popover.Button>
      <Transition.Root>
        <Transition.Child
          as={Fragment}
          enter="duration-150 ease-out"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="duration-150 ease-in"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Popover.Overlay className="fixed inset-0 z-50 bg-zinc-800/40 backdrop-blur-sm dark:bg-black/80" />
        </Transition.Child>
        <Transition.Child
          as={Fragment}
          enter="duration-150 ease-out"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="duration-150 ease-in"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <Popover.Panel
            focus
            className="fixed inset-x-4 top-8 z-50 origin-top rounded-3xl bg-white p-8 ring-1 ring-zinc-900/5 dark:bg-zinc-900 dark:ring-zinc-800"
          >
            <div className="flex flex-row-reverse items-center justify-between">
              <Popover.Button aria-label="Close menu" className="-m-1 p-1">
                <CloseIcon className="h-6 w-6 text-zinc-500 dark:text-zinc-400" />
              </Popover.Button>
              <h2 className="text-sm font-medium">Navigation</h2>
            </div>
            <nav className="mt-6">
              <ul className="-my-2 divide-y divide-zinc-100 text-base text-zinc-800 dark:divide-zinc-100/5 dark:text-zinc-300">
                {NavigationItems.map((item) => (
                  <MobileNavItem key={item.href} href={item.href}>
                    {item.name}
                  </MobileNavItem>
                ))}
              </ul>
            </nav>
          </Popover.Panel>
        </Transition.Child>
      </Transition.Root>
    </Popover>
  );
};
