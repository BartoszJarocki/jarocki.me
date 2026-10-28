import { Name } from '../data/bio.ts';
import { lowercase } from './lowercase.ts';

export type Tone = 'display' | 'ink' | 'body' | 'faint' | 'strong' | 'em' | 'code' | 'current';
export type Run = { text: string; tone: Tone; href?: string; lower?: true };
export type Row = { lead: Run[]; main: Run[]; trail?: Run[]; href?: string };
export type Nav = 'notes' | 'work' | 'about';
export type Block =
  | { kind: 'header'; current?: Nav }
  | { kind: 'paragraph'; runs: Run[] }
  | { kind: 'title'; runs: Run[] }
  | { kind: 'heading'; runs: Run[] }
  | { kind: 'quote'; blocks: Block[] }
  | { kind: 'list'; ordered: boolean; items: Block[][] }
  | { kind: 'code'; text: string }
  | { kind: 'section'; label?: string; more?: Run[]; rows: Row[] }
  | { kind: 'art'; label?: string; more?: Run[]; lines: Run[][] }
  | { kind: 'table'; caption: Run[]; columns: Run[][]; rows: TableRow[] }
  | { kind: 'demo'; label: string; blocks: Block[]; href: string }
  | { kind: 'links' }
  | { kind: 'curl'; runs: Run[] }
  | { kind: 'rule' };
// columns[0] heads the row headers, and cells[i] sits under columns[i + 1].
export type TableRow = { header: Run[]; cells: Run[][] };

type Line = Run[];

const screen = 80;
const margin = '  ';
const width = screen - 2 * margin.length;
const measure = 72;
export const nav: Nav[] = ['notes', 'work', 'about'];

const sgr: Record<Tone, number | null> = {
  display: 1,
  strong: 1,
  faint: 2,
  em: 3,
  current: 4,
  ink: null,
  body: null,
  code: null,
};

export const lowered = (text: string, tone: Tone = 'ink'): Run => ({ text, tone, lower: true });

export const literal = (text: string, tone: Tone = 'ink'): Run => ({ text, tone });

const noBreakSpace = '\u00a0';

export function renderText(blocks: Block[]) {
  const links: string[] = [];
  const shown = blocks.flatMap((block) => textForm(block, links));
  const lines = stack(shown, width).map(serialize);
  return ['', ...lines, '', ''].join('\n');
}

// A link's number is its place in links, which fills in reading order, so the links block lists
// the links cited before it.
function textForm(block: Block, links: string[]): Block[] {
  const runs = (items: Run[]) => textRuns(items, links);
  switch (block.kind) {
    case 'paragraph':
    case 'title':
    case 'heading':
      return [{ ...block, runs: runs(block.runs) }];
    case 'curl':
      return [{ kind: 'paragraph', runs: runs(block.runs) }];
    case 'quote':
      return [{ ...block, blocks: block.blocks.flatMap((item) => textForm(item, links)) }];
    case 'list':
      return [
        {
          ...block,
          items: block.items.map((item) => item.flatMap((child) => textForm(child, links))),
        },
      ];
    case 'section':
      return [
        {
          ...block,
          more: block.more && runs(block.more),
          rows: block.rows.map(({ lead, main, trail }) => ({
            lead: runs(lead),
            main: runs(main),
            trail: trail && runs(trail),
          })),
        },
      ];
    case 'art':
      return [{ ...block, more: block.more && runs(block.more), lines: block.lines.map(runs) }];
    case 'table': {
      const caption: Block[] = block.caption.length
        ? [{ kind: 'paragraph', runs: block.caption }]
        : [];
      const rows = block.rows.map(
        ({ header, cells }): Block => ({
          kind: 'section',
          label: runs(header)
            .map((run) => run.text)
            .join(''),
          rows: cells.map((cell, i) => ({ lead: block.columns[i + 1], main: cell })),
        }),
      );
      return [...caption, ...rows].flatMap((item) => textForm(item, links));
    }
    case 'demo':
      return [
        { kind: 'paragraph', runs: [literal(`[interactive demo at ${block.href}]`, 'faint')] },
      ];
    case 'links':
      return links.length
        ? [
            {
              kind: 'section',
              label: 'links',
              rows: links.map((url, i) => ({
                lead: [literal(`[${i + 1}]`, 'faint')],
                main: [literal(url)],
              })),
            },
          ]
        : [];
    case 'header':
    case 'code':
    case 'rule':
      return [block];
  }
}

function textRuns(runs: Run[], links: string[]): Run[] {
  return runs.flatMap(({ text, tone, href, lower }, i) => {
    const cased = lower ? lowercase(text) : text;
    const shown = literal(tone === 'code' ? `\`${cased}\`` : cased, tone);
    if (!href || runs[i + 1]?.href === href) return [shown];
    const number = links.includes(href) ? links.indexOf(href) + 1 : links.push(href);
    return [shown, literal(`${noBreakSpace}[${number}]`, 'faint')];
  });
}

function stack(blocks: Block[], room: number): Line[] {
  return blocks.flatMap((block, i) => [...(i ? [[]] : []), ...layout(block, room)]);
}

function layout(block: Block, room: number): Line[] {
  const prose = Math.min(room, measure);
  switch (block.kind) {
    case 'header':
      return header(block.current);
    case 'paragraph':
      return wrap(block.runs, prose);
    case 'title':
    case 'heading':
      return wrap(
        block.runs.map(({ text, tone }) => ({ text, tone: tone === 'code' ? tone : 'display' })),
        prose,
      );
    case 'quote':
      return stack(block.blocks, prose - 2).map((line) => [literal('│ ', 'faint'), ...line]);
    case 'list':
      return list(block.ordered, block.items, prose);
    case 'code':
      return block.text.split('\n').map((line) => [literal(`    ${line}`, 'code')]);
    case 'section':
      return [...head(block, room), ...rows(block.rows, room)];
    case 'art':
      return [...head(block, room), ...block.lines];
    case 'rule':
      return [[literal('─'.repeat(prose), 'faint')]];
    // renderText turns these into other blocks before the layout.
    case 'table':
    case 'demo':
    case 'links':
    case 'curl':
      return [];
  }
}

function header(current?: Nav): Line[] {
  const links = nav.flatMap((item, i) => [
    ...(i ? [pad(2)] : []),
    literal(item, item === current ? 'current' : 'faint'),
  ]);
  return [
    ...spread([literal(Name, 'display')], links, width),
    [literal('─'.repeat(width), 'faint')],
  ];
}

function list(ordered: boolean, items: Block[][], room: number): Line[] {
  const markers = items.map((_, i) => (ordered ? `${i + 1}.` : '-'));
  const indent = Math.max(...markers.map((marker) => marker.length)) + 1;
  return items.flatMap((blocks, i) =>
    blocks
      .flatMap((block) => layout(block, room - indent))
      .map((line, j) => [j ? pad(indent) : literal(markers[i].padEnd(indent), 'faint'), ...line]),
  );
}

function head({ label, more = [] }: { label?: string; more?: Run[] }, room: number): Line[] {
  return label === undefined ? [] : spread([literal(lowercase(label), 'faint')], more, room);
}

function rows(items: Row[], room: number): Line[] {
  const longest = Math.max(0, ...items.map((row) => columns(row.lead)));
  const indent = longest === 0 ? 0 : Math.max(10, longest) + 3;
  return items.flatMap((row) => rowLines(row, indent, room - indent));
}

function rowLines({ lead, main, trail }: Row, indent: number, room: number): Line[] {
  const first = [...lead, pad(indent - columns(lead))];
  const gap = room - columns(main) - columns(trail ?? []);
  if (trail && gap >= 3) return [[...first, ...main, pad(gap), ...trail]];
  return [...wrap(main, room), ...(trail?.length ? wrap(trail, room) : [])].map((line, i) => [
    ...(i ? [pad(indent)] : first),
    ...line,
  ]);
}

function spread(left: Run[], right: Run[], room: number): Line[] {
  const gap = room - columns(left) - columns(right);
  return gap >= 3
    ? [[...left, pad(gap), ...right]]
    : [left, [pad(room - columns(right)), ...right]];
}

function wrap(runs: Run[], room: number): Line[] {
  const lines: Line[] = [[]];
  let used = 0;
  for (const word of words(runs)) {
    if (word === '\n') {
      lines.push([]);
      used = 0;
      continue;
    }
    const size = columns(word);
    const line = lines[lines.length - 1];
    if (!used) {
      line.push(...word);
      used = size;
    } else if (used + 1 + size > room) {
      lines.push([...word]);
      used = size;
    } else {
      line.push(spaceBetween(line[line.length - 1].tone, word[0].tone), ...word);
      used += 1 + size;
    }
  }
  return lines;
}

function words(runs: Run[]): (Run[] | '\n')[] {
  const found: (Run[] | '\n')[] = [];
  let word: Run[] = [];
  const end = () => {
    if (word.length) found.push(word);
    word = [];
  };
  for (const { text, tone } of runs) {
    for (const part of text.split(/( |\n)/)) {
      if (part === ' ') end();
      else if (part === '\n') {
        end();
        found.push('\n');
      } else if (part) word.push({ text: part, tone });
    }
  }
  end();
  return found;
}

function serialize(line: Line) {
  const runs: Run[] = [];
  for (const { text, tone } of line) {
    const last = runs.at(-1);
    if (last?.tone === tone) last.text += text;
    else runs.push({ text, tone });
  }
  while (runs.length && !runs[runs.length - 1].text.trimEnd()) runs.pop();
  if (!runs.length) return '';
  runs[runs.length - 1].text = runs[runs.length - 1].text.trimEnd();
  const text = runs
    .map(({ text, tone }) => (sgr[tone] ? `\x1b[${sgr[tone]}m${text}\x1b[0m` : text))
    .join('');
  return margin + text.replaceAll(noBreakSpace, ' ');
}

function spaceBetween(left: Tone, right: Tone) {
  return literal(' ', left === right ? left : 'body');
}

function pad(size: number) {
  return literal(' '.repeat(size), 'body');
}

function columns(runs: Run[]) {
  return runs.reduce((sum, { text }) => sum + [...text].length, 0);
}
