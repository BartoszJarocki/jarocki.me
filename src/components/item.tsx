import React from 'react';

const ItemRoot = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ children, ...otherProps }, ref: React.Ref<HTMLButtonElement>) => {
    return (
      <button
        ref={ref}
        className="group relative w-full cursor-pointer outline-none lg:flex"
        {...otherProps}
      >
        <div className="absolute -inset-x-4 -inset-y-0.5 rounded bg-transparent transition-all duration-200 ease-in-out group-hover:bg-zinc-200 group-focus:outline group-focus:outline-2 group-focus:outline-current dark:group-hover:bg-zinc-700" />
        <div className="z-10 my-4 flex flex-grow flex-col justify-between leading-normal">
          {children}
        </div>
      </button>
    );
  },
);

ItemRoot.displayName = 'ItemRoot';

const Subtitle: React.FC = ({ children }) => {
  return <div className="text-left text-base text-gray-700 dark:text-gray-300">{children}</div>;
};

const Title: React.FC = ({ children }) => {
  return (
    <h3 className="mb-1 flex flex-grow flex-col text-left text-lg font-semibold tracking-tight sm:flex-row">
      {children}
    </h3>
  );
};

export const Item = Object.assign(ItemRoot, { Title, Subtitle });
