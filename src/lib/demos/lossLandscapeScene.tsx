import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  ColorManagement,
  DoubleSide,
  Float32BufferAttribute,
  Line,
  LineBasicMaterial,
  LineSegments,
  LinearSRGBColorSpace,
  Mesh,
  OrthographicCamera,
  Raycaster,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderer,
} from 'three';

import {
  type Rate,
  type Walk,
  contour,
  ended,
  lift,
  lossAtLift,
  rates,
  step,
  valley,
  walkFrom,
} from './lossLandscape';
import { type PartsOf, type Rgb, type Stage, type Tokens, css, defineScene } from './stage';
import { type FareRule, fareBox, fareRule, meanSquaredError, start } from './taxiFares';
import { drawFares, fareFigure } from './taxiFaresScene';

const parts = {
  view: 'div',
  valley: 'canvas',
  inset: 'canvas',
  loss: 'span',
  steps: 'span',
  unit: 'span',
  status: 'span',
  step: 'button',
  walk: 'button',
  fog: 'button',
  reset: 'button',
  crawl: 'button',
  good: 'button',
  zigzag: 'button',
  tooBig: 'button',
} as const;

type Parts = PartsOf<typeof parts>;

type ValleyMap = {
  /** Draws the map with the cube at `at`. Returns true while the view still moves on its own. */
  draw(at: FareRule, trail: readonly FareRule[], fog: boolean): boolean;
};

/** The map is a grid of cells, and the fog leaves the cube's cell and two more on every side. */
const cells = 24;
const fogReach = 2;

const remarks: Record<Walk['status'], string | null> = {
  ready: null,
  down: null,
  up: 'That step went uphill',
  flat: 'The ground is flat here',
  off: 'The next step leaves the map',
};

const cellOf = ({ fee, price }: FareRule) =>
  [fee / fareBox.fee.max, price / fareBox.price.max].map((t) =>
    Math.max(0, Math.min(cells - 1, Math.floor(t * cells))),
  );

const mix = (from: Rgb, to: Rgb, t: number): Rgb => [
  from[0] + (to[0] - from[0]) * t,
  from[1] + (to[1] - from[1]) * t,
  from[2] + (to[2] - from[2]) * t,
];

const wireTone = 0.42;

export default defineScene({
  parts,
  async mount(stage, attached) {
    // React detaches the parts before the scene ends, and the teardown still needs them.
    const p = { ...attached };
    let rate: Rate = 'good';
    let fog = false;
    let walking = false;
    let walk = walkFrom(fareRule.get());
    let trail = [walk.at];
    let glide = { from: walk.at, start: 0, ms: 0 };

    const restart = (at: FareRule) => {
      walk = walkFrom(at);
      trail = [at];
      walking = false;
      glide = { from: at, start: 0, ms: 0 };
    };
    const take = (next: Walk, now: number, ms: number) => {
      if (next.at !== walk.at) {
        glide = { from: walk.at, start: now, ms };
        trail.push(next.at);
      }
      walk = next;
      if (ended(walk)) walking = false;
    };
    const advance = (now: number) => {
      const ms = stage.reducedMotion ? 0 : Math.max(20, 170 * 0.92 ** walk.steps);
      take(step(walk, rates[rate]), now, ms);
      fareRule.set(walk.at);
      show();
    };
    const jumpToEnd = () => {
      while (!ended(walk)) take(step(walk, rates[rate]), 0, 0);
      fareRule.set(walk.at);
      show();
    };
    const goTo = (at: FareRule) => {
      restart(at);
      fareRule.set(at);
      show();
      stage.wake();
    };

    const put = (element: HTMLElement, text: string) => {
      if (element.textContent !== text) element.textContent = text;
    };
    const press = (button: HTMLButtonElement, on: boolean) =>
      button.setAttribute('aria-pressed', String(on));
    const rateButtons = { crawl: p.crawl, good: p.good, zigzag: p.zigzag, tooBig: p.tooBig };

    function show() {
      put(p.loss, meanSquaredError(walk.at).toFixed(2));
      put(p.steps, walk.steps.toLocaleString('en-US'));
      put(p.unit, walk.steps === 1 ? 'step' : 'steps');
      put(p.status, remarks[walk.status] ?? `Step size ${rates[rate].toFixed(3)}`);
      press(p.walk, walking);
      press(p.fog, fog);
      for (const [name, button] of Object.entries(rateButtons)) press(button, name === rate);
      Object.assign(p.view.dataset, {
        fee: String(walk.at.fee),
        price: String(walk.at.price),
        steps: String(walk.steps),
        status: walk.status,
        rate,
        fog: String(fog),
      });
    }

    const on = { signal: stage.signal };
    const click = (button: HTMLButtonElement, action: () => void) =>
      button.addEventListener(
        'click',
        () => {
          action();
          show();
          stage.wake();
        },
        on,
      );
    click(p.step, () => {
      walking = false;
      advance(performance.now());
    });
    click(p.walk, () => {
      if (walking) walking = false;
      else if (stage.reducedMotion) jumpToEnd();
      else if (!ended(walk)) {
        walking = true;
        glide = { ...glide, ms: 0 };
      }
    });
    click(p.fog, () => (fog = !fog));
    click(p.reset, () => goTo(start));
    for (const [name, button] of Object.entries(rateButtons)) {
      click(button, () => {
        rate = name as Rate;
        if (ended(walk)) goTo(start);
      });
    }

    fareRule.subscribe(() => {
      if (fareRule.get() !== walk.at) restart(fareRule.get());
      show();
      stage.wake();
    }, stage.signal);
    show();

    const gl = p.valley.getContext('webgl2', {
      alpha: true,
      antialias: true,
      depth: true,
      stencil: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
    });
    const map = gl ? await valley3d(stage, p, gl, goTo) : valley2d(stage, p, goTo);

    return (now) => {
      if (walking && now - glide.start >= glide.ms) advance(now);
      const t = glide.ms ? Math.min(1, Math.max(0, (now - glide.start) / glide.ms)) : 1;
      const eased = t * (2 - t);
      const at = {
        fee: glide.from.fee + (walk.at.fee - glide.from.fee) * eased,
        price: glide.from.price + (walk.at.price - glide.from.price) * eased,
      };
      p.view.dataset.cell = cellOf(at).join(',');
      const turning = map.draw(at, fog ? [] : trail, fog);
      const inset = stage.canvas(p.inset);
      drawFares(
        inset,
        fareFigure(at, inset.width, inset.height, true),
        stage.tokens,
        stage.font(11),
      );
      return walking || t < 1 || turning;
    };
  },
});

// ---------- the valley in 3D

const fine = 48;
const tall = 10;
const deg = Math.PI / 180;
type View = { yaw: number; pitch: number };
const rest: View = { yaw: 30, pitch: 38 };
const arrows: Record<string, View> = {
  ArrowLeft: { yaw: 8, pitch: 0 },
  ArrowRight: { yaw: -8, pitch: 0 },
  ArrowUp: { yaw: 0, pitch: -6 },
  ArrowDown: { yaw: 0, pitch: 6 },
};
const clampView = ({ yaw, pitch }: View): View => ({
  yaw: Math.max(-60, Math.min(60, yaw)),
  pitch: Math.max(8, Math.min(89, pitch)),
});

const toX = (fee: number) => (fee / fareBox.fee.max - 0.5) * cells;
const toZ = (price: number) => (0.5 - price / fareBox.price.max) * cells;
const ruleAt = (i: number, j: number): FareRule => ({
  fee: (i / fine) * fareBox.fee.max,
  price: (j / fine) * fareBox.price.max,
});
const point = (rule: FareRule): [number, number, number] => [
  toX(rule.fee),
  tall * lift(rule),
  toZ(rule.price),
];

// Each label sits just outside the edge it names, so its plate never covers the surface or the cube.
const axes = [
  { text: '$0', at: { fee: 0, price: 0 }, out: { fee: -0.9, price: -0.5 } },
  {
    text: `$${fareBox.fee.max}`,
    at: { fee: fareBox.fee.max, price: 0 },
    out: { fee: 0.4, price: -0.6 },
  },
  {
    text: `$${fareBox.price.max}`,
    at: { fee: 0, price: fareBox.price.max },
    out: { fee: -0.9, price: 0.3 },
  },
  {
    text: 'Starting fee',
    at: { fee: fareBox.fee.max / 2, price: 0 },
    out: { fee: 0, price: -0.8 },
  },
  {
    text: 'Price per km',
    at: { fee: 0, price: fareBox.price.max / 2 },
    out: { fee: -2.2, price: 0 },
  },
];

const vertexShader = `
  attribute vec2 cell;
  varying vec2 vCell;
  void main() {
    vCell = cell;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

const fragmentShader = `
  uniform vec3 uColor;
  uniform vec4 uWindow;
  uniform float uFog;
  varying vec2 vCell;
  void main() {
    if (uFog > 0.5 && (vCell.x < uWindow.x || vCell.x > uWindow.z || vCell.y < uWindow.y || vCell.y > uWindow.w)) discard;
    gl_FragColor = vec4(uColor, 1.0);
  }`;

// A fixed tone per face instead of lights, as in the skyline.
const cubeVertexShader = `
  varying vec3 vN;
  void main() {
    vN = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

const cubeFragmentShader = `
  uniform vec3 uInk;
  uniform vec3 uBg;
  varying vec3 vN;
  void main() {
    vec3 n = normalize(vN);
    float tone = n.z > 0.5 ? 1.0 : n.y > 0.5 ? 0.66 : n.y < -0.5 ? 0.3 : 0.44;
    gl_FragColor = vec4(mix(uBg, uInk, tone), 1.0);
  }`;

async function valley3d(
  stage: Stage,
  p: Parts,
  gl: WebGL2RenderingContext,
  place: (at: FareRule) => void,
): Promise<ValleyMap> {
  const renderer = new WebGLRenderer({ canvas: p.valley, context: gl, antialias: true });
  stage.defer(() => {
    renderer.dispose();
    if (!gl.isContextLost()) renderer.forceContextLoss();
  });
  ColorManagement.enabled = false;
  renderer.outputColorSpace = LinearSRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  // Creating the context and building the scene each take a while on a slow CPU, so they run in
  // separate tasks.
  await new Promise((resolve) => setTimeout(resolve));
  stage.signal.throwIfAborted();

  const owned = <T extends { dispose(): void }>(thing: T) => {
    stage.defer(() => thing.dispose());
    return thing;
  };
  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, -500, 500);

  const fogUniforms = { uWindow: { value: new Vector4() }, uFog: { value: 0 } };
  const fogged = (extra: ConstructorParameters<typeof ShaderMaterial>[0] = {}) =>
    owned(
      new ShaderMaterial({
        uniforms: { ...fogUniforms, uColor: { value: new Color() } },
        vertexShader,
        fragmentShader,
        ...extra,
      }),
    );
  const cellAt = (i: number, j: number) => [(i / fine) * cells, (j / fine) * cells];

  const positions = new Float32Array((fine + 1) ** 2 * 3);
  const gridCells = new Float32Array((fine + 1) ** 2 * 2);
  for (let j = 0; j <= fine; j++)
    for (let i = 0; i <= fine; i++) {
      const n = j * (fine + 1) + i;
      positions.set(point(ruleAt(i, j)), n * 3);
      gridCells.set(cellAt(i, j), n * 2);
    }
  const faces: number[] = [];
  for (let j = 0; j < fine; j++)
    for (let i = 0; i < fine; i++) {
      const a = j * (fine + 1) + i;
      faces.push(a, a + 1, a + fine + 1, a + 1, a + fine + 2, a + fine + 1);
    }
  const surfaceGeometry = owned(new BufferGeometry());
  surfaceGeometry.setAttribute('position', new BufferAttribute(positions, 3));
  surfaceGeometry.setAttribute('cell', new BufferAttribute(gridCells, 2));
  surfaceGeometry.setIndex(faces);
  // The surface is painted in bg and pushed back a little, so it hides the lines behind it.
  const surfaceMaterial = fogged({
    side: DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  const surface = new Mesh(surfaceGeometry, surfaceMaterial);

  const linePositions: number[] = [];
  const lineCells: number[] = [];
  const segment = (a: [number, number], b: [number, number]) => {
    linePositions.push(...point(ruleAt(...a)), ...point(ruleAt(...b)));
    lineCells.push(...cellAt(...a), ...cellAt(...b));
  };
  const every = fine / cells;
  for (let j = 0; j <= fine; j += every) for (let i = 0; i < fine; i++) segment([i, j], [i + 1, j]);
  for (let i = 0; i <= fine; i += every) for (let j = 0; j < fine; j++) segment([i, j], [i, j + 1]);
  const wireGeometry = owned(new BufferGeometry());
  wireGeometry.setAttribute('position', new Float32BufferAttribute(linePositions, 3));
  wireGeometry.setAttribute('cell', new Float32BufferAttribute(lineCells, 2));
  const wireMaterial = fogged();
  scene.add(surface, new LineSegments(wireGeometry, wireMaterial));

  const cubeGeometry = owned(new BoxGeometry(1, 1, 1));
  cubeGeometry.translate(0, 0.5, 0);
  const cubeMaterial = owned(
    new ShaderMaterial({
      uniforms: { uInk: { value: new Color() }, uBg: { value: new Color() } },
      vertexShader: cubeVertexShader,
      fragmentShader: cubeFragmentShader,
    }),
  );
  const cube = new Mesh(cubeGeometry, cubeMaterial);
  cube.renderOrder = 2;

  let trailPoints = new BufferAttribute(new Float32Array(64 * 3), 3);
  const trailGeometry = owned(new BufferGeometry());
  trailGeometry.setAttribute('position', trailPoints);
  const trailMaterial = owned(new LineBasicMaterial({ depthTest: false }));
  const trailLine = new Line(trailGeometry, trailMaterial);
  trailLine.frustumCulled = false;
  trailLine.renderOrder = 1;
  scene.add(cube, trailLine);

  const overlay = document.createElement('div');
  overlay.className = 'pointer-events-none absolute inset-0 overflow-hidden';
  overlay.setAttribute('aria-hidden', 'true');
  p.view.append(overlay);
  stage.defer(() => overlay.remove());
  const labels = axes.map(({ text, at, out }) => {
    const element = document.createElement('span');
    element.className =
      'absolute left-0 top-0 whitespace-nowrap bg-bg px-[1ch] text-[11px] leading-4 text-faint';
    element.textContent = text;
    overlay.append(element);
    const [, y] = point(at);
    return { element, at: new Vector3(toX(at.fee + out.fee), y, toZ(at.price + out.price)) };
  });

  const center = new Vector3(0, tall * 0.3, 0);
  const corner = new Vector3();
  const fitPoints: Vector3[] = labels.map((label) => label.at);
  for (let j = 0; j <= fine; j += 4)
    for (let i = 0; i <= fine; i += 4) {
      const [x, y, z] = point(ruleAt(i, j));
      fitPoints.push(new Vector3(x, y, z), new Vector3(x, y + 1.2, z));
    }

  let view = { ...rest };
  let target = { ...rest };
  let restScale = 0;
  let width = 0;
  let height = 0;
  let ratio = 0;

  function placeCamera() {
    camera.position.set(
      center.x + Math.sin(view.yaw * deg) * Math.cos(view.pitch * deg) * 100,
      center.y + Math.sin(view.pitch * deg) * 100,
      center.z + Math.cos(view.yaw * deg) * Math.cos(view.pitch * deg) * 100,
    );
    camera.lookAt(center);
    camera.updateMatrixWorld();
  }

  // Fits the valley and its labels, and never draws it larger than in the rest view, so turning it
  // can shrink it but never zooms in.
  function fit() {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const fitPoint of fitPoints) {
      corner.copy(fitPoint).applyMatrix4(camera.matrixWorldInverse);
      minX = Math.min(minX, corner.x);
      maxX = Math.max(maxX, corner.x);
      minY = Math.min(minY, corner.y);
      maxY = Math.max(maxY, corner.y);
    }
    const need = Math.max((maxX - minX) / (width - 100), (maxY - minY) / (height - 32));
    if (!restScale) restScale = need;
    const scale = Math.max(need, restScale);
    const x = (minX + maxX) / 2;
    const y = (minY + maxY) / 2;
    camera.left = x - (width * scale) / 2;
    camera.right = x + (width * scale) / 2;
    camera.bottom = y - (height * scale) / 2;
    camera.top = y + (height * scale) / 2;
    camera.updateProjectionMatrix();
  }

  function resize() {
    width = p.valley.clientWidth;
    height = p.valley.clientHeight;
    ratio = Math.min(devicePixelRatio, 2);
    renderer.setPixelRatio(ratio);
    renderer.setSize(width, height, false);
    restScale = 0;
    const turned = view;
    view = rest;
    placeCamera();
    fit();
    view = turned;
  }

  const resizes = new ResizeObserver(() => stage.wake());
  resizes.observe(p.valley);
  stage.defer(() => resizes.disconnect());

  function ease() {
    let moving = false;
    const next = { ...view };
    for (const key of ['yaw', 'pitch'] as const) {
      const delta = target[key] - view[key];
      if (Math.abs(delta) > 0.05 && !stage.reducedMotion) {
        next[key] += delta * 0.16;
        moving = true;
      } else next[key] = target[key];
    }
    view = next;
    return moving;
  }

  const projected = new Vector3();
  const project = (at: Vector3) => {
    projected.copy(at).project(camera);
    return [((projected.x + 1) / 2) * width, ((1 - projected.y) / 2) * height];
  };

  // For checks: the screen box that holds everything the fog leaves, in CSS pixels.
  function writeWindow(i: number, j: number, cubeAt: [number, number, number]) {
    const box = [Infinity, Infinity, -Infinity, -Infinity];
    const grow = (at: Vector3) => {
      const [x, y] = project(at);
      box[0] = Math.min(box[0], x);
      box[1] = Math.min(box[1], y);
      box[2] = Math.max(box[2], x);
      box[3] = Math.max(box[3], y);
    };
    const reach = (from: number) => [
      Math.max(0, (from - fogReach) * every),
      Math.min(fine, (from + fogReach + 1) * every),
    ];
    const [i0, i1] = reach(i);
    const [j0, j1] = reach(j);
    for (let b = j0; b <= j1; b++)
      for (let a = i0; a <= i1; a++) grow(new Vector3(...point(ruleAt(a, b))));
    for (const dx of [-0.5, 0.5])
      for (const dy of [0, 1])
        for (const dz of [-0.5, 0.5])
          grow(new Vector3(cubeAt[0] + dx, cubeAt[1] + dy, cubeAt[2] + dz));
    const [left, top, right, bottom] = box;
    p.view.dataset.window = [
      Math.floor(left) - 1,
      Math.floor(top) - 1,
      Math.ceil(right) + 1,
      Math.ceil(bottom) + 1,
    ].join(',');
  }

  function paint(tokens: Tokens) {
    const set = (color: Color, rgb: Rgb) => color.setRGB(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255);
    set(surfaceMaterial.uniforms.uColor.value, tokens.bg);
    set(wireMaterial.uniforms.uColor.value, mix(tokens.bg, tokens.ink, wireTone));
    set(cubeMaterial.uniforms.uInk.value, tokens.ink);
    set(cubeMaterial.uniforms.uBg.value, tokens.bg);
    set(trailMaterial.color, tokens.ink);
  }

  const raycaster = new Raycaster();
  const pointer = new Vector2();
  let drag: { x: number; y: number; from: View; moved: boolean; pointer: number } | null = null;
  const on = { signal: stage.signal };
  const turnTo = (next: View) => {
    target = clampView(next);
    stage.wake();
  };
  p.view.addEventListener(
    'pointerdown',
    (event) => {
      drag = {
        x: event.clientX,
        y: event.clientY,
        from: target,
        moved: false,
        pointer: event.pointerId,
      };
    },
    on,
  );
  p.view.addEventListener(
    'pointermove',
    (event) => {
      if (drag?.pointer !== event.pointerId || (event.pointerType === 'mouse' && !event.buttons))
        return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) > 4) {
        drag.moved = true;
        p.view.setPointerCapture(event.pointerId);
        p.view.dataset.dragging = '';
      }
      if (drag.moved) turnTo({ yaw: drag.from.yaw - dx * 0.35, pitch: drag.from.pitch + dy * 0.3 });
    },
    on,
  );
  const release = (event: PointerEvent) => {
    if (drag && !drag.moved && event.type === 'pointerup') {
      const rect = p.valley.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const [hit] = raycaster.intersectObject(surface, false);
      if (hit) {
        place({
          fee: Math.max(
            0,
            Math.min(fareBox.fee.max, (hit.point.x / cells + 0.5) * fareBox.fee.max),
          ),
          price: Math.max(
            0,
            Math.min(fareBox.price.max, (0.5 - hit.point.z / cells) * fareBox.price.max),
          ),
        });
      }
    }
    drag = null;
    delete p.view.dataset.dragging;
  };
  p.view.addEventListener('pointerup', release, on);
  p.view.addEventListener('pointercancel', release, on);
  stage.defer(() => delete p.view.dataset.dragging);
  p.view.addEventListener('dblclick', () => turnTo(rest), on);
  p.view.addEventListener(
    'keydown',
    (event) => {
      const turn = arrows[event.key];
      if (!turn) return;
      const next = clampView({ yaw: target.yaw + turn.yaw, pitch: target.pitch + turn.pitch });
      // At a limit the key keeps its default, so the page scrolls instead of nothing happening.
      if (next.yaw === target.yaw && next.pitch === target.pitch) return;
      event.preventDefault();
      turnTo(next);
    },
    on,
  );

  // A page can hold only a few WebGL contexts, so a valley out of sight for half a minute gives its
  // context back, and asks for it again when it returns.
  let idle = 0;
  stage.onLive((live) => {
    clearTimeout(idle);
    if (live && gl.isContextLost()) renderer.forceContextRestore();
    else if (!live) idle = window.setTimeout(() => renderer.forceContextLoss(), 30_000);
  });
  stage.defer(() => clearTimeout(idle));
  // three rebuilds its state when the context comes back, but only a draw repaints.
  p.valley.addEventListener('webglcontextrestored', () => stage.wake(), on);

  paint(stage.tokens);
  resize();
  placeCamera();
  fit();
  // compileAsync warns where the browser can't compile in parallel, so those compile in a task of
  // their own instead.
  if (renderer.extensions.has('KHR_parallel_shader_compile')) {
    await renderer.compileAsync(scene, camera);
  } else {
    await new Promise((resolve) => setTimeout(resolve));
    stage.signal.throwIfAborted();
    renderer.compile(scene, camera);
  }
  stage.signal.throwIfAborted();

  return {
    draw(at, trail, fog) {
      if (
        p.valley.clientWidth !== width ||
        p.valley.clientHeight !== height ||
        Math.min(devicePixelRatio, 2) !== ratio
      )
        resize();
      if (!width || !height) return false;
      const turning = ease();
      paint(stage.tokens);

      const cubeAt = point(at);
      cube.position.set(...cubeAt);
      const [i, j] = cellOf(at);
      fogUniforms.uWindow.value.set(
        i - fogReach - 1e-3,
        j - fogReach - 1e-3,
        i + fogReach + 1 + 1e-3,
        j + fogReach + 1 + 1e-3,
      );
      fogUniforms.uFog.value = fog ? 1 : 0;

      if (trailPoints.count < trail.length) {
        trailPoints = new BufferAttribute(new Float32Array(trail.length * 6), 3);
        trailGeometry.setAttribute('position', trailPoints);
      }
      trail.forEach((rule, k) => {
        const [x, y, z] = point(rule);
        trailPoints.setXYZ(k, x, y + 0.06, z);
      });
      trailPoints.needsUpdate = true;
      trailGeometry.setDrawRange(0, trail.length);

      placeCamera();
      fit();
      renderer.render(scene, camera);
      for (const label of labels) {
        const [x, y] = project(label.at);
        label.element.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px) translate(-50%, -50%)`;
      }
      if (fog) writeWindow(i, j, cubeAt);
      else delete p.view.dataset.window;
      return turning;
    },
  };
}

// ---------- the valley seen from above, for browsers without WebGL and for the still

type Label = {
  text: string;
  x: number;
  y: number;
  align: 'left' | 'center' | 'right';
  baseline: 'middle' | 'top';
};

export type ContourFigure = ReturnType<typeof contourFigure>;

export function contourFigure(width: number, height: number) {
  const pad = { l: 36, r: 6, t: 26, b: 26 };
  const plot = { x: pad.l, y: pad.t, width: width - pad.l - pad.r, height: height - pad.t - pad.b };
  const x = (fee: number) => plot.x + (fee / fareBox.fee.max) * plot.width;
  const y = (price: number) => plot.y + plot.height - (price / fareBox.price.max) * plot.height;
  const floor = y(0);
  const labels: Label[] = [
    { text: 'price per km', x: 0, y: 8, align: 'left', baseline: 'middle' },
    { text: '$0', x: pad.l - 8, y: y(0), align: 'right', baseline: 'middle' },
    {
      text: `$${fareBox.price.max}`,
      x: pad.l - 8,
      y: y(fareBox.price.max),
      align: 'right',
      baseline: 'middle',
    },
    { text: 'starting fee', x: x(0), y: floor + 8, align: 'left', baseline: 'top' },
    {
      text: `$${fareBox.fee.max / 2}`,
      x: x(fareBox.fee.max / 2),
      y: floor + 8,
      align: 'center',
      baseline: 'top',
    },
    {
      text: `$${fareBox.fee.max}`,
      x: x(fareBox.fee.max),
      y: floor + 8,
      align: 'right',
      baseline: 'top',
    },
  ];
  // Rings where the squeezed height is a tenth, two tenths, and so on, as the wireframe spaces them.
  const rings = Array.from({ length: 9 }, (_, k) => contour(lossAtLift((k + 1) / 10)));
  return {
    width,
    height,
    plot,
    x,
    y,
    axis: { x: plot.x, y: Math.round(floor), width: plot.width },
    labels,
    rings,
    /** Data units to pixels, for drawing the rings in fee and price. */
    scale: { x: plot.width / fareBox.fee.max, y: plot.height / fareBox.price.max },
    pick(px: number, py: number): FareRule | null {
      const fee = ((px - plot.x) / plot.width) * fareBox.fee.max;
      const price = ((plot.y + plot.height - py) / plot.height) * fareBox.price.max;
      if (fee < 0 || fee > fareBox.fee.max || price < 0 || price > fareBox.price.max) return null;
      return { fee, price };
    },
  };
}

function valley2d(stage: Stage, p: Parts, place: (at: FareRule) => void): ValleyMap {
  p.view.removeAttribute('tabindex');
  p.view.setAttribute('aria-label', 'The valley seen from above, as rings of equal loss');
  let figure: ContourFigure | null = null;
  p.view.addEventListener(
    'click',
    (event) => {
      const rect = p.valley.getBoundingClientRect();
      const at = figure?.pick(event.clientX - rect.left, event.clientY - rect.top);
      if (at) place(at);
    },
    { signal: stage.signal },
  );
  return {
    draw(at, trail, fog) {
      const ctx = stage.canvas(p.valley);
      figure = contourFigure(ctx.width, ctx.height);
      const { x, y, plot } = figure;
      const tokens = stage.tokens;
      ctx.fillStyle = css(tokens.bg);
      ctx.fillRect(0, 0, figure.width, figure.height);
      ctx.fillStyle = css(tokens.rule);
      ctx.fillRect(figure.axis.x, figure.axis.y, figure.axis.width, 1);
      ctx.font = stage.font(11);
      ctx.fillStyle = css(tokens.faint);
      for (const label of figure.labels) {
        ctx.textAlign = label.align;
        ctx.textBaseline = label.baseline;
        ctx.fillText(label.text, label.x, label.y);
      }

      ctx.save();
      ctx.beginPath();
      ctx.rect(plot.x, plot.y, plot.width, plot.height);
      ctx.clip();
      ctx.lineWidth = 1;
      if (fog) {
        const [i, j] = cellOf(at);
        const cellFee = fareBox.fee.max / cells;
        const cellPrice = fareBox.price.max / cells;
        const left = x((i - fogReach) * cellFee);
        const right = x((i + fogReach + 1) * cellFee);
        const top = y((j + fogReach + 1) * cellPrice);
        const bottom = y((j - fogReach) * cellPrice);
        ctx.beginPath();
        ctx.rect(left, top, right - left, bottom - top);
        ctx.clip();
        ctx.strokeStyle = css(tokens.rule);
        ctx.beginPath();
        for (let k = -fogReach; k <= fogReach + 1; k++) {
          const across = Math.round(x((i + k) * cellFee)) + 0.5;
          const up = Math.round(y((j + k) * cellPrice)) + 0.5;
          ctx.moveTo(across, top);
          ctx.lineTo(across, bottom);
          ctx.moveTo(left, up);
          ctx.lineTo(right, up);
        }
        ctx.stroke();
        p.view.dataset.window = [left, top, right, bottom].map(Math.round).join(',');
      } else delete p.view.dataset.window;
      ctx.strokeStyle = css(mix(tokens.bg, tokens.ink, wireTone));
      for (const ring of figure.rings) traceRing(ctx, figure, ring);

      ctx.strokeStyle = css(tokens.ink);
      ctx.beginPath();
      trail.forEach((rule, k) =>
        k ? ctx.lineTo(x(rule.fee), y(rule.price)) : ctx.moveTo(x(rule.fee), y(rule.price)),
      );
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = css(tokens.ink);
      ctx.fillRect(Math.round(x(at.fee)) - 4, Math.round(y(at.price)) - 4, 8, 8);
      return false;
    },
  };
}

function traceRing(
  ctx: CanvasRenderingContext2D,
  figure: ContourFigure,
  ring: ReturnType<typeof contour>,
) {
  ctx.save();
  ctx.translate(figure.x(valley.bottom.fee), figure.y(valley.bottom.price));
  ctx.scale(figure.scale.x, -figure.scale.y);
  ctx.beginPath();
  ctx.ellipse(0, 0, ring.across, ring.along, valley.angle, 0, Math.PI * 2);
  ctx.restore();
  ctx.stroke();
}

const anchors = { left: 'start', center: 'middle', right: 'end' } as const;
const baselines = { middle: 'central', top: 'text-before-edge' } as const;

export function Still() {
  const figure = contourFigure(471, 360);
  const { width, height, plot, axis, labels, rings, scale } = figure;
  const cube = { x: figure.x(start.fee), y: figure.y(start.price) };
  const degrees = (valley.angle * 180) / Math.PI;
  return (
    <svg
      className="demo-still"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMinYMin meet"
      aria-hidden="true"
    >
      <rect className="fill-rule" x={axis.x} y={axis.y} width={axis.width} height={1} />
      <g className="fill-faint" fontSize={11}>
        {labels.map((label) => (
          <text
            key={label.text}
            x={label.x}
            y={label.y}
            textAnchor={anchors[label.align]}
            dominantBaseline={baselines[label.baseline]}
          >
            {label.text}
          </text>
        ))}
      </g>
      <svg
        x={plot.x}
        y={plot.y}
        width={plot.width}
        height={plot.height}
        viewBox={`${plot.x} ${plot.y} ${plot.width} ${plot.height}`}
      >
        <g
          fill="none"
          style={{ stroke: `color-mix(in srgb, var(--ink) ${wireTone * 100}%, var(--bg))` }}
          transform={`translate(${figure.x(valley.bottom.fee)} ${figure.y(valley.bottom.price)}) scale(${scale.x} ${-scale.y}) rotate(${degrees})`}
        >
          {rings.map((ring) => (
            <ellipse
              key={ring.across}
              rx={ring.across}
              ry={ring.along}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
      </svg>
      <rect
        className="fill-ink"
        x={Math.round(cube.x) - 4}
        y={Math.round(cube.y) - 4}
        width={8}
        height={8}
      />
    </svg>
  );
}
