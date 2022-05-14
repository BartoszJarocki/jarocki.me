import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import {
  ArrowSmLeftIcon,
  BookOpenIcon,
  HomeIcon,
  MoonIcon,
  SunIcon,
  UserIcon,
} from '@heroicons/react/outline';
import { Button } from './button';

export const Navigation: React.FC = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const router = useRouter();
  const isBackButtonVisible = router.pathname !== '/';

  return (
    <nav className="flex flex-row items-center justify-center top-background sticky w-full h-20 z-50 top-0 mb-8 backdrop-blur-xl">
      <div className="container mx-auto px-5 max-w-5xl flex flex-row justify-end">
        <div className="mr-auto">
          {isBackButtonVisible && (
            <Button onClick={() => router.back()} data-testid={'back-button'}>
              <ArrowSmLeftIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex flex-row space-x-2">
          <Link href="/">
            <Button data-testid={'back-btn'}>
              <HomeIcon className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/about">
            <Button data-testid={'about-btn'}>
              <UserIcon className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            data-testid={'theme-btn'}
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          >
            {resolvedTheme === 'dark' ? (
              <SunIcon className="h-4 w-4" />
            ) : (
              <MoonIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </nav>
  );
};
