import clsx from 'clsx';
import { PropsWithChildren } from 'react';

type Props = PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>;

export const Prose = ({ children, className }: Props) => {
  return (
    <div className={clsx(className, 'md:prose-md prose w-full overflow-y-hidden dark:prose-dark')}>
      {children}
    </div>
  );
};
