import { averageLoss, chances, countPairs, sampleName, size } from '../ml/bigram';
import { symbols } from '../ml/tokenizers';
import { nameCounts } from './nameCounts';
import { type Rgb, css, defineScene } from './stage';

const gutter = 16;
const temperatureBox = { min: 0.1, max: 2, step: 0.1, start: 1 };

export function gridFigure(side: number, counts: ArrayLike<number>) {
  const cell = (side - gutter) / size;
  let most = 0;
  for (let i = 0; i < counts.length; i++) most = Math.max(most, counts[i]);
  const squares = [];
  for (let i = 0; i < counts.length; i++) {
    const square = cell * 0.9 * Math.sqrt(counts[i] / most);
    if (square < 0.5) continue;
    const row = Math.floor(i / size);
    const column = i % size;
    squares.push({
      row,
      x: gutter + column * cell + (cell - square) / 2,
      y: gutter + row * cell + (cell - square) / 2,
      side: square,
    });
  }
  const middle = (index: number) => gutter + (index + 0.5) * cell;
  return {
    cell,
    squares,
    rowLabels: Array.from(symbols, (text, row) => ({ text, x: gutter / 2, y: middle(row) })),
    columnLabels: Array.from(symbols, (text, column) => ({
      text,
      x: middle(column),
      y: gutter / 2,
    })),
  };
}

const mix = (from: Rgb, to: Rgb, t: number): Rgb => [
  from[0] + (to[0] - from[0]) * t,
  from[1] + (to[1] - from[1]) * t,
  from[2] + (to[2] - from[2]) * t,
];

const spoken = (symbol: string) => (symbol === '.' ? 'the dot' : symbol);
const percent = (chance: number) => (chance < 0.001 ? '<0.1%' : `${(chance * 100).toFixed(1)}%`);

const nextTask = () => new Promise((resolve) => setTimeout(resolve));

let names: Promise<string[]> | null = null;
const loadNames = () =>
  (names ??= fetch('/data/names.txt')
    .then((response) => {
      if (!response.ok) throw new Error(`/data/names.txt answered ${response.status}`);
      return response.text();
    })
    .then((text) => text.split('\n'))
    .catch((error) => {
      names = null;
      throw error;
    }));

export default defineScene({
  parts: {
    grid: 'canvas',
    heading: 'div',
    chances: 'div',
    announce: 'div',
    pairs: 'tbody',
    loss: 'span',
    letter: 'input',
    sample: 'button',
    temperature: 'input',
    temperatureText: 'span',
    names: 'div',
  },
  async mount(stage, p) {
    const all = await loadNames();
    await nextTask();
    const counts = countPairs(all);
    await nextTask();
    const lossTimer = setTimeout(() => {
      p.loss.textContent = averageLoss(counts, all).toFixed(2);
    });
    stage.defer(() => clearTimeout(lossTimer));

    let selected: number | null = null;
    const on = { signal: stage.signal };

    const top = [...counts.keys()].sort((a, b) => counts[b] - counts[a]).slice(0, 20);
    p.pairs.replaceChildren(
      ...top.map((i) => {
        const row = document.createElement('tr');
        const pair = `${spoken(symbols[Math.floor(i / size)])}, then ${spoken(symbols[i % size])}`;
        for (const text of [pair, (counts[i] - 1).toLocaleString('en-US')]) {
          row.insertCell().textContent = text;
        }
        return row;
      }),
    );

    const { min, max, step, start } = temperatureBox;
    Object.assign(p.temperature, { min, max, step, value: start });
    const temperature = () => p.temperature.valueAsNumber;

    const span = (text: string, className = '') =>
      Object.assign(document.createElement('span'), { textContent: text, className });
    const intro = p.heading.textContent ?? '';

    const writeChances = () => {
      const t = temperature().toFixed(1);
      p.temperatureText.textContent = t;
      p.temperature.setAttribute('aria-valuetext', t);
      if (selected === null) {
        p.heading.replaceChildren(intro);
        p.chances.replaceChildren();
        return;
      }
      const odds = chances(counts, selected, temperature());
      const order = [...odds.keys()].sort((a, b) => odds[b] - odds[a]);
      const letter = symbols[selected];
      p.heading.replaceChildren(
        ...(selected === 0 ? [span('First letters')] : [span('After '), span(letter, 'text-ink')]),
        `, at temperature ${t}`,
      );
      p.chances.replaceChildren(
        ...order.map((next) => {
          const entry = document.createElement('div');
          entry.dataset.chance = String(odds[next]);
          entry.append(span(symbols[next], 'text-faint'), ' ', span(percent(odds[next])));
          return entry;
        }),
      );
      const likeliest = order
        .slice(0, 5)
        .map((next) => `${spoken(symbols[next])} ${percent(odds[next])}`);
      p.announce.textContent = `${selected === 0 ? 'First letters' : `After ${spoken(letter)}`}: ${likeliest.join(', ')}`;
    };

    const select = (row: number | null) => {
      selected = row;
      p.letter.value = row === null ? '' : symbols[row];
      writeChances();
      stage.wake();
    };

    p.letter.addEventListener(
      'input',
      () => {
        const typed = p.letter.value.slice(-1).toLowerCase();
        const row = symbols.indexOf(typed);
        select(typed === '' ? null : row === -1 ? selected : row);
      },
      on,
    );
    p.temperature.addEventListener('input', writeChances, on);
    p.sample.addEventListener(
      'click',
      () => {
        p.names.classList.replace('text-faint', 'text-ink');
        p.names.replaceChildren(
          ...Array.from({ length: 10 }, () =>
            Object.assign(document.createElement('span'), {
              textContent: sampleName(counts, temperature()),
            }),
          ),
        );
      },
      on,
    );
    p.grid.addEventListener(
      'click',
      (event) => {
        const { cell } = gridFigure(p.grid.clientWidth, counts);
        const row = Math.floor((event.offsetY - gutter) / cell);
        if (row >= 0 && row < size) select(row);
      },
      on,
    );
    writeChances();

    return () => {
      const ctx = stage.canvas(p.grid);
      const figure = gridFigure(ctx.width, counts);
      const { bg, ink, faint } = stage.tokens;
      ctx.fillStyle = css(bg);
      ctx.fillRect(0, 0, ctx.width, ctx.height);
      ctx.font = stage.font(11);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      figure.rowLabels.forEach((label, row) => {
        ctx.fillStyle = css(row === selected ? ink : faint);
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
        const top = Math.round(gutter + selected * figure.cell);
        const bottom = Math.round(gutter + (selected + 1) * figure.cell);
        ctx.strokeStyle = css(faint);
        ctx.lineWidth = 1;
        ctx.strokeRect(gutter - 0.5, top - 0.5, Math.round(ctx.width - gutter), bottom - top + 1);
      }
    };
  },
});

export function Still() {
  const figure = gridFigure(400, nameCounts);
  return (
    <svg
      className="demo-still"
      viewBox="0 0 400 400"
      preserveAspectRatio="xMinYMin meet"
      aria-hidden="true"
    >
      <g className="fill-faint" fontSize={11} textAnchor="middle" dominantBaseline="central">
        {[...figure.rowLabels, ...figure.columnLabels].map((label) => (
          <text key={`${label.x} ${label.y}`} x={label.x} y={label.y}>
            {label.text}
          </text>
        ))}
      </g>
      <path
        className="fill-ink"
        d={figure.squares
          .map(
            ({ x, y, side }) =>
              `M${x.toFixed(1)} ${y.toFixed(1)}h${side.toFixed(1)}v${side.toFixed(1)}h-${side.toFixed(1)}z`,
          )
          .join('')}
      />
    </svg>
  );
}
