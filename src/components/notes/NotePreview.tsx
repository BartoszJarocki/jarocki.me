import clsx from 'clsx';
import { motion } from 'framer-motion';
import React from 'react';

import { formatDate } from '../../lib/date';
import { Note } from '../../lib/notesApi';
import { Card } from '../Card';

const StaticBadge = ({ className, children }: React.PropsWithChildren<{ className?: string }>) => (
  <span
    className={clsx(
      className,
      'inline-flex items-center rounded-md bg-primary px-1 py-0 text-xs font-medium text-white',
    )}
  >
    {children}
  </span>
);

interface Props {
  note: Note;
  dense?: boolean;
}

export const NotePreview = ({ note, dense }: Props) => {
  return (
    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
      <article className="md:grid md:grid-cols-4 md:items-baseline">
        <Card className="md:col-span-3">
          <Card.Title href={`/notes/${note.slug}`}>
            {note.title}
            {note.inProgress && <StaticBadge className="ml-2">Work in progress</StaticBadge>}
          </Card.Title>
          <Card.Eyebrow
            as="time"
            dateTime={note.publishedAt}
            className={clsx(!dense && 'md:hidden')}
            decorate
          >
            {formatDate(note.publishedAt)}
          </Card.Eyebrow>
          <Card.Description>{note.description}</Card.Description>
          <Card.Cta>Read note</Card.Cta>
        </Card>
        {!dense && (
          <Card.Eyebrow as="time" dateTime={note.publishedAt} className="mt-1 hidden md:block">
            {formatDate(note.publishedAt)}
          </Card.Eyebrow>
        )}
      </article>
    </motion.div>
  );
};
