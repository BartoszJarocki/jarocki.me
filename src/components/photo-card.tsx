import React from 'react';

type Props = {
  imgSrc: string;
  title: string;
  subTitle?: string;
};

export const PhotoCard: React.FC<Props> = ({ imgSrc, title, subTitle, ...otherProps }) => {
  return (
    <div className="rounded overflow-hidden shadow-md" {...otherProps}>
      <img className="w-full" src={imgSrc} alt={title} />
      <div className="px-4 py-4">
        <div className="font-bold text-l mb-2">{title}</div>
        {subTitle && <p className="text-gray-700 text-sm">{subTitle}</p>}
      </div>
    </div>
  );
};
