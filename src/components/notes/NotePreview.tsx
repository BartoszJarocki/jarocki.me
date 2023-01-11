import clsx from 'clsx';
import { motion } from 'framer-motion';

import { Blog } from '../../../.contentlayer/generated';
import { formatDate } from '../../lib/date';
import { Card } from '../Card';

interface Props {
  blogPost: Blog;
  dense?: boolean;
}

export const NotePreview = ({ blogPost, dense }: Props) => {
  return (
    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
      <article className="md:grid md:grid-cols-4 md:items-baseline">
        <Card className="md:col-span-3">
          <Card.Title href={`/notes/${blogPost.slug}`}>{blogPost.title}</Card.Title>
          <Card.Eyebrow
            as="time"
            dateTime={blogPost.date}
            className={clsx(!dense && 'md:hidden')}
            decorate
          >
            {formatDate(blogPost.date)}
          </Card.Eyebrow>
          <Card.Description>{blogPost.description}</Card.Description>
          <Card.Cta>Read note</Card.Cta>
        </Card>
        {!dense && (
          <Card.Eyebrow as="time" dateTime={blogPost.date} className="mt-1 hidden md:block">
            {formatDate(blogPost.date)}
          </Card.Eyebrow>
        )}
      </article>
    </motion.div>
  );
};
