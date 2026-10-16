import type { HeadWeights } from '../ml/heads';
import { headsStill } from './headsStill';
import { letterPicker } from './letterPicker';
import { letterName, readingOf, sentenceHeads, shown, text, triangleHead } from './sentenceHeads';
import { type Rgb, css, defineScene } from './stage';

const n = text.length;

/**
 * The triangle on a square of `side` pixels. Each square's area is its weight. Labels need room,
 * so a narrow triangle has none.
 */
export function triangleFigure(side: number, weight: (t: number, s: number) => number) {
  const gutter = side >= 500 ? 14 : 0;
  const cell = (side - gutter) / n;
  const squares = [];
  for (let t = 0; t < n; t++) {
    for (let s = 0; s <= t; s++) {
      const size = cell * 0.9 * Math.sqrt(weight(t, s));
      if (size < 0.5) continue;
      squares.push({
        row: t,
        x: gutter + s * cell + (cell - size) / 2,
        y: gutter + t * cell + (cell - size) / 2,
        side: size,
      });
    }
  }
  const middle = (i: number) => gutter + (i + 0.5) * cell;
  let diagonal = `M${gutter} ${gutter}`;
  for (let t = 1; t <= n; t++) {
    const edge = (gutter + t * cell).toFixed(1);
    diagonal += `H${edge}V${edge}`;
  }
  const labels = (at: (i: number) => { x: number; y: number }) =>
    gutter ? Array.from(text, (letter, i) => ({ text: shown(letter), ...at(i) })) : [];
  return {
    gutter,
    cell,
    squares,
    diagonal,
    /** The box of row t, from the left edge to the diagonal. */
    row: (t: number) => ({ x: gutter, y: gutter + t * cell, width: (t + 1) * cell, height: cell }),
    rowLabels: labels((t) => ({ x: gutter / 2, y: middle(t) })),
    columnLabels: labels((s) => ({ x: middle(s), y: gutter / 2 })),
  };
}

const mix = (from: Rgb, to: Rgb, t: number): Rgb => [
  from[0] + (to[0] - from[0]) * t,
  from[1] + (to[1] - from[1]) * t,
  from[2] + (to[2] - from[2]) * t,
];

const percent = (weight: number) => `${(weight * 100).toFixed(1)}%`;

/** The letters t reads most, biggest first. */
function mostRead(found: HeadWeights, t: number, count: number) {
  const row = readingOf(found, triangleHead.block, triangleHead.head, t);
  return Array.from(row.keys())
    .sort((a, b) => row[b] - row[a])
    .slice(0, count)
    .map((s) => ({ s, weight: row[s] }));
}

export default defineScene({
  parts: {
    triangle: 'canvas',
    rows: 'div',
    heading: 'div',
    reads: 'div',
    table: 'tbody',
    head: 'span',
    size: 'span',
  },
  async mount(stage, p) {
    const found = await sentenceHeads();
    const weight = (t: number, s: number) =>
      readingOf(found, triangleHead.block, triangleHead.head, t)[s];
    let selected: number | null = null;
    p.head.textContent = `Block ${triangleHead.block + 1}, head ${triangleHead.head + 1}`;
    p.size.textContent = `${n} letters, ${((n * (n + 1)) / 2).toLocaleString('en-US')} weights`;

    const span = (textContent: string, className = '') =>
      Object.assign(document.createElement('span'), { textContent, className });
    const spoken = (t: number) =>
      mostRead(found, t, 3)
        .map(({ s, weight }) => `${letterName(s)} ${percent(weight)}`)
        .join(', ');

    p.table.replaceChildren(
      ...Array.from(text, (_, t) => {
        const row = document.createElement('tr');
        row.insertCell().textContent = letterName(t);
        for (const { s, weight } of mostRead(found, t, 3)) {
          row.insertCell().textContent = `${letterName(s)}, ${percent(weight)}`;
        }
        return row;
      }),
    );

    const items = letterPicker(p.rows, {
      count: n,
      picked: null,
      keys: ['ArrowUp', 'ArrowDown'],
      signal: stage.signal,
      pick(t) {
        selected = t;
        p.heading.replaceChildren(span(letterName(t), 'text-ink'), ' reads');
        p.reads.replaceChildren(
          ...mostRead(found, t, 5).map(({ s, weight }) => {
            const entry = document.createElement('div');
            entry.className = 'grid grid-cols-[minmax(0,1fr)_7ch] gap-x-[1ch]';
            entry.append(
              span(letterName(s), 'truncate text-faint'),
              span(percent(weight), 'text-right'),
            );
            return entry;
          }),
        );
        stage.wake();
      },
    });
    items.forEach((item, t) =>
      item.setAttribute('aria-label', `${letterName(t)} reads ${spoken(t)}`),
    );

    let placedFor = 0;
    return () => {
      const ctx = stage.canvas(p.triangle);
      const side = ctx.width;
      const figure = triangleFigure(side, weight);
      if (placedFor !== side) {
        placedFor = side;
        items.forEach((item, t) => {
          const { x, y, width, height } = figure.row(t);
          Object.assign(item.style, {
            left: `${x}px`,
            top: `${y}px`,
            width: `${width}px`,
            height: `${height}px`,
          });
        });
      }
      const { bg, ink, faint, rule } = stage.tokens;
      ctx.fillStyle = css(bg);
      ctx.fillRect(0, 0, side, side);
      ctx.strokeStyle = css(rule);
      ctx.lineWidth = 1;
      ctx.stroke(new Path2D(figure.diagonal));
      ctx.font = stage.font(11);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      figure.rowLabels.forEach((label, t) => {
        ctx.fillStyle = css(t === selected ? ink : faint);
        ctx.fillText(label.text, label.x, label.y);
      });
      ctx.fillStyle = css(faint);
      for (const label of figure.columnLabels) ctx.fillText(label.text, label.x, label.y);
      const dim = css(mix(bg, ink, 0.3));
      for (const square of figure.squares) {
        ctx.fillStyle = selected === null || square.row === selected ? css(ink) : dim;
        ctx.fillRect(square.x, square.y, square.side, square.side);
      }
      if (selected !== null) {
        const { x, y, width, height } = figure.row(selected);
        ctx.strokeStyle = css(faint);
        ctx.strokeRect(
          Math.round(x) - 0.5,
          Math.round(y) - 0.5,
          Math.round(width) + 1,
          Math.round(height) + 1,
        );
      }
    };
  },
});

export function Still() {
  return (
    <>
      <TriangleSvg side={672} className="[@container(max-width:478px)]:hidden" />
      <TriangleSvg side={320} className="hidden [@container(max-width:478px)]:block" />
    </>
  );
}

function TriangleSvg({ side, className }: { side: number; className: string }) {
  const figure = triangleFigure(side, (t, s) => headsStill.triangle[t][s] / 1000);
  const box = (x: number, y: number, size: number) =>
    `M${x.toFixed(1)} ${y.toFixed(1)}h${size.toFixed(1)}v${size.toFixed(1)}h-${size.toFixed(1)}z`;
  const labelXs = figure.columnLabels.map(({ x }) => x.toFixed(1)).join(' ');
  const labelYs = figure.rowLabels.map(({ y }) => y.toFixed(1)).join(' ');
  return (
    <svg
      className={`demo-still ${className}`}
      viewBox={`0 0 ${side} ${side}`}
      preserveAspectRatio="xMinYMin meet"
      aria-hidden="true"
    >
      <path d={figure.diagonal} fill="none" className="stroke-rule" />
      {figure.gutter ? (
        <g className="fill-faint" fontSize={11} textAnchor="middle" dominantBaseline="central">
          <text x={labelXs} y={figure.gutter / 2}>
            {figure.columnLabels.map(({ text }) => text).join('')}
          </text>
          <text x={figure.rowLabels.map(({ x }) => x).join(' ')} y={labelYs}>
            {figure.rowLabels.map(({ text }) => text).join('')}
          </text>
        </g>
      ) : null}
      <path className="fill-ink" d={figure.squares.map((q) => box(q.x, q.y, q.side)).join('')} />
    </svg>
  );
}
