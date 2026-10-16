import { symbols as nameSymbols } from '../ml/tokenizers';
import {
  type MapFigure,
  type View,
  fitReach,
  followLabel,
  labelFontSize,
  mapFigure,
  restView,
  side,
} from './letterMap';
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

const easeMs = 250;
const axisTone = 0.25;

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

const square = ({ x, y }: { x: number; y: number }) => ({
  x: Math.round(x - side / 2),
  y: Math.round(y - side / 2),
});

const pointTone = ({ vowel, depth }: { vowel: boolean; depth: number }) =>
  (vowel ? 1 : 0.55) * (0.45 + 0.55 * depth);

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
  selected: string,
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
  for (const point of figure.points) {
    const { x, y } = square(point);
    ctx.fillStyle = css(mix(bg, ink, pointTone(point) * 0.45));
    ctx.fillRect(x, y, side, side);
  }
  ctx.font = font;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = css(faint);
  for (const { label } of figure.axes) {
    if (label) ctx.fillText(label.text, label.x, label.y);
  }
  const followed = figure.points.find((point) => point.symbol === selected);
  if (followed) {
    const { x, y } = square(followed);
    ctx.fillStyle = css(ink);
    ctx.fillRect(x, y, side, side);
    const label = followLabel(shownSymbol(followed.text));
    ctx.fillText(label.text, label.x, label.y);
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

const shownSymbol = (symbol: string) => symbol.replace(' ', '·').replace('\n', '↵');
const spoken = (symbol: string) =>
  symbol === ' ' ? 'space' : symbol === '\n' ? 'line break' : symbol === '.' ? 'the dot' : symbol;

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
      letter: 'select',
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
      let done = false;
      let trainer: Trainer | undefined;

      const writeTrain = () => {
        p.train.textContent =
          trainer?.training && running
            ? 'Pause'
            : done && model === 'gpt'
              ? 'Train again'
              : 'Train';
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
        done = update.done;
        p.loss.textContent = update.average === null ? 'not measured' : update.average.toFixed(2);
        p.step.textContent = update.step.toLocaleString('en-US');
        p.map.dataset.step = String(update.step);
        p.map.dataset.steps = String(update.timing.steps);
        p.map.dataset.ms = update.timing.ms.toFixed(1);
        writeTrain();
      };

      const snapshot = (update: Snapshot) => {
        const places = placesOf(update);
        if (motion.symbols !== update.symbols) {
          const selected = p.letter.value;
          p.letter.replaceChildren(
            ...Array.from(update.symbols, (symbol) => new Option(spoken(symbol), symbol)),
          );
          p.letter.value = update.symbols.includes(selected) ? selected : update.symbols[0];
        }
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
        p.map.dataset.symbols = update.symbols;
        p.map.dataset.width = String(update.width);
        p.map.dataset.projected = Array.from(places).join(',');
        p.map.dataset.places = Array.from(update.vectors, (n) => n.toFixed(4)).join(',');
        if (!update.running) writeNearest(places, update.symbols);
        stage.wake();
      };

      const sample = ({ text }: Sample) => {
        p.names.classList.replace('text-faint', 'text-ink');
        if (model === 'gpt') {
          p.names.classList.add('whitespace-pre-wrap');
          p.names.textContent = text;
          return;
        }
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
            if (done && model === 'gpt') trainer.reset();
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

      p.letter.addEventListener('change', () => stage.wake(), on);

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
        const figure = mapFigure(shown.places, motion.symbols, view, ctx, shown.reach);
        drawMap(ctx, figure, stage.tokens, stage.font(labelFontSize), p.letter.value);
        return turning || shown.moving;
      };
    },
  });
}

export default letterSpace({ model: 'threeLetter' });

const tenth = (n: number) => Math.round(n * 10) / 10;
const mixed = (tone: number) =>
  `color-mix(in srgb, var(--ink) ${Math.round(tone * 100)}%, var(--bg))`;

function makeStills(places: ArrayLike<number>, symbols: string) {
  return [
    { width: 672, height: 420, className: '[@container(max-width:478px)]:hidden' },
    { width: 320, height: 300, className: 'hidden [@container(max-width:478px)]:block' },
  ].map((box) => {
    const columns = Math.floor(box.width / 28);
    const keyHeight = Math.ceil(symbols.length / columns) * 28;
    return {
      ...box,
      symbols,
      columns,
      keyHeight,
      figure: mapFigure(
        places,
        symbols,
        restView,
        { width: box.width, height: box.height - keyHeight },
        fitReach(places),
      ),
    };
  });
}

const stills = makeStills(trainedPlaces, nameSymbols);

export function Still({
  places = trainedPlaces,
  symbols = nameSymbols,
}: { places?: ArrayLike<number>; symbols?: string } = {}) {
  const figures =
    places === trainedPlaces && symbols === nameSymbols ? stills : makeStills(places, symbols);
  return (
    <>
      {figures.map((still) => (
        <MapSvg key={still.width} {...still} />
      ))}
    </>
  );
}

function MapSvg({
  width,
  height,
  className,
  symbols,
  columns,
  keyHeight,
  figure,
}: (typeof stills)[number]) {
  return (
    <svg
      className={`demo-still ${className} [&:has(.letter-key:focus)_.letter-default]:hidden [&:has(.letter-key:focus)_.letter-key:not(:focus)_.letter-follow]:hidden [&:has(.letter-key:hover)_.letter-default]:hidden [&_.letter-key:focus-visible]:outline-none`}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      aria-label="Letter map. Focus or tap a letter below to follow its square."
    >
      <g style={{ stroke: mixed(axisTone) }}>
        {figure.axes.map((axis) => (
          <line
            key={axis.text}
            x1={tenth(axis.x1)}
            y1={tenth(axis.y1)}
            x2={tenth(axis.x2)}
            y2={tenth(axis.y2)}
          />
        ))}
      </g>
      {figure.points.map((point) => (
        <rect
          key={point.symbol}
          {...square(point)}
          width={side}
          height={side}
          style={{ fill: mixed(pointTone(point) * 0.45) }}
        />
      ))}
      <g fontSize={labelFontSize} dominantBaseline="central" className="fill-faint">
        {figure.axes.map(
          ({ text, label }) =>
            label && (
              <text key={text} x={label.x} y={label.y}>
                {label.text}
              </text>
            ),
        )}
      </g>
      {figure.points
        .filter((p) => p.symbol === 'a')
        .map((point) => (
          <Followed key={point.symbol} point={point} className="letter-default" />
        ))}
      {[...figure.points]
        .sort((a, b) => symbols.indexOf(a.symbol) - symbols.indexOf(b.symbol))
        .map((point, i) => {
          const { symbol } = point;
          const x = (i % columns) * 28;
          const y = height - keyHeight + Math.floor(i / columns) * 28;
          return (
            <g
              key={symbol}
              tabIndex={0}
              role="button"
              aria-label={`Follow ${spoken(symbol)}`}
              className="letter-key group/letter cursor-pointer outline-none"
            >
              <rect
                x={x + 2}
                y={y + 2}
                width={24}
                height={24}
                fill="transparent"
                className="group-hover/letter:stroke-ink group-focus/letter:stroke-ink"
              />
              <text
                x={x + 14}
                y={y + 15}
                fontSize={labelFontSize}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-faint group-hover/letter:fill-ink group-focus/letter:fill-ink"
              >
                {shownSymbol(symbol)}
              </text>
              <Followed
                point={point}
                className="letter-follow pointer-events-none hidden group-hover/letter:block group-focus/letter:block"
              />
            </g>
          );
        })}
    </svg>
  );
}

function Followed({ point, className }: { point: MapFigure['points'][number]; className: string }) {
  const label = followLabel(shownSymbol(point.text));
  return (
    <g className={`${className} fill-ink`} aria-hidden="true">
      <rect {...square(point)} width={side} height={side} />
      <text x={label.x} y={label.y} fontSize={labelFontSize} dominantBaseline="central">
        {label.text}
      </text>
    </g>
  );
}
