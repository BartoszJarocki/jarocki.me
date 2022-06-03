import React from 'react';
import { PropsWithChildren } from 'src/@types/react';

export const PageTitle: React.FC<PropsWithChildren> = ({ children }) => {
  return <h1 className="text-4xl font-bold leading-none tracking-tight">{children}</h1>;
};
