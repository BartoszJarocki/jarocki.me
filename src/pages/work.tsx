import React from 'react';

import { DatedRowList } from '../components/DatedRowList';
import { PageShell } from '../components/PageShell';
import { PastProjects, Project, SideProjects } from '../data/projects';
import { Work } from '../data/work';

const seoTitle = 'Work';
const seoDescription = "What I've worked on, lately and otherwise.";

function ProjectRow({ project }: { project: Project }) {
  return (
    <li className="grid grid-cols-1 gap-y-0.5 py-1.5 sm:contents">
      {project.href ? (
        <a
          href={project.href}
          target="_blank"
          rel="noopener noreferrer"
          className="ds-link"
        >
          {project.title}
        </a>
      ) : (
        <span className="text-base text-ink">{project.title}</span>
      )}
      <span className="text-base text-body">{project.description}</span>
    </li>
  );
}

export default function WorkPage() {
  const timelineItems = Work.map((role) => ({
    key: role.company,
    date: `${role.start} / ${role.end === 'Present' ? 'now' : role.end}`,
    content: (
      <div>
        {role.link ? (
          <a
            href={role.link}
            target="_blank"
            rel="noopener noreferrer"
            className="ds-link font-medium"
          >
            {role.company}
          </a>
        ) : (
          <span className="text-base font-medium text-ink">{role.company}</span>
        )}
        <div className="text-sm text-body">{role.title}</div>
      </div>
    ),
  }));

  const featured = PastProjects.slice(0, 2);
  const mobile = PastProjects.slice(2);

  return (
    <PageShell seoTitle={seoTitle} seoDescription={seoDescription}>
      <h1 className="text-base font-medium text-ink">Work</h1>
      <p className="mt-3 text-base text-body">
        Building AI at{' '}
        <a
          href="https://motionapp.com"
          target="_blank"
          rel="noopener noreferrer"
          className="ds-link"
        >
          Motion
        </a>
        . Care about the gap between &ldquo;it works&rdquo; and &ldquo;it feels right&rdquo;.
        Usually that&rsquo;s where the real work is.
      </p>

      <section className="mt-16">
        <h2 className="ds-section-label">Side projects</h2>
        <ul className="mt-4 sm:grid sm:grid-cols-[max-content_1fr] sm:items-baseline sm:gap-x-6 sm:gap-y-1.5">
          {SideProjects.map((project) => (
            <ProjectRow key={project.title} project={project} />
          ))}
        </ul>
      </section>

      <section className="mt-16">
        <h2 className="ds-section-label">Timeline</h2>
        <DatedRowList className="mt-4" items={timelineItems} />
      </section>

      <section className="mt-16">
        <h2 className="ds-section-label">Past</h2>
        <ul className="mt-4 sm:grid sm:grid-cols-[max-content_1fr] sm:items-baseline sm:gap-x-6 sm:gap-y-1.5">
          {featured.map((project) => (
            <ProjectRow key={project.title} project={project} />
          ))}
        </ul>
        <p className="mt-6 text-base text-body">
          And many mobile apps for companies like{' '}
          {mobile.map((p, i, arr) => (
            <React.Fragment key={p.title}>
              {i > 0 && (i === arr.length - 1 ? ', and ' : ', ')}
              {p.href ? (
                <a
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ds-link"
                >
                  {p.title}
                </a>
              ) : (
                <span className="text-ink">{p.title}</span>
              )}
            </React.Fragment>
          ))}
          .
        </p>
      </section>
    </PageShell>
  );
}
