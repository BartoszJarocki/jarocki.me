import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import Image from 'next/image';
import { ComponentProps } from 'react';

import { Glossary, Term } from './Glossary';
import * as demos from './demos';

type Props = {
  source: MDXRemoteSerializeResult;
  className?: string;
};

// src/lib/notes.ts gives every local image its width and height, and an opening image priority.
function NoteImage({
  src = '',
  alt = '',
  width,
  height,
  priority,
}: ComponentProps<'img'> & { priority?: boolean }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={Number(width)}
      height={Number(height)}
      priority={priority}
      sizes="(max-width: 640px) 100vw, 37rem"
    />
  );
}

const components = { img: NoteImage, Glossary, Term, ...demos };

export function NoteContent({ source, className = '' }: Props) {
  return (
    <div className={`prose ${className}`}>
      <MDXRemote {...source} components={components} />
    </div>
  );
}
