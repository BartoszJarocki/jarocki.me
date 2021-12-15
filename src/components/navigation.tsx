import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { SecondaryButton } from './secondary-button';
import { ArrowSmLeftIcon } from '@heroicons/react/outline';
import { Button } from './button';

export const Navigation: React.FC = () => {
  const router = useRouter();
  const isBackButtonVisible = router.pathname !== '/';

  return (
    <nav className="flex flex-row items-center justify-center top-background sticky w-full h-28 bg-white bg-opacity-70 z-50 top-0 mb-8 backdrop-blur-xl">
      <div className="container mx-auto px-5 max-w-2xl flex flex-row justify-end">
        <div className="mr-auto">
          {isBackButtonVisible && (
            <Button onClick={() => router.back()} data-testid={'back-button'}>
              <ArrowSmLeftIcon className="inline h-5 w-5 mr-1" />
              Back
            </Button>
          )}
        </div>
        <div className="flex flex-row space-x-2">
          <Link href="/">
            <SecondaryButton data-testid={'home'}>Home</SecondaryButton>
          </Link>
          <Link href="/blog">
            <SecondaryButton data-testid={'blog'}>Blog</SecondaryButton>
          </Link>
          <Link href="/about">
            <SecondaryButton data-testid={'about'}>About me</SecondaryButton>
          </Link>
        </div>
      </div>
    </nav>
  );
};
