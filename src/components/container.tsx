import React from 'react';
import { PropsWithChildren } from 'src/@types/react';


export const Container: React.FC<PropsWithChildren> = ({ children }) => {
  return <main className="container mx-auto max-w-2xl px-6 pb-6 sm:px-0">{children}</main>;
};
