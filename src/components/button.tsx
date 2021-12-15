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
      className="flex items-center justify-center px-2 py-2 font-medium text-sm leading-5 rounded-md outline-current text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-300 duration-200 ease-in-out"
      {...otherProps}
    >
      {children}
    </button>
  );
});
