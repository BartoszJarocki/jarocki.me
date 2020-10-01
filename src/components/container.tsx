import React from 'react';

export const Container: React.FC = ({ children }) => {
  return <div className="container mx-auto px-5 max-w-3xl">{children}</div>;
};
