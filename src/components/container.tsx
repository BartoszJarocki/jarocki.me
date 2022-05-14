import React from 'react';

export const Container: React.FC = ({ children }) => {
  return <main className="container mx-auto px-6 sm:px-0 pb-6 max-w-2xl">{children}</main>;
};
