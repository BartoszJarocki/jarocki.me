import React from 'react';
import Image from 'next/image';

type Props = {
  img: StaticImageData;
  title: string;
  subTitle?: string;
};

export const PhotoCard: React.FC<Props> = ({ img, title, subTitle, ...otherProps }) => {
  return (
    <div
      className="rounded overflow-hidden border border-zinc-300 dark:border-zinc-700"
      {...otherProps}
    >
      <div className="h-28 w-full relative">
        <Image layout="fill" placeholder="blur" src={img} alt={title} />
      </div>

      <div className="px-3 py-2">
        <h3 className="font-bold text-base mb-2">{title}</h3>
        <p className="text-sm">{subTitle}</p>
      </div>
    </div>
  );
};
