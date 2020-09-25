import React from 'react';

export const PostBody: React.FC = ({ children }) => {
  return <div className="w-full prose lg:prose-lg post-body">{children}</div>;
};
