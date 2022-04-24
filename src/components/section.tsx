import React from 'react';

type Heading = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

interface TitleProps {
  as?: Heading;
  action?: React.ReactNode;
}

const Title: React.FC<TitleProps> = ({ as: TitleComponent = 'h1', action, children }) => {
  return (
    <header className="flex flex-row justify-between items-center mt-12">
      <TitleComponent className="text-3xl sm:text-4xl font-extrabold">{children}</TitleComponent>
      {action}
    </header>
  );
};

const Content: React.FC = ({ children }) => {
  return <div className="mt-3 space-y-4">{children}</div>;
};

const SectionRoot: React.FC = ({ children }) => {
  return <section>{children}</section>;
};

export const Section = Object.assign(SectionRoot, { Title, Content });
