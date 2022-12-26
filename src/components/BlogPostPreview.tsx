import clsx from 'clsx';

import { Blog } from '../../.contentlayer/generated';
import { formatDate } from '../lib/date';
import { Card } from './Card';

interface Props {
  blogPost: Blog;
  dense?: boolean;
}

export const BlogPostPreview = ({ blogPost, dense }: Props) => {
  return (
    <article className="md:grid md:grid-cols-4 md:items-baseline">
      <Card className="md:col-span-3">
        <Card.Title href={`/blog/${blogPost.slug}`}>{blogPost.title}</Card.Title>
        <Card.Eyebrow
          as="time"
          dateTime={blogPost.date}
          className={clsx(!dense && 'md:hidden')}
          decorate
        >
          {formatDate(blogPost.date)}
        </Card.Eyebrow>
        <Card.Description>{blogPost.description}</Card.Description>
        <Card.Cta>Read article</Card.Cta>
      </Card>
      {!dense && (
        <Card.Eyebrow as="time" dateTime={blogPost.date} className="mt-1 hidden md:block">
          {formatDate(blogPost.date)}
        </Card.Eyebrow>
      )}
    </article>
  );
};
