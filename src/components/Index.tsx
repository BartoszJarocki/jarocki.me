import clsx from 'clsx';
import Link from 'next/link';
import React, { CSSProperties, ComponentPropsWithoutRef, ReactNode } from 'react';

import type { Project } from '../data/projects';
import type { WorkEntry } from '../data/work';
import { dotDate } from '../lib/date';
import type { Note } from '../lib/notes';
import { Cased } from './Cased';

type Tone = 'ink' | 'body' | 'faint';

const toneClass: Record<Tone, string> = {
  ink: 'text-ink',
  body: 'text-body',
  faint: 'text-faint',
};

export function ExternalLink({ children, ...props }: ComponentPropsWithoutRef<'a'>) {
  return (
    <a target="_blank" rel="noopener noreferrer" {...props}>
      {children}
      <span className="sr-only"> (opens in new tab)</span>
    </a>
  );
}

export function Lede({ children }: { children: ReactNode }) {
  return <div className="mt-10 max-w-[64ch] text-ink">{children}</div>;
}

type SectionProps = {
  label: string;
  more?: { href: string; label: string; context: string; external?: boolean };
  children: ReactNode;
};

export function IndexSection({ label, more, children }: SectionProps) {
  const moreText = more && (
    <>
      <Cased>{more.label}</Cased>
      <span className="sr-only"> {more.context}</span>{' '}
      <span aria-hidden="true">{more.external ? '↗' : '→'}</span>
    </>
  );
  return (
    <section className="mt-14">
      <div className="mb-2 flex justify-between gap-[3ch] text-faint">
        <h2 className="plate">{label}</h2>
        {more &&
          (more.external ? (
            <ExternalLink href={more.href} className="faint-link plate">
              {moreText}
            </ExternalLink>
          ) : (
            <Link href={more.href} className="faint-link plate">
              {moreText}
            </Link>
          ))}
      </div>
      {children}
    </section>
  );
}

type ListProps = {
  lead?: string;
  leadMobile?: string;
  children: ReactNode;
};

export function IndexList({ lead, leadMobile, children }: ListProps) {
  const columns = { '--c1': lead, '--c1m': leadMobile } as CSSProperties;
  return <ul style={columns}>{children}</ul>;
}

type RowProps = {
  href?: string;
  external?: boolean;
  lead: ReactNode;
  main: ReactNode;
  trail?: ReactNode;
  leadTone?: Tone;
  mainTone?: Tone;
  clip?: boolean;
  stackTrail?: boolean;
};

export function IndexRow({
  href,
  external,
  lead,
  main,
  trail,
  leadTone = 'faint',
  mainTone = 'ink',
  clip,
  stackTrail,
}: RowProps) {
  const cells = (
    <>
      <span className={toneClass[leadTone]}>{lead}</span>
      <span className={clsx(toneClass[mainTone], clip && 'index-clip')}>{main}</span>
      {trail && (
        <span className={clsx('index-trail text-faint', stackTrail && 'index-trail-stack')}>
          {trail}
        </span>
      )}
    </>
  );

  return (
    <li>
      {href && external ? (
        <ExternalLink href={href} className="index-row">
          {cells}
        </ExternalLink>
      ) : href ? (
        <Link href={href} className="index-row">
          {cells}
        </Link>
      ) : (
        <div className="index-row">{cells}</div>
      )}
    </li>
  );
}

export function NoteRow({ note, withTags = false }: { note: Note; withTags?: boolean }) {
  return (
    <IndexRow
      href={`/notes/${note.slug}`}
      lead={dotDate(note.publishedAt)}
      main={note.title}
      trail={withTags ? note.tags.join(', ') : undefined}
      clip
    />
  );
}

export function WorkRow({ entry }: { entry: WorkEntry }) {
  const end = entry.end === 'Present' ? 'now' : entry.end;
  return (
    <IndexRow
      href={entry.link}
      external
      lead={`${entry.start}–${end}`}
      main={entry.company}
      trail={entry.title}
      stackTrail
    />
  );
}

export function ProjectRow({ project }: { project: Project }) {
  return (
    <IndexRow
      href={project.href}
      external
      lead={project.title}
      leadTone="ink"
      main={project.description}
      mainTone="body"
      trail={project.href && new URL(project.href).hostname.replace(/^www\./, '')}
    />
  );
}

export function entriesLabel(count: number) {
  return `${count} ${count === 1 ? 'entry' : 'entries'}`;
}
