import React from 'react';

export const PostBody: React.FC = ({ children }) => {
  return (
    <article className="w-full prose md:prose-md lg:prose-lg xl:prose-xl dark:prose-dark overflow-y-hidden">
      {children}
    </article>
  );
};
