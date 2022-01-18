import React from 'react';

type Props = {
  children?: React.ReactNode;
};

export const Button = React.forwardRef<
  HTMLButtonElement,
  Props & React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, ...otherProps }, ref: React.Ref<HTMLButtonElement>) => {
  return (
    <button
      ref={ref}
      className="flex items-center justify-center px-2 py-2 font-medium text-sm leading-5 rounded-md outline-current text-zinc-500 hover:text-zinc-600 dark:text-zinc-100 dark:hover-text-zinc-200 dark:bg-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 duration-200 ease-in-out"
      {...otherProps}
    >
      {children}
    </button>
  );
});
