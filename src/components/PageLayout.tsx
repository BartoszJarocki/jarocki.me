import React from 'react';

import { Container } from './Container';

export const PageLayout = ({
  title,
  intro,
  children,
}: React.PropsWithChildren<{ title: string; intro: string }>) => {
  return (
    <Container className="mt-16 sm:mt-32">
      <header className="max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl">
          {title}
        </h1>
        <p className="mt-6 text-base">{intro}</p>
      </header>
      <div className="mt-16 sm:mt-20">{children}</div>
    </Container>
  );
};
