import { GetStaticProps } from 'next';

import { IndexList, IndexSection, Lede, NoteRow, entriesLabel } from '../../components/Index';
import { PageShell } from '../../components/PageShell';
import { Note, notesApi } from '../../lib/notesApi';

const seoTitle = 'Notes';
const seoDescription =
  'All of my thoughts on programming, building products, leadership, and more. Not structured.';

interface Props {
  notes: Note[];
}

export default function Notes({ notes }: Props) {
  return (
    <PageShell seoTitle={seoTitle} seoDescription={seoDescription} current="notes">
      <Lede>
        <p>Things I&apos;ve written. Mostly to myself.</p>
      </Lede>
      <IndexSection label={entriesLabel(notes.length)}>
        <IndexList>
          {notes.map((note) => (
            <NoteRow key={note.slug} note={note} withTags />
          ))}
        </IndexList>
      </IndexSection>
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
