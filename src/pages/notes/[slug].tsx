import { GetStaticPaths, GetStaticProps } from 'next';
import { MDXRemoteSerializeResult } from 'next-mdx-remote';
import localFont from 'next/font/local';
import Link from 'next/link';

import { IndexList, IndexRow, IndexSection } from '../../components/Index';
import { NoteContent } from '../../components/NoteContent';
import { PageShell } from '../../components/PageShell';
import { dotDate } from '../../lib/date';
import {
  Note as NoteType,
  SeriesPart,
  getNoteContent,
  getNotes,
  seriesParts,
} from '../../lib/notes';

const GeistSans = localFont({
  src: '../../fonts/Geist-Variable.woff2',
  variable: '--font-geist-sans',
  weight: '100 900',
});

type Props = {
  note: NoteType;
  noteContent: MDXRemoteSerializeResult;
  older: { slug: string; title: string } | null;
  parts: SeriesPart[];
};

export default function Note({
  note: { title, description, publishedAt, tags, draft, part },
  noteContent,
  older,
  parts,
}: Props) {
  const previous = parts.find((item) => item.part === (part ?? 0) - 1);
  const next = parts.find((item) => item.part === (part ?? 0) + 1);
  return (
    <PageShell
      seoTitle={title}
      seoDescription={description}
      article={{ publishedTime: publishedAt, tags }}
      current="notes"
      noindex={draft}
    >
      <article className={`${GeistSans.variable} mt-[72px]`}>
        <header>
          <p className="plate w-fit text-faint">
            <time dateTime={publishedAt}>{dotDate(publishedAt)}</time> · {tags.join(', ')}
          </p>
          <h1 className="mt-3.5 max-w-[24ch] text-balance font-sans text-[30px] font-semibold leading-[1.18] tracking-[-0.028em] text-ink">
            {title}
          </h1>
        </header>

        <NoteContent source={noteContent} className="mt-11" />

        {parts.length > 0 && (
          <nav aria-label="The AI series">
            <IndexSection label="the ai series">
              <IndexList lead="7ch" leadMobile="7ch">
                {parts.map((item) => (
                  <IndexRow
                    key={item.part}
                    href={item.slug ? `/notes/${item.slug}` : undefined}
                    lead={
                      <span aria-current={item.part === part ? 'page' : undefined}>
                        part {item.part}
                        {item.part === part && <span className="sr-only">, current part</span>}
                      </span>
                    }
                    main={item.title}
                    trail={item.slug ? undefined : 'coming soon'}
                    stackTrail
                  />
                ))}
              </IndexList>
            </IndexSection>
          </nav>
        )}

        <footer className="mt-[72px] flex max-w-[37rem] justify-between gap-[3ch]">
          <Link href="/notes" className="faint-link plate shrink-0">
            <span aria-hidden="true">←</span> all notes
          </Link>
          {part ? (
            <div className="flex flex-wrap justify-end gap-x-[3ch] gap-y-2">
              {previous?.slug && (
                <Link href={`/notes/${previous.slug}`} className="faint-link plate">
                  <span aria-hidden="true">←</span> part {previous.part}
                </Link>
              )}
              {next?.slug && (
                <Link href={`/notes/${next.slug}`} className="faint-link plate">
                  part {next.part} <span aria-hidden="true">→</span>
                </Link>
              )}
            </div>
          ) : (
            older && (
              <Link href={`/notes/${older.slug}`} className="faint-link plate text-right">
                next: {older.title}&nbsp;<span aria-hidden="true">→</span>
              </Link>
            )
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
    props: { note, noteContent, older, parts: note.series ? seriesParts(note.series) : [] },
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = getNotes();

  return {
    paths: posts.map((post) => ({ params: { slug: post.slug } })),
    fallback: false,
  };
};
