import { GetStaticPaths, GetStaticProps } from 'next';
import Link from 'next/link';

import { IndexList, IndexSection, Lede, NoteRow, entriesLabel } from '../../components/Index';
import { PageShell } from '../../components/PageShell';
import { Note, notesApi } from '../../lib/notesApi';

interface Props {
  tag: string;
  relatedNotes: Note[];
}

export default function Tag({ tag, relatedNotes }: Props) {
  const seoTitle = `#${tag}`;
  const seoDescription = `Notes tagged ${tag}.`;

  return (
    <PageShell seoTitle={seoTitle} seoDescription={seoDescription} current="notes">
      <Lede>
        <p>tagged #{tag}</p>
      </Lede>
      <IndexSection label={entriesLabel(relatedNotes.length)}>
        <IndexList>
          {relatedNotes.map((note) => (
            <NoteRow key={note.slug} note={note} />
          ))}
        </IndexList>
      </IndexSection>
      <p className="mt-14">
        <Link href="/notes" className="faint-link">
          ← all notes
        </Link>
      </p>
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
