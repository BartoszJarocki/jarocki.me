import React from 'react';

export const PostBody: React.FC = ({ children }) => {
  return <div className="w-full prose lg:prose-lg w-max overflow-y-hidden">{children}</div>;
};
