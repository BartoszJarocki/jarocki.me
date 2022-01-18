import React from 'react';
import classNames from 'classnames';

type Props = {
  className?: string;
  onClick?: () => void;
};

export const Badge: React.FC<Props> = ({ className, children, onClick, ...otherProps }) => {
  return (
    <span
      className={classNames(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs leading-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-200',
        className,
      )}
      onClick={onClick}
      {...otherProps}
    >
      {children}
    </span>
  );
};
