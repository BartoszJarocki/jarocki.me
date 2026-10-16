import { PlaygroundLayout } from '../../components/demos/Playground';
import { type Point, trainStep } from '../ml/mlp.ts';
import {
  type DatasetName,
  type Picture,
  datasets,
  firstNetworkSeed,
  grid,
  network,
  picture,
  points,
  reach,
  reducedMotionSteps,
  score,
  train,
} from './playground';
import { type Rgb, type Tokens, css, defineScene } from './stage';

const strip = 18;
const tones = 48;
const toneOf = (level: number) => 0.03 + (0.21 * level) / (tones - 1);
const knobCell = 36;
const knobHead = 20;
const batchMs = 8;
const stillSteps = 150;

const sides = [
  [0, 0, 1, 0],
  [1, 0, 1, 1],
  [1, 1, 0, 1],
  [0, 1, 0, 0],
] as const;

type Label = { text: string; x: number; y: number; align: 'left' | 'center' | 'right' };

export function fieldFigure(
  pic: Picture,
  data: Point[],
  name: DatasetName,
  width: number,
  ratio = 1,
) {
  const size = width - strip;
  const cell = size / grid;
  const edge = (i: number) => Math.round(i * cell * ratio) / ratio;
  const answer = (i: number, j: number) => pic.answers[j * (grid + 1) + i];
  const level = (i: number, j: number) => {
    const mean = (answer(i, j) + answer(i + 1, j) + answer(i, j + 1) + answer(i + 1, j + 1)) / 4;
    return Math.min(tones - 1, Math.round(mean * (tones - 1)));
  };

  const runs: { x: number; y: number; width: number; height: number; level: number }[] = [];
  for (let j = 0; j < grid; j++) {
    for (let i = 0; i < grid; ) {
      const shade = level(i, j);
      let end = i + 1;
      while (end < grid && level(end, j) === shade) end++;
      const top = edge(j);
      runs.push({
        x: strip + edge(i),
        y: top,
        width: edge(end) - edge(i),
        height: edge(j + 1) - top,
        level: shade,
      });
      i = end;
    }
  }

  const contour: [number, number, number, number][] = [];
  const crossings: number[] = [];
  for (let j = 0; j < grid; j++) {
    for (let i = 0; i < grid; i++) {
      crossings.length = 0;
      for (const [fromI, fromJ, toI, toJ] of sides) {
        const a = answer(i + fromI, j + fromJ) - 0.5;
        const b = answer(i + toI, j + toJ) - 0.5;
        if (a > 0 === b > 0) continue;
        const t = a / (a - b);
        crossings.push(
          strip + (i + fromI + (toI - fromI) * t) * cell,
          (j + fromJ + (toJ - fromJ) * t) * cell,
        );
      }
      for (let q = 0; q + 3 < crossings.length; q += 4) {
        contour.push([crossings[q], crossings[q + 1], crossings[q + 2], crossings[q + 3]]);
      }
    }
  }

  const x = (v: number) => strip + ((v + reach) / (2 * reach)) * size;
  const y = (v: number) => ((reach - v) / (2 * reach)) * size;
  const dot = cell >= 10 ? 7 : 6;
  const axes = datasets[name].axes;
  const middle = strip / 2;

  return {
    width,
    plot: { x: strip, y: 0, size },
    runs,
    gaps: cell >= 6 ? Array.from({ length: grid }, (_, i) => edge(i + 1) - 1) : [],
    contour,
    dot,
    points: data.map((point) => ({
      x: Math.round(x(point.x) - dot / 2),
      y: Math.round(y(point.y) - dot / 2),
      filled: point.label === 1,
    })),
    across: [
      { text: axes.x[0], x: strip, y: size + middle, align: 'left' },
      { text: axes.x[1], x: strip + size / 2, y: size + middle, align: 'center' },
      { text: axes.x[2], x: width, y: size + middle, align: 'right' },
    ] satisfies Label[],
    up: [
      { text: axes.y[0], x: middle, y: size, align: 'left' },
      { text: axes.y[1], x: middle, y: size / 2, align: 'center' },
      { text: axes.y[2], x: middle, y: 0, align: 'right' },
    ] satisfies Label[],
    fence([wx, wy, bias]: readonly [number, number, number]) {
      return Math.abs(wy) > Math.abs(wx)
        ? [x(-reach), y((-bias + wx * reach) / wy), x(reach), y((-bias - wx * reach) / wy)]
        : [x((-bias - wy * reach) / wx), y(reach), x((-bias + wy * reach) / wx), y(-reach)];
    },
  };
}

export function knobFigure(first: Picture['first'], name: DatasetName, row: number | null) {
  const labels = [...datasets[name].inputs, 'bias'].map((text, c) => ({
    text,
    x: c * knobCell + knobCell / 2,
    y: knobHead / 2,
  }));
  const cells = first.flatMap((knobs, r) =>
    knobs.map((value, c) => {
      const x = c * knobCell;
      const y = knobHead + r * knobCell;
      const raw = Math.round(Math.min(1, Math.abs(value) / 3) * (knobCell - 8));
      const side = Math.max(3, raw);
      const offset = Math.round((knobCell - 2 - side) / 2);
      return {
        x,
        y,
        size: knobCell - 2,
        picked: r === row,
        square: raw < 1 ? null : { x: x + offset, y: y + offset, side, filled: value > 0 },
      };
    }),
  );
  return { width: 3 * knobCell, height: knobHead + first.length * knobCell, labels, cells };
}

const mix = (from: Rgb, to: Rgb, t: number): Rgb => [
  from[0] + (to[0] - from[0]) * t,
  from[1] + (to[1] - from[1]) * t,
  from[2] + (to[2] - from[2]) * t,
];

function paintField(
  ctx: CanvasRenderingContext2D,
  field: ReturnType<typeof fieldFigure>,
  fence: readonly [number, number, number] | null,
  tokens: Tokens,
  font: string,
) {
  const { width, plot, dot } = field;
  ctx.fillStyle = css(tokens.bg);
  ctx.fillRect(0, 0, width, width);
  const palette = Array.from({ length: tones }, (_, level) =>
    css(mix(tokens.bg, tokens.ink, toneOf(level))),
  );
  for (const run of field.runs) {
    ctx.fillStyle = palette[run.level];
    ctx.fillRect(run.x, run.y, run.width, run.height);
  }
  ctx.fillStyle = css(tokens.bg);
  for (const gap of field.gaps) {
    ctx.fillRect(plot.x + gap, plot.y, 1, plot.size);
    ctx.fillRect(plot.x, plot.y + gap, plot.size, 1);
  }
  ctx.strokeStyle = css(mix(tokens.bg, tokens.ink, 0.5));
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const [x1, y1, x2, y2] of field.contour) {
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  }
  ctx.stroke();
  if (fence) {
    const [x1, y1, x2, y2] = field.fence(fence);
    ctx.save();
    ctx.beginPath();
    ctx.rect(plot.x, plot.y, plot.size, plot.size);
    ctx.clip();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = css(tokens.ink);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = css(tokens.ink);
  for (const point of field.points) ctx.fillRect(point.x, point.y, dot, dot);
  ctx.fillStyle = css(tokens.bg);
  for (const point of field.points) {
    if (!point.filled) ctx.fillRect(point.x + 1, point.y + 1, dot - 2, dot - 2);
  }
  ctx.font = font;
  ctx.fillStyle = css(tokens.faint);
  ctx.textBaseline = 'middle';
  for (const label of field.across) {
    ctx.textAlign = label.align;
    ctx.fillText(label.text, label.x, label.y);
  }
  for (const label of field.up) {
    ctx.save();
    ctx.translate(label.x, label.y);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = label.align;
    ctx.fillText(label.text, 0, 0);
    ctx.restore();
  }
}

function paintKnobs(
  ctx: CanvasRenderingContext2D,
  knobs: ReturnType<typeof knobFigure>,
  tokens: Tokens,
  font: string,
) {
  ctx.fillStyle = css(tokens.bg);
  ctx.fillRect(0, 0, knobs.width, knobs.height);
  ctx.font = font;
  ctx.fillStyle = css(tokens.faint);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const label of knobs.labels) ctx.fillText(label.text, label.x, label.y);
  for (const cell of knobs.cells) {
    const tone = css(cell.picked ? tokens.rule : tokens.wash);
    ctx.fillStyle = tone;
    ctx.fillRect(cell.x, cell.y, cell.size, cell.size);
    const square = cell.square;
    if (!square) continue;
    ctx.fillStyle = css(tokens.ink);
    ctx.fillRect(square.x, square.y, square.side, square.side);
    if (square.filled) continue;
    ctx.fillStyle = tone;
    ctx.fillRect(square.x + 1, square.y + 1, square.side - 2, square.side - 2);
  }
}

type Run = 'paused' | 'running' | { until: number };

const put = (element: HTMLElement, text: string) => {
  if (element.textContent !== text) element.textContent = text;
};
const press = (button: HTMLButtonElement, pressed: boolean) =>
  button.setAttribute('aria-pressed', String(pressed));

const names = Object.keys(datasets) as DatasetName[];

export default defineScene({
  parts: {
    field: 'canvas',
    hinton: 'canvas',
    steps: 'span',
    stepWord: 'span',
    loss: 'span',
    accuracy: 'span',
    name: 'span',
    train: 'button',
    pause: 'button',
    step: 'button',
    reset: 'button',
    days: 'button',
    switches: 'button',
    groups: 'button',
    spiral: 'button',
  },
  mount(stage, p) {
    let seed = firstNetworkSeed;
    let name: DatasetName = 'days';
    let data = points(name);
    let net = network(seed++);
    let steps = 0;
    let shown = score(net.model, data);
    let run: Run = 'paused';
    let pic = picture(net.model);
    let row: number | null = null;

    const write = () => {
      put(p.steps, steps.toLocaleString('en-US'));
      put(p.stepWord, steps === 1 ? 'step' : 'steps');
      put(p.loss, shown.loss.toFixed(3));
      put(p.accuracy, `${Math.round(shown.accuracy * 100)}%`);
      put(p.name, name);
      put(p.train, stage.reducedMotion ? `Train ${reducedMotionSteps} steps` : 'Train');
      press(p.train, run !== 'paused');
      press(p.pause, run === 'paused');
      for (const each of names) press(p[each], each === name);
    };
    const trainOnce = () => {
      trainStep(net.model, data, net.step);
      steps++;
    };
    const start = (next: DatasetName) => {
      name = next;
      data = points(next);
      net = network(seed++);
      steps = 0;
      shown = score(net.model, data);
      run = 'paused';
      write();
      stage.wake();
    };
    const pick = (next: number | null) => {
      if (next === row) return;
      row = next;
      stage.wake();
    };
    const rowAt = (clientY: number) => {
      const r = Math.floor((clientY - p.hinton.getBoundingClientRect().top - knobHead) / knobCell);
      return r >= 0 && r < pic.first.length ? r : null;
    };

    const on = { signal: stage.signal };
    p.train.addEventListener(
      'click',
      () => {
        run = stage.reducedMotion ? { until: steps + reducedMotionSteps } : 'running';
        write();
        stage.wake();
      },
      on,
    );
    p.pause.addEventListener(
      'click',
      () => {
        run = 'paused';
        write();
        stage.wake();
      },
      on,
    );
    p.step.addEventListener(
      'click',
      () => {
        run = 'paused';
        trainOnce();
        shown = score(net.model, data);
        write();
        stage.wake();
      },
      on,
    );
    p.reset.addEventListener('click', () => start(name), on);
    for (const each of names) p[each].addEventListener('click', () => start(each), on);

    p.hinton.addEventListener('pointermove', (event) => pick(rowAt(event.clientY)), on);
    p.hinton.addEventListener('pointerdown', (event) => pick(rowAt(event.clientY)), on);
    p.hinton.addEventListener(
      'pointerleave',
      (event) => event.pointerType === 'mouse' && pick(null),
      on,
    );
    p.hinton.addEventListener('blur', () => pick(null), on);
    p.hinton.addEventListener(
      'keydown',
      (event) => {
        const last = pic.first.length - 1;
        const next =
          event.key === 'ArrowDown'
            ? Math.min(last, (row ?? -1) + 1)
            : event.key === 'ArrowUp'
              ? Math.max(0, (row ?? last + 1) - 1)
              : event.key === 'Escape'
                ? null
                : row;
        if (next === row) return;
        event.preventDefault();
        pick(next);
      },
      on,
    );

    const hook = {
      get model() {
        return net.model;
      },
      get state() {
        return { name, steps, run, row, ...shown };
      },
      redraw: () => stage.wake(),
    };
    Object.assign(window, { __playground: hook });
    stage.defer(() => {
      if (Reflect.get(window, '__playground') === hook)
        Reflect.deleteProperty(window, '__playground');
    });

    write();

    return () => {
      if (run === 'running' && stage.reducedMotion) run = 'paused';
      if (run === 'running') {
        trainOnce();
      } else if (run !== 'paused') {
        const begin = performance.now();
        do trainOnce();
        while (steps < run.until && performance.now() - begin < batchMs);
        if (steps >= run.until) run = 'paused';
      }
      shown = score(net.model, data);
      if (typeof run === 'string') pic = picture(net.model);
      write();

      const ratio = Math.min(devicePixelRatio, 2);
      const field = stage.canvas(p.field);
      paintField(
        field,
        fieldFigure(pic, data, name, field.width, ratio),
        row === null ? null : pic.first[row],
        stage.tokens,
        stage.font(11),
      );
      paintKnobs(
        stage.canvas(p.hinton),
        knobFigure(pic.first, name, row),
        stage.tokens,
        stage.font(11),
      );
      return run !== 'paused';
    };
  },
});

let trained: { pic: Picture; data: Point[] } | undefined;

function trainedDays() {
  if (!trained) {
    const data = points('days');
    const net = network(firstNetworkSeed);
    train(net, data, stillSteps);
    trained = { pic: picture(net.model), data };
  }
  return trained;
}

const ink = (share: number) =>
  `color-mix(in srgb, var(--ink) ${+(share * 100).toFixed(2)}%, var(--bg))`;
const rounded = (v: number) => +v.toFixed(1);
const anchors = { left: 'start', center: 'middle', right: 'end' } as const;

export function Still() {
  const { pic, data } = trainedDays();
  const field = fieldFigure(pic, data, 'days', 418);
  const knobs = knobFigure(pic.first, 'days', null);
  const { plot, dot } = field;
  const shades = new Map<number, string>();
  for (const run of field.runs) {
    const d = `M${run.x} ${run.y}h${run.width}v${run.height}h${-run.width}z`;
    shades.set(run.level, (shades.get(run.level) ?? '') + d);
  }
  const gaps = field.gaps
    .map(
      (gap) =>
        `M${plot.x + gap} ${plot.y}h1v${plot.size}h-1zM${plot.x} ${plot.y + gap}h${plot.size}v1h${-plot.size}z`,
    )
    .join('');
  const contour = field.contour
    .map(([x1, y1, x2, y2]) => `M${rounded(x1)} ${rounded(y1)}L${rounded(x2)} ${rounded(y2)}`)
    .join('');
  const square = (x: number, y: number, side: number) => `M${x} ${y}h${side}v${side}h${-side}z`;
  const filled = field.points.filter((point) => point.filled);
  const hollow = field.points.filter((point) => !point.filled);
  return (
    <div className="demo-still">
      <PlaygroundLayout
        field={
          <svg
            viewBox={`0 0 ${field.width} ${field.width}`}
            className="aspect-square w-full"
            aria-hidden="true"
          >
            {[...shades].map(([level, d]) => (
              <path key={level} d={d} style={{ fill: ink(toneOf(level)) }} />
            ))}
            <path className="fill-bg" d={gaps} />
            <path d={contour} fill="none" strokeWidth={1} style={{ stroke: ink(0.5) }} />
            <path className="fill-ink" d={filled.map((p) => square(p.x, p.y, dot)).join('')} />
            <path
              className="fill-bg stroke-ink"
              strokeWidth={1}
              d={hollow.map((p) => square(p.x + 0.5, p.y + 0.5, dot - 1)).join('')}
            />
            <g className="fill-faint" fontSize={11}>
              {field.across.map((label) => (
                <text
                  key={label.text}
                  x={label.x}
                  y={label.y}
                  textAnchor={anchors[label.align]}
                  dominantBaseline="central"
                >
                  {label.text}
                </text>
              ))}
              {field.up.map((label) => (
                <text
                  key={label.text}
                  transform={`translate(${label.x} ${label.y}) rotate(-90)`}
                  textAnchor={anchors[label.align]}
                  dominantBaseline="central"
                >
                  {label.text}
                </text>
              ))}
            </g>
          </svg>
        }
        hinton={
          <svg
            viewBox={`0 0 ${knobs.width} ${knobs.height}`}
            className="h-[308px] w-[108px]"
            aria-hidden="true"
          >
            <g className="fill-faint" fontSize={11}>
              {knobs.labels.map((label) => (
                <text
                  key={label.text}
                  x={label.x}
                  y={label.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {label.text}
                </text>
              ))}
            </g>
            <path
              className="fill-wash"
              d={knobs.cells.map((cell) => square(cell.x, cell.y, cell.size)).join('')}
            />
            <path
              className="fill-ink"
              d={knobs.cells
                .flatMap(({ square: s }) => (s?.filled ? [square(s.x, s.y, s.side)] : []))
                .join('')}
            />
            <path
              className="fill-wash stroke-ink"
              strokeWidth={1}
              d={knobs.cells
                .flatMap(({ square: s }) =>
                  s && !s.filled ? [square(s.x + 0.5, s.y + 0.5, s.side - 1)] : [],
                )
                .join('')}
            />
          </svg>
        }
      />
    </div>
  );
}
