import { GetStaticPaths, GetStaticProps } from 'next';
import { ArticleJsonLd } from 'next-seo';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';

import { NoteContent } from '../../components/NoteContent';
import { PageShell } from '../../components/PageShell';
import { dotDate } from '../../lib/date';
import { Note as NoteType, notesApi } from '../../lib/notesApi';

type Props = {
  note: NoteType;
  noteContent: any[];
  older: { slug: string; title: string } | null;
};

export default function Note({
  note: { title, description, createdAt, publishedAt, inProgress, tags },
  noteContent,
  older,
}: Props) {
  const router = useRouter();
  const url = `${process.env.NEXT_PUBLIC_URL}${router.asPath}`;
  const openGraphImageUrl = `${process.env.NEXT_PUBLIC_URL}/api/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}`;

  return (
    <>
      <ArticleJsonLd
        url={url}
        images={[openGraphImageUrl]}
        title={title}
        datePublished={createdAt}
        authorName="Bartosz Jarocki"
        description={description}
      />
      <PageShell seoTitle={title} seoDescription={description} current="notes">
        <article className="mt-[72px]">
          <header>
            <p className="text-faint">
              <time dateTime={publishedAt}>{dotDate(publishedAt)}</time>
              {inProgress && ' (wip)'}
              {tags.length > 0 && ' · '}
              {tags.map((tag, i) => (
                <React.Fragment key={tag}>
                  {i > 0 && ', '}
                  <Link href={`/tags/${encodeURIComponent(tag)}`} className="faint-link">
                    {tag}
                  </Link>
                </React.Fragment>
              ))}
            </p>
            <h1 className="mt-3.5 max-w-[24ch] text-balance font-sans text-[30px] font-semibold leading-[1.18] tracking-[-0.028em] text-ink">
              {title}
            </h1>
          </header>

          <NoteContent blocks={noteContent} className="mt-11" />

          <footer className="mt-[72px] flex max-w-[37rem] justify-between gap-[3ch]">
            <Link href="/notes" className="faint-link shrink-0">
              ← all notes
            </Link>
            {older && (
              <Link href={`/notes/${older.slug}`} className="faint-link text-right">
                next: {older.title} →
              </Link>
            )}
          </footer>
        </article>
      </PageShell>
    </>
  );
}

export const getStaticProps: GetStaticProps<Props, { slug: string }> = async (context) => {
  const slug = context.params?.slug;
  const allNotes = await notesApi.getNotes('desc');
  const index = allNotes.findIndex((n) => n.slug === slug);
  const note = allNotes[index];

  if (!note) {
    return { notFound: true };
  }

  const noteContent = await notesApi.getNote(note.id);
  const olderNote = allNotes[index + 1];
  const older = olderNote ? { slug: olderNote.slug, title: olderNote.title } : null;

  return {
    props: { note, noteContent, older },
    revalidate: 10,
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await notesApi.getNotes();

  return {
    paths: posts.map((post) => ({ params: { slug: post.slug } })),
    fallback: 'blocking',
  };
};
