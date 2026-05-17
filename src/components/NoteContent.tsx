import Prism from 'prismjs';
import { useEffect } from 'react';

import { NotionBlockRenderer } from './notion/NotionBlockRenderer';

type Props = {
  blocks: any[];
  className?: string;
};

export function NoteContent({ blocks, className = '' }: Props) {
  useEffect(() => {
    Prism.highlightAll();
  }, [blocks]);

  return (
    <div className={`prose ${className}`}>
      {blocks.map((block) => (
        <NotionBlockRenderer key={block.id} block={block} />
      ))}
    </div>
  );
}
