import clsx from 'clsx';
import { PropsWithChildren } from 'react';

export function Prose({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={clsx(className, 'md:prose-md prose w-full overflow-y-hidden dark:prose-dark')}>
      {children}
    </div>
  );
}
