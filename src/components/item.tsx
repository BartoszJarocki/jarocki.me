import React from 'react';
import { PropsWithChildren } from 'src/@types/react';

const ItemRoot = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ children, ...otherProps }, ref: React.Ref<HTMLButtonElement>) => {
    return (
      <button
        ref={ref}
        className="group relative w-full cursor-pointer outline-none lg:flex"
        {...otherProps}
      >
        <div className="absolute -inset-x-4 -inset-y-0.5 rounded transition-all duration-200 ease-in-out group-hover:bg-zinc-200 group-focus:outline group-focus:outline-2 group-focus:outline-current group-active:bg-zinc-200/50 dark:group-hover:bg-zinc-700 dark:group-active:bg-zinc-700/50" />
        <div className="isolate my-4 flex flex-grow flex-col justify-between leading-normal">
          {children}
        </div>
      </button>
    );
  },
);

ItemRoot.displayName = 'ItemRoot';

const Title: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <h3 className="mb-1 flex flex-grow flex-col text-left text-lg font-semibold tracking-tight sm:flex-row">
      {children}
    </h3>
  );
};

const Subtitle: React.FC<PropsWithChildren> = ({ children }) => {
  return <div className="text-left text-base text-gray-700 dark:text-gray-300">{children}</div>;
};

const Description: React.FC<PropsWithChildren> = ({ children }) => {
  return <div className="mt-1.5 text-left text-sm text-gray-500">{children}</div>;
};

export const Item = Object.assign(ItemRoot, { Title, Subtitle, Description });
