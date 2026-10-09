import { GetStaticProps } from 'next';

import {
  ExternalLink,
  IndexList,
  IndexRow,
  IndexSection,
  Lede,
  NoteRow,
  ProjectRow,
  WorkRow,
} from '../components/Index';
import { PageShell } from '../components/PageShell';
import { Elsewhere } from '../data/links';
import { SideProjects } from '../data/projects';
import { Work } from '../data/work';
import { Note, notesApi } from '../lib/notesApi';

const seoTitle = 'Bartosz Jarocki';
const seoDescription =
  'Building AI at Motion. Exploring what software engineering looks like when agents do most of the typing.';

type Props = {
  latestNotes: Note[];
  noteCount: number;
};

export default function Home({ latestNotes, noteCount }: Props) {
  return (
    <PageShell seoTitle={seoTitle} seoDescription={seoDescription}>
      <Lede>
        <p>
          building AI at{' '}
          <ExternalLink href="https://motionapp.com" className="text-link">
            motion
          </ExternalLink>{' '}
          —{' '}
          <ExternalLink href="https://motionapp.com/careers" className="text-link">
            we&apos;re hiring
          </ExternalLink>
          !
          <br />
          <span className="text-body">
            exploring what software engineering looks like when agents do most of the typing.
          </span>
        </p>
      </Lede>

      <IndexSection label="notes" more={{ href: '/notes', label: `all ${noteCount} →` }}>
        <IndexList>
          {latestNotes.map((note) => (
            <NoteRow key={note.slug} note={note} />
          ))}
        </IndexList>
      </IndexSection>

      <IndexSection label="projects">
        <IndexList>
          {SideProjects.map((project) => (
            <ProjectRow key={project.title} project={project} />
          ))}
        </IndexList>
      </IndexSection>

      <IndexSection label="work" more={{ href: '/work', label: 'more →' }}>
        <IndexList>
          {Work.slice(0, 3).map((entry) => (
            <WorkRow key={entry.company} entry={entry} />
          ))}
        </IndexList>
      </IndexSection>

      <IndexSection label="elsewhere">
        <IndexList>
          {Elsewhere.map((link) => (
            <IndexRow
              key={link.key}
              href={link.href}
              external={link.href.startsWith('http')}
              lead={link.key}
              main={link.value}
              trail={<span aria-hidden="true">↗</span>}
            />
          ))}
        </IndexList>
      </IndexSection>
    </PageShell>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const notes = await notesApi.getNotes('desc');

  return {
    props: { latestNotes: notes.slice(0, 5), noteCount: notes.length },
    revalidate: 10,
  };
};
