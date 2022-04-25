import React from 'react';

export const Container: React.FC = ({ children }) => {
  return <main className="container mx-auto pb-6 max-w-2xl overflow-x-hidden">{children}</main>;
};
