import { format } from 'date-fns';
import { GetStaticProps } from 'next';
import Link from 'next/link';

import { DatedRowList } from '../../components/DatedRowList';
import { PageShell } from '../../components/PageShell';
import { Note, notesApi } from '../../lib/notesApi';

const seoTitle = 'Notes';
const seoDescription =
  'All of my thoughts on programming, building products, leadership, and more. Not structured.';

interface Props {
  notes: Note[];
}

export default function Notes({ notes }: Props) {
  const items = notes.map((note) => ({
    key: note.slug,
    date: format(new Date(note.publishedAt), 'yyyy.MM.dd'),
    content: (
      <Link href={`/notes/${note.slug}`} className="ds-link-row">
        {note.title}
        {note.inProgress && (
          <span className="ml-2 font-mono text-xs text-muted">(wip)</span>
        )}
      </Link>
    ),
  }));

  return (
    <PageShell seoTitle={seoTitle} seoDescription={seoDescription}>
      <h1 className="text-base font-medium text-ink">Notes</h1>
      <p className="mt-3 text-base text-body">Things I&apos;ve written. Mostly to myself.</p>
      <DatedRowList className="mt-16" items={items} />
    </PageShell>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const notes = await notesApi.getNotes('desc');

  return {
    props: { notes },
    revalidate: 10,
  };
};
