import { format } from 'date-fns';
import { GetStaticPaths, GetStaticProps } from 'next';
import { ArticleJsonLd } from 'next-seo';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { NoteContent } from '../../components/NoteContent';
import { PageShell } from '../../components/PageShell';
import { Note as NoteType, notesApi } from '../../lib/notesApi';

type Props = {
  note: NoteType;
  noteContent: any[];
};

export default function Note({
  note: { title, description, createdAt, publishedAt, inProgress },
  noteContent,
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
      <PageShell seoTitle={title} seoDescription={description}>
        <Link href="/notes" className="ds-nav-link text-xs">
          ← notes
        </Link>

        <article className="mt-12">
          <header>
            <time dateTime={publishedAt} className="ds-mono-date">
              {format(new Date(publishedAt), 'yyyy.MM.dd')}
              {inProgress && <span className="ml-3 text-muted">(wip)</span>}
            </time>
            <h1 className="mt-3 text-balance text-2xl font-medium tracking-tight text-ink sm:text-3xl">
              {title}
            </h1>
          </header>

          <NoteContent blocks={noteContent} className="mt-12" />
        </article>
      </PageShell>
    </>
  );
}

export const getStaticProps: GetStaticProps<Props, { slug: string }> = async (context) => {
  const slug = context.params?.slug;
  const allNotes = await notesApi.getNotes();
  const note = allNotes.find((n) => n.slug === slug);

  if (!note) {
    return { notFound: true };
  }

  const noteContent = await notesApi.getNote(note.id);

  return {
    props: { note, noteContent },
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
