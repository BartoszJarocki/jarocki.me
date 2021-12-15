import React from 'react';

export const PostBody: React.FC = ({ children }) => {
  return <div className="w-full prose overflow-y-hidden">{children}</div>;
};
