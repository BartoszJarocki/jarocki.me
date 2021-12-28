import React from 'react';

type Props = {
  children?: React.ReactNode;
};

export const SecondaryButton = React.forwardRef<
  HTMLButtonElement,
  Props & React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, ...otherProps }, ref: React.Ref<HTMLButtonElement>) => {
  return (
    <button
      ref={ref}
      className="px-2 py-2 font-medium text-sm leading-5 rounded-md outline-current text-slate-500 hover:text-slate-700 hover:bg-slate-100 duration-200 ease-in-out whitespace-no-wrap"
      {...otherProps}
    >
      {children}
    </button>
  );
});
