import { useEffect } from 'react';

import { NotionBlockRenderer } from './notion/NotionBlockRenderer';

type Props = {
  blocks: any[];
  className?: string;
};

export function NoteContent({ blocks, className = '' }: Props) {
  useEffect(() => {
    // Prism highlights the whole document as soon as it loads. Loading it here, after hydration,
    // keeps it from rewriting the server HTML before React hydrates.
    import('prismjs').then(({ default: Prism }) => Prism.highlightAll());
  }, [blocks]);

  return (
    <div className={`prose ${className}`}>
      {blocks.map((block, i) => (
        // Grouped list blocks are built by notesApi and have no Notion id.
        <NotionBlockRenderer key={block.id ?? i} block={block} />
      ))}
    </div>
  );
}
