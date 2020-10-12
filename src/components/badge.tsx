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
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium leading-4 bg-gray-100 text-gray-500',
        className,
      )}
      onClick={onClick}
      {...otherProps}
    >
      {children}
    </span>
  );
};
