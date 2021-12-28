import React from 'react';
import Link from 'next/link';

type Props = {
  href: string;
};

export const OutlinedCard: React.FC = ({ children, ...otherProps }) => {
  return (
    <div
      className="bg-white hover:bg-slate-100 border border-slate-400 rounded duration-200 ease-in-out mt-4 w-full lg:flex cursor-pointer"
      {...otherProps}
    >
      <div className="p-4 flex flex-col flex-grow justify-between leading-normal">{children}</div>
    </div>
  );
};

export const LinkOutlinedCard: React.FC<Props> = ({ children, href, ...otherProps }) => {
  return (
    <Link href={href} {...otherProps}>
      <button
        className="bg-white hover:bg-slate-100 border border-slate-400 rounded duration-200 ease-in-out w-full"
        data-testid={href}
      >
        <div className="p-4 flex flex-col flex-grow justify-between leading-normal">{children}</div>
      </button>
    </Link>
  );
};
