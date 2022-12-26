import clsx from 'clsx';
import React from 'react';
import { PropsWithChildren } from 'src/@types/react';

type Props = {
  className?: string | null;
  href: string;
} & PropsWithChildren;

export const ExternalLink = ({ className = 'underline', href, children, ...otherProps }: Props) => {
  return (
    <a
      className={clsx(className)}
      target="_blank"
      rel="noopener noreferrer"
      href={href}
      {...otherProps}
    >
      {children}
    </a>
  );
};
