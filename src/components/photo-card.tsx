import React from 'react';
import Image from 'next/image';

type Props = {
  img: StaticImageData;
  title: string;
  subTitle?: string;
};

export const PhotoCard: React.FC<Props> = ({ img, title, subTitle, ...otherProps }) => {
  return (
    <div className="rounded overflow-hidden shadow-md" {...otherProps}>
      <div className="h-32 w-full relative">
        <Image layout="fill" src={img} alt={title} />
      </div>

      <div className="px-4 py-4">
        <h3 className="font-bold text-l mb-2">{title}</h3>
        <p className="text-gray-700 text-sm">{subTitle}</p>
      </div>
    </div>
  );
};
