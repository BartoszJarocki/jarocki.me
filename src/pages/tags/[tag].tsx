import { format } from 'date-fns';
import { GetStaticPaths, GetStaticProps } from 'next';
import Link from 'next/link';

import { DatedRowList } from '../../components/DatedRowList';
import { PageShell } from '../../components/PageShell';
import { Note, notesApi } from '../../lib/notesApi';

interface Props {
  tag: string;
  relatedNotes: Note[];
}

export default function Tag({ tag, relatedNotes }: Props) {
  const seoTitle = `#${tag}`;
  const seoDescription = `Notes tagged ${tag}.`;

  const items = relatedNotes.map((note) => ({
    key: note.slug,
    date: format(new Date(note.publishedAt), 'yyyy.MM.dd'),
    content: (
      <Link href={`/notes/${note.slug}`} className="ds-link-row">
        {note.title}
      </Link>
    ),
  }));

  return (
    <PageShell seoTitle={seoTitle} seoDescription={seoDescription}>
      <Link href="/notes" className="ds-nav-link text-xs">
        ← notes
      </Link>
      <h1 className="mt-12 text-base font-medium text-ink">
        Tagged <span className="font-mono text-body">#{tag}</span>
      </h1>
      <DatedRowList className="mt-16" items={items} />
    </PageShell>
  );
}

export const getStaticProps: GetStaticProps<Props, { tag: string }> = async (context) => {
  const tag = context.params?.tag;
  if (!tag) {
    return { notFound: true };
  }

  const relatedNotes = await notesApi.getNotesByTag(tag);

  return {
    props: { relatedNotes, tag },
    revalidate: 10,
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const tags = await notesApi.getAllTags();

  return {
    paths: tags.map((tag) => ({ params: { tag } })),
    fallback: 'blocking',
  };
};
