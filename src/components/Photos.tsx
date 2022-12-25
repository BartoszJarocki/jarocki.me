import Image, { StaticImageData } from 'next/image';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { travelImages } from '../images/travel';
import { useState } from 'react';

const possibleRotations = [1.3, -1.3, 1.3, -1.3, 1.3, -1.3];

function Photo({ img, title, alt }: { img: StaticImageData; title: string; alt: string }) {
  const [randomRotation] = useState(
    () => possibleRotations[Math.floor(Math.random() * possibleRotations.length)],
  );
  const [isVisible, setIsVisible] = useState(false);

  return (
    <motion.div
      key={img.src}
      initial={{ scale: 1, rotate: randomRotation }}
      whileHover={{ scale: 1.1, rotate: 0 }}
      onHoverStart={() => setIsVisible(true)}
      onHoverEnd={() => setIsVisible(false)}
      className={clsx(
        'relative aspect-[9/10] w-44 flex-none overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800 sm:w-72 sm:rounded-2xl',
      )}
    >
      <Image
        src={img}
        alt={alt}
        sizes="(min-width: 640px) 18rem, 11rem"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <AnimatePresence>
        {isVisible && (
          <motion.h3
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute left-0 bottom-0 w-full bg-gradient-to-t from-black/80 via-black/50 px-3 py-2 font-mono text-xs font-bold"
          >
            {title}
          </motion.h3>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function Photos() {
  return (
    <div className="mt-16 sm:mt-20">
      <div className="hide-scrollbar -my-4 flex gap-5 overflow-y-auto py-4 px-8 sm:gap-8">
        {travelImages.map((travelImage) => (
          <Photo
            key={travelImage.img.src}
            img={travelImage.img}
            title={travelImage.title}
            alt={travelImage.alt}
          />
        ))}
      </div>
    </div>
  );
}
