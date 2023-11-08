import React from 'react';

import { Container } from './Container';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  intro: string;
}

export const PageLayout = ({ title, intro, children, ...rest }: React.PropsWithChildren<Props>) => {
  return (
    <Container className="mt-16 sm:mt-32" {...rest}>
      <header className="max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 text-balance">
          {title}
        </h1>
        <p className="mt-6 text-base text-balance">{intro}</p>
      </header>
      <div className="mt-16 sm:mt-20">{children}</div>
    </Container>
  );
};
