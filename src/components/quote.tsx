import React from 'react';

type Props = {
  quote: string;
  author: string;
};

export const Quote: React.FC<Props> = ({ quote, author, ...otherProps }) => {
  return (
    <div {...otherProps}>
      <blockquote>
        <p>{quote}</p>
        {author}
      </blockquote>
    </div>
  );
};
