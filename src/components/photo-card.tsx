import React from 'react';
import Image, { StaticImageData } from 'next/image';

type Props = {
  img: StaticImageData;
  title: string;
  subTitle?: string;
};

export const PhotoCard: React.FC<Props> = ({ img, title, subTitle, ...otherProps }) => {
  return (
    <div className="overflow-hidden" {...otherProps}>
      <div className="h-28 w-full relative">
        <Image layout="fill" placeholder="blur" src={img} alt={title} />
      </div>

      <div className="py-2">
        <h3 className="font-bold text-sm leading-none mb-2">{title}</h3>
        <p className="text-xs">{subTitle}</p>
      </div>
    </div>
  );
};
