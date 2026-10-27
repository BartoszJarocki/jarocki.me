import { AboutExtended, SiteUrl } from '../data/bio.ts';
import { Books } from '../data/books.ts';
import { Elsewhere, GitHubUser } from '../data/links.ts';
import { PastProjects, type Project, SideProjects } from '../data/projects.ts';
import { Work, type WorkEntry } from '../data/work.ts';
import { LEVELS } from './activityStats.ts';
import { dotDate, monthYear } from './date.ts';
import { type Activity, weeklyTotals } from './githubActivity.ts';
import type { Note, SeriesPart } from './notes.ts';
import { type Block, type Row, type Run, literal, lowered } from './textPage.ts';

const count = new Intl.NumberFormat('en-US');

const pathTrail = (path: string) => [literal(path, 'faint')];

const pathRow = (label: string, path: string): Row => ({
  lead: [],
  main: [lowered(label, 'faint')],
  trail: pathTrail(path),
});

const noteRow = (note: Note): Row => ({
  lead: [lowered(dotDate(note.publishedAt), 'faint')],
  main: [lowered(note.title)],
  trail: pathTrail(`/notes/${note.slug}`),
});

const workRow = (entry: WorkEntry): Row => ({
  lead: [lowered(`${entry.start}–${entry.end === 'Present' ? 'now' : entry.end}`, 'faint')],
  main: [lowered(entry.company)],
  trail: [lowered(entry.title, 'faint')],
});

const projectRow = (project: Project): Row => ({
  lead: [lowered(project.title)],
  main: [lowered(project.description, 'body')],
  trail: project.href
    ? [literal(new URL(project.href).hostname.replace(/^www\./, ''), 'faint')]
    : [],
});

const paragraph = (...runs: Run[]): Block => ({ kind: 'paragraph', runs });

export function homePage(notes: Note[], activity: Activity | null): Block[] {
  const github: Block[] = activity
    ? [
        {
          kind: 'art',
          label: 'github',
          more: [literal(`github.com/${GitHubUser}`, 'faint')],
          lines: contributionBars(activity.dates, activity.contributions),
        },
      ]
    : [];
  return [
    { kind: 'header' },
    paragraph(
      lowered("building AI at motion — we're hiring!"),
      literal('\n'),
      lowered(
        'exploring what software engineering looks like when agents do most of the typing.',
        'body',
      ),
    ),
    ...github,
    {
      kind: 'section',
      label: 'notes',
      more: [lowered(`all ${notes.length}`, 'faint'), literal('  /notes', 'faint')],
      rows: notes.slice(0, 5).map(noteRow),
    },
    { kind: 'section', label: 'projects', rows: SideProjects.map(projectRow) },
    {
      kind: 'section',
      label: 'work',
      more: pathTrail('/work'),
      rows: Work.slice(0, 3).map(workRow),
    },
    {
      kind: 'section',
      label: 'elsewhere',
      rows: Elsewhere.map((link) => ({
        lead: [lowered(link.key, 'faint')],
        main: [
          literal(
            link.href.startsWith('mailto:') ? link.value : link.href.replace(/^https?:\/\//, ''),
          ),
        ],
      })),
    },
    paragraph(
      lowered('read a note: curl ', 'faint'),
      literal(`${SiteUrl}/notes/${notes[0].slug}`, 'faint'),
    ),
  ];
}

export function notesPage(notes: Note[]): Block[] {
  return [
    { kind: 'header', current: 'notes' },
    paragraph(lowered("Things I've written. Mostly to myself.")),
    {
      kind: 'section',
      label: `${notes.length} ${notes.length === 1 ? 'entry' : 'entries'}`,
      rows: notes.map(noteRow),
    },
  ];
}

type NotePage = { note: Note; prose: Block[]; older?: Note; parts: SeriesPart[] };

export function notePage({ note, prose, older, parts }: NotePage): Block[] {
  const previous = parts.find((item) => item.part === (note.part ?? 0) - 1);
  const next = parts.find((item) => item.part === (note.part ?? 0) + 1);
  const footer = [pathRow('← all notes', '/notes')];
  if (note.part) {
    if (previous?.slug) footer.push(pathRow(`← part ${previous.part}`, `/notes/${previous.slug}`));
    if (next?.slug) footer.push(pathRow(`part ${next.part} →`, `/notes/${next.slug}`));
  } else if (older) {
    footer.push(pathRow(`next: ${older.title} →`, `/notes/${older.slug}`));
  }
  const series: Block[] = parts.length
    ? [
        {
          kind: 'section',
          label: 'the ai series',
          rows: parts.map((item) => ({
            lead: [lowered(`part ${item.part}`, item.part === note.part ? 'current' : 'faint')],
            main: [lowered(item.title)],
            trail: item.slug ? pathTrail(`/notes/${item.slug}`) : [lowered('coming soon', 'faint')],
          })),
        },
      ]
    : [];
  return [
    { kind: 'header', current: 'notes' },
    paragraph(lowered(`${dotDate(note.publishedAt)} · ${note.tags.join(', ')}`, 'faint')),
    { kind: 'title', runs: [lowered(note.title)] },
    ...prose,
    ...series,
    { kind: 'section', rows: footer },
  ];
}

export function workPage(): Block[] {
  const mobile = PastProjects.slice(2).map((project) => project.title);
  return [
    { kind: 'header', current: 'work' },
    paragraph(
      lowered(
        'Building AI at Motion. Care about the gap between “it works” and “it feels right”. Usually that’s where the real work is.',
      ),
    ),
    { kind: 'section', label: 'timeline', rows: Work.map(workRow) },
    { kind: 'section', label: 'side projects', rows: SideProjects.map(projectRow) },
    {
      kind: 'section',
      label: 'past',
      rows: PastProjects.slice(0, 2).map((project) => ({
        lead: [lowered(project.title)],
        main: [lowered(project.description, 'body')],
      })),
    },
    paragraph(
      lowered(
        `And many mobile apps for companies like ${mobile.slice(0, -1).join(', ')}, and ${mobile.at(-1)}.`,
        'body',
      ),
    ),
  ];
}

export function aboutPage(): Block[] {
  return [
    { kind: 'header', current: 'about' },
    paragraph(lowered(AboutExtended, 'body')),
    {
      kind: 'section',
      label: 'reading',
      rows: Books.map((book) => ({
        lead: [lowered(book.name)],
        main: [lowered(book.author, 'faint')],
      })),
    },
    paragraph(lowered('And various crime stories.', 'body')),
  ];
}

export function missingPage(): Block[] {
  return [
    { kind: 'header' },
    paragraph(lowered("404. That page isn't here.")),
    { kind: 'section', rows: [pathRow('← home', '/')] },
  ];
}

const stepsPerRow = 2;

export function contributionBars(dates: string[], counts: number[]): Run[][] {
  const weeks = weeklyTotals(dates, counts);
  const peak = Math.max(...weeks.map((week) => week.total));
  const levels = weeks.map(({ total }) =>
    total ? Math.max(1, Math.round((total / peak) * LEVELS)) : 0,
  );
  const bars = Array.from({ length: LEVELS / stepsPerRow }, (_, i) => {
    const floor = LEVELS - stepsPerRow * (i + 1);
    return levels.map((level) => barCell(level, floor));
  });

  let months = '';
  let week = 0;
  dates.forEach((date, i) => {
    if (i > 0 && new Date(`${date}T00:00:00Z`).getUTCDay() === 0) week += 1;
    const label = monthYear(date).slice(0, 3);
    if (date.endsWith('-01') && week + label.length <= weeks.length) {
      months = months.padEnd(week) + label;
    }
  });

  const total = count.format(counts.reduce((sum, value) => sum + value, 0));
  const caption = `${total} contributions`;
  return [
    ...bars,
    [lowered(months, 'faint')],
    [
      literal(total),
      literal(' contributions', 'faint'),
      literal(' '.repeat(Math.max(3, weeks.length - caption.length - 'past year'.length))),
      literal('past year', 'faint'),
    ],
  ];
}

function barCell(level: number, floor: number): Run {
  if (level >= floor + stepsPerRow) return literal('█');
  if (level === floor + 1) return literal('▄');
  return level === 0 && floor === 0 ? literal('·', 'faint') : literal(' ');
}
