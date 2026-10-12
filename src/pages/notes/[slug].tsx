import { GetStaticPaths, GetStaticProps } from 'next';
import { MDXRemoteSerializeResult } from 'next-mdx-remote';
import Link from 'next/link';

import { NoteContent } from '../../components/NoteContent';
import { PageShell } from '../../components/PageShell';
import { dotDate } from '../../lib/date';
import { Note as NoteType, getNoteContent, getNotes } from '../../lib/notes';

type Props = {
  note: NoteType;
  noteContent: MDXRemoteSerializeResult;
  older: { slug: string; title: string } | null;
};

export default function Note({
  note: { title, description, publishedAt, tags },
  noteContent,
  older,
}: Props) {
  return (
    <PageShell
      seoTitle={title}
      seoDescription={description}
      article={{ publishedTime: publishedAt, tags }}
      current="notes"
    >
      <article className="mt-[72px]">
        <header>
          <p className="text-faint">
            <time dateTime={publishedAt}>{dotDate(publishedAt)}</time> · {tags.join(', ')}
          </p>
          <h1 className="mt-3.5 max-w-[24ch] text-balance font-sans text-[30px] font-semibold leading-[1.18] tracking-[-0.028em] text-ink">
            {title}
          </h1>
        </header>

        <NoteContent source={noteContent} className="mt-11" />

        <footer className="mt-[72px] flex max-w-[37rem] justify-between gap-[3ch]">
          <Link href="/notes" className="faint-link shrink-0">
            <span aria-hidden="true">←</span> all notes
          </Link>
          {older && (
            <Link href={`/notes/${older.slug}`} className="faint-link text-right">
              next: {older.title} <span aria-hidden="true">→</span>
            </Link>
          )}
        </footer>
      </article>
    </PageShell>
  );
}

export const getStaticProps: GetStaticProps<Props, { slug: string }> = async (context) => {
  const slug = context.params?.slug;
  const allNotes = getNotes();
  const index = allNotes.findIndex((n) => n.slug === slug);
  const note = allNotes[index];
  const noteContent = await getNoteContent(note.slug);
  const olderNote = allNotes[index + 1];
  const older = olderNote ? { slug: olderNote.slug, title: olderNote.title } : null;

  return {
    props: { note, noteContent, older },
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = getNotes();

  return {
    paths: posts.map((post) => ({ params: { slug: post.slug } })),
    fallback: false,
  };
};
