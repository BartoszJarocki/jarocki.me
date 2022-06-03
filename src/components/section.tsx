import React, { ReactNode } from 'react';
import { PropsWithChildren } from 'src/@types/react';

type Heading = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

interface TitleProps {
  as?: Heading;
  action?: React.ReactNode;
  children?: ReactNode;
}

const Title: React.FC<TitleProps> = ({ as: TitleComponent = 'h1', action, children }) => {
  return (
    <header className="mt-16 flex flex-row items-center justify-between">
      <TitleComponent className="text-xl font-bold leading-none tracking-tight">
        {children}
      </TitleComponent>
      {action}
    </header>
  );
};

const Content: React.FC<PropsWithChildren> = ({ children }) => {
  return <div className="mt-4 divide-y divide-zinc-200 dark:divide-zinc-700">{children}</div>;
};

const SectionRoot: React.FC<PropsWithChildren> = ({ children }) => {
  return <section>{children}</section>;
};

export const Section = Object.assign(SectionRoot, { Title, Content });
