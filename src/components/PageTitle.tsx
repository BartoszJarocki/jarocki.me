import clsx from 'clsx';
import { PropsWithChildren } from 'react';

export const PageTitle = ({ children, className }: PropsWithChildren<{ className?: string }>) => {
  return (
    <h1
      className={clsx(
        className,
        'text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 text-balance',
      )}
    >
      {children}
    </h1>
  );
};
