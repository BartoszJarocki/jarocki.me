import React from 'react';

type Props = {
  className?: string;
  href: string;
};

export const ExternalLink: React.FC<Props> = ({ className, href, children, ...otherProps }) => {
  return (
    <a className={className} target="_blank" rel="noopener noreferrer" href={href} {...otherProps}>
      {children}
    </a>
  );
};
