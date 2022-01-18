import React from 'react';

export const PostBody: React.FC = ({ children }) => {
  return (
    <article className="w-full prose md:prose-md dark:prose-dark overflow-y-hidden">
      {children}
    </article>
  );
};
