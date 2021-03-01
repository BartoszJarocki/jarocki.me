import React from 'react';

export const Container: React.FC = ({ children }) => {
  return <div className="container mx-auto px-6 pb-6 max-w-3xl overflow-x-hidden">{children}</div>;
};
