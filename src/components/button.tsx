import React from 'react';
import { PropsWithChildren } from 'src/@types/react';

export const Button = React.forwardRef<
  HTMLButtonElement,
  PropsWithChildren & React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, ...otherProps }, ref: React.Ref<HTMLButtonElement>) => {
  return (
    <button
      ref={ref}
      className="dark:hover-text-zinc-200 flex items-center justify-center rounded-md bg-zinc-100 px-2 py-2 text-sm font-medium leading-5 text-zinc-500 outline-current duration-200 ease-in-out hover:bg-zinc-200 hover:text-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
      {...otherProps}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';
