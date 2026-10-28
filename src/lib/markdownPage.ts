import { Name, SiteUrl } from '../data/bio.ts';
import { type Block, type Row, type Run, nav } from './textPage.ts';

type Table = Extract<Block, { kind: 'table' }>;

const sitePage = /^\/(?:notes(?:\/[\w-]+)?|work|about)?$/;

export function renderMarkdown(blocks: Block[]) {
  return `${stack(blocks)}\n`;
}

function stack(blocks: Block[]) {
  return paragraphs(blocks.map(markdown));
}

function markdown(block: Block): string {
  switch (block.kind) {
    case 'header': {
      const pages = nav.map((item) => anchor(item, `/${item}`));
      return [anchor(escape(Name), '/'), ...pages].join(' · ');
    }
    case 'paragraph':
      return inline(block.runs);
    case 'title':
      return `# ${inline(block.runs)}`;
    case 'heading':
      return `## ${inline(block.runs)}`;
    case 'quote':
      return quote(stack(block.blocks));
    case 'list':
      return block.items
        .map((item, i) => indent(stack(item), block.ordered ? `${i + 1}. ` : '- '))
        .join('\n');
    case 'code':
      return fence(block.text);
    case 'section':
      // Without a heading, a rule keeps the rows from joining a list just before them.
      return paragraphs([
        ...(block.label === undefined ? ['---'] : head(block)),
        block.rows.map(row).join('\n'),
      ]);
    case 'art':
      return paragraphs([...head(block), fence(block.lines.map(plain).join('\n'))]);
    case 'table':
      return paragraphs([inline(block.caption), table(block)]);
    case 'demo':
      return quote(
        paragraphs([
          `**Interactive demo: ${escape(block.label)}.** ${stack(block.blocks)}`.trimEnd(),
          `Try it at ${block.href}`,
        ]),
      );
    case 'links':
    case 'curl':
      return '';
    case 'rule':
      return '---';
  }
}

function head({ label, more }: { label?: string; more?: Run[] }) {
  if (label === undefined) return [];
  return [`## ${escape(label)}`, more ? inline(more).replace(/\s+/g, ' ').trim() : ''];
}

function row({ lead, main, trail = [], href }: Row) {
  const parts = href ? [inline(lead), anchor(inline(main), href)] : [lead, main, trail].map(inline);
  return `- ${parts.filter(Boolean).join(' · ')}`;
}

function table({ columns, rows }: Table) {
  const line = (cells: Run[][]) =>
    `| ${cells.map((cell) => inline(cell).replace(/\\\n/g, ' ').replaceAll('|', '\\|')).join(' | ')} |`;
  return [
    line(columns),
    `|${' --- |'.repeat(columns.length)}`,
    ...rows.map(({ header, cells }) => line([header, ...cells])),
  ].join('\n');
}

function inline(runs: Run[]) {
  const groups: Run[][] = [];
  for (const run of runs) {
    const group = groups.at(-1);
    if (group && group[0].href === run.href) group.push(run);
    else groups.push([run]);
  }
  return groups
    .map((group) => {
      const text = styled(group);
      return group[0].href ? anchor(text, group[0].href) : text;
    })
    .join('')
    .replace(/^[#>+-]/gm, '\\$&')
    .replace(/^(\d+)([.)])(?=\s|$)/gm, '$1\\$2');
}

function styled(runs: Run[]) {
  const spans: { text: string; mark: string }[] = [];
  for (const { text, tone } of runs) {
    const mark = tone === 'code' ? '`' : tone === 'strong' ? '**' : tone === 'em' ? '*' : '';
    const last = spans.at(-1);
    if (last?.mark === mark) last.text += text;
    else spans.push({ text, mark });
  }
  return spans
    .map(({ text, mark }) => {
      if (mark === '`') return code(text);
      const [, before, core, after] = /^(\s*)([\s\S]*?)(\s*)$/.exec(text) ?? [];
      const span = core ? `${before}${mark}${escape(core)}${mark}${after}` : text;
      // A bare newline is a soft break, which markdown reads as a space.
      return span.replaceAll('\n', '\\\n');
    })
    .join('');
}

function plain(runs: Run[]) {
  return runs
    .map((run) => run.text)
    .join('')
    .trimEnd();
}

function anchor(text: string, href: string) {
  const url = !href.startsWith('/')
    ? href
    : sitePage.test(href)
      ? `${SiteUrl}${href === '/' ? '/index' : href}.md`
      : `${SiteUrl}${href}`;
  return `[${text}](${/[\s()]/.test(url) ? `<${url}>` : url})`;
}

function escape(text: string) {
  return text.replace(/[\\`*_[\]<]/g, '\\$&');
}

function code(text: string) {
  const ticks = '`'.repeat(longestTicks(text) + 1);
  const pad = /^`|`$/.test(text) ? ' ' : '';
  return `${ticks}${pad}${text}${pad}${ticks}`;
}

function fence(text: string) {
  const ticks = '`'.repeat(Math.max(2, longestTicks(text)) + 1);
  return `${ticks}\n${text}\n${ticks}`;
}

function longestTicks(text: string) {
  return Math.max(0, ...(text.match(/`+/g) ?? []).map((ticks) => ticks.length));
}

function quote(text: string) {
  return text
    .split('\n')
    .map((line) => (line ? `> ${line}` : '>'))
    .join('\n');
}

function indent(text: string, marker: string) {
  return text
    .split('\n')
    .map((line, i) => (i ? line && `${' '.repeat(marker.length)}${line}` : `${marker}${line}`))
    .join('\n');
}

function paragraphs(parts: string[]) {
  return parts.filter(Boolean).join('\n\n');
}
