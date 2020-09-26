import React from 'react';

import { Footer } from './footer';
import { Meta } from './meta';

type Props = {
  children: React.ReactNode;
};

export const Layout: React.FC<Props> = ({ children }) => {
  return (
    <>
      <Meta />
      <div className="w-full h-full flex flex-col">
        <main className="flex-auto">{children}</main>
        <Footer />
      </div>
    </>
  );
};
