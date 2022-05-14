import React from 'react';

export const PostBody: React.FC = ({ children }) => {
  return (
    <article className="md:prose-md prose w-full overflow-y-hidden dark:prose-dark">
      {children}
    </article>
  );
};
