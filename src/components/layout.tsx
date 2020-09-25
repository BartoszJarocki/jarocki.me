import React from 'react';

import { Footer } from './footer';
import { Meta } from './meta';

type Props = {
  title?: string;
  children: React.ReactNode;
};

export const Layout: React.FC<Props> = ({ children, title }) => {
  return (
    <>
      <Meta title={title} />
      <div className="w-full h-full flex flex-col">
        <main className="flex-auto">{children}</main>
        <Footer />
      </div>
    </>
  );
};
