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
      className="flex items-center justify-center px-3 py-2 font-medium text-sm leading-5 rounded-md outline-current text-slate-500 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 duration-200 ease-in-out"
      {...otherProps}
    >
      {children}
    </button>
  );
});
