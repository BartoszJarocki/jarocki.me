import React from 'react';

import {
  ExternalLink,
  IndexList,
  IndexRow,
  IndexSection,
  Lede,
  ProjectRow,
  WorkRow,
} from '../components/Index';
import { PageShell } from '../components/PageShell';
import { PastProjects, SideProjects } from '../data/projects';
import { Work } from '../data/work';

const seoTitle = 'Work';
const seoDescription = "What I've worked on, lately and otherwise.";

export default function WorkPage() {
  const featured = PastProjects.slice(0, 2);
  const mobile = PastProjects.slice(2);

  return (
    <PageShell seoTitle={seoTitle} seoDescription={seoDescription} current="work">
      <Lede>
        <p>
          Building AI at{' '}
          <ExternalLink href="https://motionapp.com" className="text-link">
            Motion
          </ExternalLink>
          . Care about the gap between &ldquo;it works&rdquo; and &ldquo;it feels right&rdquo;.
          Usually that&rsquo;s where the real work is.
        </p>
      </Lede>

      <IndexSection label="timeline">
        <IndexList>
          {Work.map((entry) => (
            <WorkRow key={entry.company} entry={entry} />
          ))}
        </IndexList>
      </IndexSection>

      <IndexSection label="side projects">
        <IndexList>
          {SideProjects.map((project) => (
            <ProjectRow key={project.title} project={project} />
          ))}
        </IndexList>
      </IndexSection>

      <IndexSection label="past">
        <IndexList>
          {featured.map((project) => (
            <IndexRow
              key={project.title}
              href={project.href}
              external
              lead={project.title}
              leadTone="ink"
              main={project.description}
              mainTone="body"
              clip
            />
          ))}
        </IndexList>
        <p className="mt-5">
          And many mobile apps for companies like{' '}
          {mobile.map((project, i, all) => (
            <React.Fragment key={project.title}>
              {i > 0 && (i === all.length - 1 ? ', and ' : ', ')}
              {project.href ? (
                <ExternalLink href={project.href} className="text-link">
                  {project.title}
                </ExternalLink>
              ) : (
                <span className="text-ink">{project.title}</span>
              )}
            </React.Fragment>
          ))}
          .
        </p>
      </IndexSection>
    </PageShell>
  );
}
