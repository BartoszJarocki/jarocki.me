import classNames from 'classnames';
import Link from 'next/link';
import React from 'react';
import { PropsWithChildren } from 'src/@types/react';

const styles = `inline-flex items-center rounded-full hover:text-primary bg-zinc-100 px-2.5 py-0.5 text-xs leading-4 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:text-primary`;

type Props = (
  | {
      onClick?: () => void;
    }
  | {
      href: string;
    }
) & { className?: string } & PropsWithChildren;

export const Badge = ({ className, children, ...otherProps }: Props) => {
  if ('href' in otherProps)
    return (
      <Link className={classNames(styles, className)} {...otherProps}>
        {children}
      </Link>
    );

  return (
    <button className={classNames(styles, className)} {...otherProps}>
      {children}
    </button>
  );
};
