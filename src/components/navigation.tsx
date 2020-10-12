import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { SecondaryButton } from './secondary-button';

export const Navigation: React.FC = () => {
  const router = useRouter();
  const isBackButtonVisible = router.pathname !== '/';

  return (
    <nav className="navigation flex flex-row items-center justify-center top-background">
      <div className="container mx-auto px-5 max-w-3xl flex flex-row justify-end">
        <div className="mr-auto">
          {isBackButtonVisible && (
            <button
              className="flex flex-row justify-center items-center px-3 py-2 font-medium text-sm leading-5 rounded-md text-gray-500 hover:text-gray-700 hover:outline-none bg-gray-100 hover:bg-gray-300 cursor-pointer"
              onClick={() => router.back()}
            >
              <span className="mr-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </span>
              Back
            </button>
          )}
        </div>
        <div className="flex flex-row space-x-2">
          <Link href="/">
            <SecondaryButton>Home</SecondaryButton>
          </Link>
          <Link href="/blog">
            <SecondaryButton>Blog</SecondaryButton>
          </Link>
          <Link href="/about">
            <SecondaryButton>About me</SecondaryButton>
          </Link>
        </div>
      </div>
      <style jsx>{`
        .navigation {
          position: sticky;
          top: 0;
          width: 100%;
          height: 100px;
          background-color: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          z-index: 100;
          margin-bottom: 24px;
        }
      `}</style>
    </nav>
  );
};
