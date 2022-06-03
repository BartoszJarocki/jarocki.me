import React from 'react';
import { PropsWithChildren } from 'src/@types/react';

type Props = {
  className?: string | null;
  href: string;
} & PropsWithChildren;

export const ExternalLink: React.FC<Props> = ({
  className = 'underline',
  href,
  children,
  ...otherProps
}) => {
  return (
    <a
      className={className ?? undefined}
      target="_blank"
      rel="noopener noreferrer"
      href={href}
      {...otherProps}
    >
      {children}
    </a>
  );
};
