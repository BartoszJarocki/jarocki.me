import React from 'react';

export const PageTitle: React.FC = ({ children }) => {
  return <h1 className="text-3xl font-bold leading-none tracking-tight">{children}</h1>;
};
