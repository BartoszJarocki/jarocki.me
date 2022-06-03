import React from 'react';
import { PropsWithChildren } from 'src/@types/react';

export const PostBody: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <article className="md:prose-md prose w-full overflow-y-hidden dark:prose-dark">
      {children}
    </article>
  );
};
