import { GetStaticProps } from 'next';

import { Cased } from '../components/Cased';
import { Clock } from '../components/Clock';
import { ContributionSkyline } from '../components/ContributionSkyline';
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
import { JsonLd } from '../components/JsonLd';
import { PageShell } from '../components/PageShell';
import { Name, SiteUrl } from '../data/bio';
import { Elsewhere, GitHubUser } from '../data/links';
import { SideProjects } from '../data/projects';
import { Work } from '../data/work';
import { Activity, fetchActivity } from '../lib/githubActivity';
import { Note, getNotes } from '../lib/notes';

const seoDescription =
  'Building AI at Motion. Exploring what software engineering looks like when agents do most of the typing.';

const currentJob = Work.find((entry) => entry.end === 'Present');

const profilePage = {
  '@type': 'ProfilePage',
  mainEntity: {
    '@type': 'Person',
    name: Name,
    url: SiteUrl,
    image: `${SiteUrl}/assets/blog/authors/bartosz.jpeg`,
    jobTitle: currentJob?.title,
    worksFor: currentJob && {
      '@type': 'Organization',
      name: currentJob.company,
      url: currentJob.link,
    },
    address: { '@type': 'PostalAddress', addressLocality: 'Wrocław', addressCountry: 'PL' },
    sameAs: Elsewhere.map((link) => link.href).filter((href) => !href.startsWith('mailto:')),
  },
};

const website = { '@type': 'WebSite', name: Name, url: SiteUrl };

type Props = {
  latestNotes: Note[];
  noteCount: number;
  activity: Activity | null;
};

export default function Home({ latestNotes, noteCount, activity }: Props) {
  return (
    <PageShell seoDescription={seoDescription}>
      <JsonLd data={profilePage} />
      <JsonLd data={website} />
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
          <span className="plate-inline text-body">
            exploring what software engineering looks like when agents do most of the typing.
          </span>
        </p>
      </Lede>
      <Clock />

      {activity && (
        <IndexSection
          label="github"
          more={{
            href: `https://github.com/${GitHubUser}`,
            label: GitHubUser,
            context: 'on GitHub',
            external: true,
          }}
        >
          <ContributionSkyline activity={activity} />
        </IndexSection>
      )}

      <IndexSection
        label="notes"
        more={{ href: '/notes', label: `all ${noteCount}`, context: 'notes' }}
      >
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

      <IndexSection label="work" more={{ href: '/work', label: 'more', context: 'work' }}>
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
              main={<Cased>{link.value}</Cased>}
              trail={<span aria-hidden="true">↗</span>}
            />
          ))}
        </IndexList>
      </IndexSection>
    </PageShell>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const notes = getNotes();
  const activity = await fetchActivity(GitHubUser);

  return {
    props: { latestNotes: notes.slice(0, 5), noteCount: notes.length, activity },
    revalidate: 3600,
  };
};
