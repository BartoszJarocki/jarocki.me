import { symbols as nameSymbols } from '../ml/tokenizers';
import { places as trainedPlaces } from './letterPlaces';
import { type Rgb, type Stage, type Tokens, css, defineScene } from './stage';
import {
  type ModelKind,
  type Progress,
  type Sample,
  type Snapshot,
  type Trainer,
  openTrainer,
} from './trainer';

export type View = { yaw: number; pitch: number };

const restView: View = { yaw: -30, pitch: 20 };
const easeMs = 250;
const margin = 18;
const side = 5;
const labelGap = 6;
const axisTone = 0.25;
const vowels = 'aeiou';
const deg = Math.PI / 180;

const arrows: Record<string, View> = {
  ArrowLeft: { yaw: -8, pitch: 0 },
  ArrowRight: { yaw: 8, pitch: 0 },
  ArrowUp: { yaw: 0, pitch: -8 },
  ArrowDown: { yaw: 0, pitch: 8 },
};

const clampView = ({ yaw, pitch }: View): View => ({
  yaw,
  pitch: Math.max(-80, Math.min(80, pitch)),
});

function fitReach(places: ArrayLike<number>) {
  const radii: number[] = [];
  for (let i = 0; i < places.length; i += 3) {
    radii.push(Math.hypot(places[i], places[i + 1], places[i + 2]));
  }
  radii.sort((a, b) => a - b);
  const median = radii[radii.length >> 1];
  return Math.max(1, Math.min(1.15 * radii[radii.length - 1], 3 * median));
}

const square = ({ x, y }: { x: number; y: number }) => ({
  x: Math.round(x - side / 2),
  y: Math.round(y - side / 2),
});

const pointTone = ({ vowel, depth }: { vowel: boolean; depth: number }) =>
  (vowel ? 1 : 0.55) * (0.45 + 0.55 * depth);

export type MapFigure = ReturnType<typeof mapFigure>;

export function mapFigure(
  places: ArrayLike<number>,
  symbols: string,
  view: View,
  box: { width: number; height: number },
  reach: number,
) {
  const cosYaw = Math.cos(view.yaw * deg);
  const sinYaw = Math.sin(view.yaw * deg);
  const cosPitch = Math.cos(view.pitch * deg);
  const sinPitch = Math.sin(view.pitch * deg);
  const scale = (Math.min(box.width, box.height) / 2 - margin) / reach;
  const place = (a: number, b: number, c: number) => {
    const across = a * cosYaw + c * sinYaw;
    const toward = c * cosYaw - a * sinYaw;
    return {
      x: box.width / 2 + across * scale,
      y: box.height / 2 - (b * cosPitch - toward * sinPitch) * scale,
      depth: 0.5 + (b * sinPitch + toward * cosPitch) / (2 * reach),
    };
  };
  const points = Array.from(symbols, (symbol, i) => {
    const [a, b, c] = [places[i * 3], places[i * 3 + 1], places[i * 3 + 2]];
    const beyond = Math.hypot(a, b, c) > reach;
    const pull = beyond ? reach / Math.hypot(a, b, c) : 1;
    return {
      ...place(a * pull, b * pull, c * pull),
      symbol,
      vowel: vowels.includes(symbol),
      beyond,
    };
  }).sort((m, n) => m.depth - n.depth);
  const center = place(0, 0, 0);
  const ends = [
    [reach, 0, 0],
    [0, reach, 0],
    [0, 0, reach],
  ] as const;
  const axes = ends.map(([a, b, c], i) => {
    const tip = place(a, b, c);
    const tail = place(-a, -b, -c);
    const dx = tip.x - center.x;
    const dy = tip.y - center.y;
    const length = Math.hypot(dx, dy) || 1;
    return {
      x1: tail.x,
      y1: tail.y,
      x2: tip.x,
      y2: tip.y,
      label: String(i + 1),
      labelX: tip.x + (dx / length) * 10,
      labelY: tip.y + (dy / length) * 10,
    };
  });
  return { points, axes };
}

const mix = (from: Rgb, to: Rgb, t: number): Rgb => [
  from[0] + (to[0] - from[0]) * t,
  from[1] + (to[1] - from[1]) * t,
  from[2] + (to[2] - from[2]) * t,
];

function drawMap(
  ctx: ReturnType<Stage['canvas']>,
  figure: MapFigure,
  { bg, ink, faint }: Tokens,
  font: string,
) {
  ctx.fillStyle = css(bg);
  ctx.fillRect(0, 0, ctx.width, ctx.height);
  ctx.lineWidth = 1;
  ctx.strokeStyle = css(mix(bg, ink, axisTone));
  ctx.beginPath();
  for (const axis of figure.axes) {
    ctx.moveTo(axis.x1, axis.y1);
    ctx.lineTo(axis.x2, axis.y2);
  }
  ctx.stroke();
  ctx.font = font;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillStyle = css(faint);
  for (const axis of figure.axes) ctx.fillText(axis.label, axis.labelX, axis.labelY);
  ctx.textAlign = 'left';
  for (const point of figure.points) {
    const tone = css(mix(bg, ink, pointTone(point)));
    const { x, y } = square(point);
    if (point.beyond) {
      ctx.strokeStyle = tone;
      ctx.strokeRect(x + 0.5, y + 0.5, side - 1, side - 1);
    } else {
      ctx.fillStyle = tone;
      ctx.fillRect(x, y, side, side);
    }
    ctx.fillStyle = css(point.vowel ? ink : faint);
    ctx.fillText(point.symbol, point.x + labelGap, point.y);
  }
}

type Motion = {
  readonly symbols: string;
  readonly from: Float32Array;
  readonly to: Float32Array;
  readonly reachFrom: number;
  readonly reachTo: number;
  readonly start: number;
};

function shownAt(motion: Motion, now: number) {
  const t = Math.min(1, Math.max(0, (now - motion.start) / easeMs));
  if (t === 1) return { places: motion.to, reach: motion.reachTo, moving: false };
  return {
    places: motion.to.map((to, i) => motion.from[i] + (to - motion.from[i]) * t),
    reach: motion.reachFrom + (motion.reachTo - motion.reachFrom) * t,
    moving: true,
  };
}

const spoken = (symbol: string) => (symbol === '.' ? 'the dot' : symbol);

function nearest(places: ArrayLike<number>, symbols: string, from: number, count: number) {
  const distance = (to: number) =>
    Math.hypot(
      places[to * 3] - places[from * 3],
      places[to * 3 + 1] - places[from * 3 + 1],
      places[to * 3 + 2] - places[from * 3 + 2],
    );
  return Array.from(symbols, (_, to) => to)
    .filter((to) => to !== from)
    .sort((a, b) => distance(a) - distance(b))
    .slice(0, count)
    .map((to) => symbols[to]);
}

export function letterSpace({
  model,
  project,
}: {
  model: ModelKind;
  project?: (vectors: Float32Array, width: number) => Float32Array;
}) {
  const placesOf = ({ vectors, width }: Snapshot) => {
    if (project) return project(vectors, width);
    if (width !== 3) {
      throw new Error(`The ${model} model has ${width} numbers per letter and no projection to 3`);
    }
    return vectors;
  };

  return defineScene({
    parts: {
      map: 'canvas',
      train: 'button',
      reset: 'button',
      sample: 'button',
      loss: 'span',
      step: 'span',
      names: 'div',
      nearest: 'tbody',
    },
    async mount(stage, p) {
      const on = { signal: stage.signal };
      let motion: Motion = {
        symbols: '',
        from: new Float32Array(0),
        to: new Float32Array(0),
        reachFrom: 1,
        reachTo: 1,
        start: -Infinity,
      };
      let running = false;
      let trainer: Trainer | undefined;

      const writeTrain = () => {
        p.train.textContent = trainer?.training && running ? 'Pause' : 'Train';
      };

      const writeNearest = (places: ArrayLike<number>, symbols: string) => {
        p.nearest.replaceChildren(
          ...Array.from(symbols, (symbol, i) => {
            const row = document.createElement('tr');
            row.append(
              Object.assign(document.createElement('th'), {
                scope: 'row',
                textContent: spoken(symbol),
              }),
            );
            row.insertCell().textContent = nearest(places, symbols, i, 5).map(spoken).join(', ');
            return row;
          }),
        );
      };

      const progress = (update: Progress) => {
        running = update.running && !update.done;
        p.loss.textContent = update.average === null ? '' : update.average.toFixed(2);
        p.step.textContent = update.step.toLocaleString('en-US');
        p.map.dataset.step = String(update.step);
        p.map.dataset.steps = String(update.timing.steps);
        p.map.dataset.ms = update.timing.ms.toFixed(1);
        writeTrain();
      };

      const snapshot = (update: Snapshot) => {
        const places = placesOf(update);
        const now = performance.now();
        const shown = shownAt(motion, now);
        motion = {
          symbols: update.symbols,
          from: motion.symbols === update.symbols ? shown.places : places,
          to: places,
          reachFrom: shown.reach,
          reachTo: fitReach(places),
          start: stage.reducedMotion ? -Infinity : now,
        };
        p.map.dataset.places = Array.from(update.vectors, (n) => n.toFixed(4)).join(',');
        if (!update.running) writeNearest(places, update.symbols);
        stage.wake();
      };

      const sample = ({ text }: Sample) => {
        p.names.classList.replace('text-faint', 'text-ink');
        p.names.replaceChildren(
          ...text
            .split(' ')
            .filter(Boolean)
            .map((name) => Object.assign(document.createElement('span'), { textContent: name })),
        );
      };

      trainer = await openTrainer(stage, model, { progress, snapshot, sample });
      writeTrain();

      p.train.addEventListener(
        'click',
        () => {
          if (trainer.training && running) {
            trainer.pause();
          } else {
            trainer.train();
            running = trainer.training;
          }
          writeTrain();
        },
        on,
      );
      p.reset.addEventListener(
        'click',
        () => {
          trainer.reset();
          running = false;
          writeTrain();
        },
        on,
      );
      p.sample.addEventListener('click', () => trainer.sample(), on);

      const view: View = { ...restView };
      let target: View = { ...restView };
      const turnTo = (next: View) => {
        target = clampView(next);
        stage.wake();
      };

      let drag: { x: number; y: number; from: View; pointer: number; moved: boolean } | null = null;
      p.map.addEventListener(
        'pointerdown',
        (event) => {
          drag = {
            x: event.clientX,
            y: event.clientY,
            from: target,
            pointer: event.pointerId,
            moved: false,
          };
        },
        on,
      );
      p.map.addEventListener(
        'pointermove',
        (event) => {
          if (drag?.pointer !== event.pointerId || !event.buttons) return;
          const dx = event.clientX - drag.x;
          const dy = event.clientY - drag.y;
          if (!drag.moved) {
            if (Math.hypot(dx, dy) <= 4) return;
            drag.moved = true;
            p.map.setPointerCapture(event.pointerId);
          }
          turnTo({ yaw: drag.from.yaw + dx * 0.4, pitch: drag.from.pitch + dy * 0.4 });
        },
        on,
      );
      const release = () => {
        drag = null;
      };
      p.map.addEventListener('pointerup', release, on);
      p.map.addEventListener('pointercancel', release, on);
      p.map.addEventListener(
        'dblclick',
        () => {
          const back = restView.yaw - view.yaw;
          turnTo({ yaw: view.yaw + back - 360 * Math.round(back / 360), pitch: restView.pitch });
        },
        on,
      );
      p.map.addEventListener(
        'keydown',
        (event) => {
          const step = arrows[event.key];
          if (!step) return;
          const next = clampView({ yaw: target.yaw + step.yaw, pitch: target.pitch + step.pitch });
          if (next.yaw === target.yaw && next.pitch === target.pitch) return;
          event.preventDefault();
          turnTo(next);
        },
        on,
      );

      return (now) => {
        let turning = false;
        for (const key of ['yaw', 'pitch'] as const) {
          const delta = target[key] - view[key];
          if (Math.abs(delta) > 0.05 && !stage.reducedMotion) {
            view[key] += delta * 0.14;
            turning = true;
          } else view[key] = target[key];
        }
        const shown = shownAt(motion, now);
        const ctx = stage.canvas(p.map);
        drawMap(
          ctx,
          mapFigure(shown.places, motion.symbols, view, ctx, shown.reach),
          stage.tokens,
          stage.font(11),
        );
        return turning || shown.moving;
      };
    },
  });
}

export default letterSpace({ model: 'threeLetter' });

const tenth = (n: number) => Math.round(n * 10) / 10;
const mixed = (tone: number) =>
  `color-mix(in srgb, var(--ink) ${Math.round(tone * 100)}%, var(--bg))`;

export function Still() {
  return (
    <>
      <MapSvg width={672} height={420} className="[@container(max-width:478px)]:hidden" />
      <MapSvg width={320} height={300} className="hidden [@container(max-width:478px)]:block" />
    </>
  );
}

function MapSvg({
  width,
  height,
  className,
}: {
  width: number;
  height: number;
  className: string;
}) {
  const figure = mapFigure(
    trainedPlaces,
    nameSymbols,
    restView,
    { width, height },
    fitReach(trainedPlaces),
  );
  return (
    <svg
      className={`demo-still ${className}`}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <g style={{ stroke: mixed(axisTone) }}>
        {figure.axes.map((axis) => (
          <line
            key={axis.label}
            x1={tenth(axis.x1)}
            y1={tenth(axis.y1)}
            x2={tenth(axis.x2)}
            y2={tenth(axis.y2)}
          />
        ))}
      </g>
      <g fontSize={11} dominantBaseline="central">
        <g className="fill-faint" textAnchor="middle">
          {figure.axes.map((axis) => (
            <text key={axis.label} x={tenth(axis.labelX)} y={tenth(axis.labelY)}>
              {axis.label}
            </text>
          ))}
        </g>
        {figure.points.map((point) => {
          const { x, y } = square(point);
          const tone = mixed(pointTone(point));
          return (
            <g key={point.symbol}>
              {point.beyond ? (
                <rect
                  x={x + 0.5}
                  y={y + 0.5}
                  width={side - 1}
                  height={side - 1}
                  fill="none"
                  style={{ stroke: tone }}
                />
              ) : (
                <rect x={x} y={y} width={side} height={side} style={{ fill: tone }} />
              )}
              <text
                className={point.vowel ? 'fill-ink' : 'fill-faint'}
                x={tenth(point.x + labelGap)}
                y={tenth(point.y)}
              >
                {point.symbol}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
