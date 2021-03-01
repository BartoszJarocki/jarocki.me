import React from 'react';

export const Title: React.FC = ({ children }) => {
  return (
    <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-4">{children}</h1>
  );
};
