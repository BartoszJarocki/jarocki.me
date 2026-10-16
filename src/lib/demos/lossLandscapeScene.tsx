import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  ColorManagement,
  DoubleSide,
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
  onMap,
  rates,
  step,
  valley,
  walkFrom,
} from './lossLandscape';
import { type PartsOf, type Rgb, type Stage, type Tokens, css, defineScene } from './stage';
import {
  type FareRule,
  fareBox,
  fareRule,
  inCents,
  meanSquaredError,
  sameRule,
  start,
} from './taxiFares';
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
  draw(at: FareRule, trail: readonly FareRule[], fog: boolean): { turning: boolean };
  resetView?(): void;
};

const cells = 24;
const fogReach = 2;

const remarks: Record<Walk['status'], string | null> = {
  ready: null,
  down: null,
  up: 'That step went uphill',
  flat: 'The ground is flat here',
  off: 'The next step leaves the map',
};

type Range = { readonly min: number; readonly max: number };
const share = (value: number, { min, max }: Range) => (value - min) / (max - min);
const along = ({ min, max }: Range, t: number) => min + t * (max - min);
const clamp = (value: number, { min, max }: Range) => Math.max(min, Math.min(max, value));

const cellOf = ({ fee, price }: FareRule) =>
  [share(fee, fareBox.fee), share(price, fareBox.price)].map((t) =>
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
  async mount(stage, p) {
    let rate: Rate = 'good';
    let fog = false;
    let walking = false;
    let walk = walkFrom(fareRule.get());
    let trail = [walk.at];
    let glide = { from: walk.at, start: 0, ms: 0 };
    let shown = walk.at;

    const restart = (at: FareRule) => {
      walk = walkFrom(at);
      trail = [at];
      walking = false;
      glide = { from: at, start: 0, ms: 0 };
      shown = at;
    };
    const take = (next: Walk, now: number, ms: number) => {
      if (next.at !== walk.at) {
        glide = { from: shown, start: now, ms };
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

    function remark() {
      const grew = meanSquaredError(walk.at) > meanSquaredError(trail[0]);
      if (walk.status === 'off' && grew) return 'The loss grew, and the next step leaves the map';
      return remarks[walk.status] ?? `Step size ${rates[rate].toFixed(3)}`;
    }

    function show() {
      put(p.loss, meanSquaredError(fareRule.get()).toFixed(2));
      put(p.steps, walk.steps.toLocaleString('en-US'));
      put(p.unit, walk.steps === 1 ? 'step' : 'steps');
      put(p.status, remark());
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

    fareRule.subscribe(() => {
      if (!sameRule(fareRule.get(), inCents(walk.at))) restart(fareRule.get());
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
      else walking = !ended(walk);
    });
    click(p.fog, () => (fog = !fog));
    click(p.reset, () => {
      goTo(start);
      map.resetView?.();
    });
    for (const [name, button] of Object.entries(rateButtons)) {
      click(button, () => {
        rate = name as Rate;
        if (ended(walk)) goTo(trail[0]);
      });
    }

    return (now) => {
      if (walking && now - glide.start >= glide.ms) advance(now);
      const t = glide.ms ? Math.min(1, Math.max(0, (now - glide.start) / glide.ms)) : 1;
      const eased = t * (2 - t);
      const at = {
        fee: glide.from.fee + (walk.at.fee - glide.from.fee) * eased,
        price: glide.from.price + (walk.at.price - glide.from.price) * eased,
      };
      shown = at;
      p.view.dataset.cell = cellOf(at).join(',');
      const { turning } = map.draw(at, fog ? [] : trail, fog);
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

const fine = 48;
const tall = 10;
const deg = Math.PI / 180;
const nextTask = () => new Promise((resolve) => setTimeout(resolve));
const trailCap = 4096;
const idleReleaseMs = 30_000;
const restoreGraceMs = 5000;
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

const toX = (fee: number) => (share(fee, fareBox.fee) - 0.5) * cells;
const toZ = (price: number) => (0.5 - share(price, fareBox.price)) * cells;
const ruleAt = (i: number, j: number): FareRule => ({
  fee: along(fareBox.fee, i / fine),
  price: along(fareBox.price, j / fine),
});
const point = (rule: FareRule): [number, number, number] => [
  toX(rule.fee),
  tall * lift(rule),
  toZ(rule.price),
];

const dollars = (amount: number) => `${amount < 0 ? '-' : ''}$${Math.abs(amount)}`;
const front = fareBox.price.min;
const axes = [
  ...[fareBox.fee.min, fareBox.fee.max].map((fee) => ({
    text: dollars(fee),
    at: { fee, price: front },
    offEdge: { fee: 0, price: -1.1 },
  })),
  { text: 'Starting fee', at: { fee: 5, price: front }, offEdge: { fee: 0, price: -1.1 } },
  ...[fareBox.price.min, fareBox.price.max].map((price) => ({
    text: dollars(price),
    at: { fee: 0, price },
    offEdge: { fee: -1.1, price: 0 },
  })),
  { text: 'Price per km', at: { fee: 0, price: 1.5 }, offEdge: { fee: -2.6, price: 0 } },
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

  await nextTask();
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
  const vertex = (i: number, j: number) => j * (fine + 1) + i;

  const positions = new Float32Array((fine + 1) ** 2 * 3);
  const gridCells = new Float32Array((fine + 1) ** 2 * 2);
  for (let j = 0; j <= fine; j++)
    for (let i = 0; i <= fine; i++) {
      positions.set(point(ruleAt(i, j)), vertex(i, j) * 3);
      gridCells.set(cellAt(i, j), vertex(i, j) * 2);
    }
  const faces: number[] = [];
  for (let j = 0; j < fine; j++)
    for (let i = 0; i < fine; i++) {
      const a = vertex(i, j);
      faces.push(a, a + 1, a + fine + 1, a + 1, a + fine + 2, a + fine + 1);
    }
  const occluderGeometry = owned(new BufferGeometry());
  occluderGeometry.setAttribute('position', new BufferAttribute(positions, 3));
  occluderGeometry.setAttribute('cell', new BufferAttribute(gridCells, 2));
  occluderGeometry.setIndex(faces);
  const occluderMaterial = fogged({
    side: DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  const occluder = new Mesh(occluderGeometry, occluderMaterial);

  const ends: number[] = [];
  const every = fine / cells;
  for (let j = 0; j <= fine; j += every)
    for (let i = 0; i < fine; i++) ends.push(vertex(i, j), vertex(i + 1, j));
  for (let i = 0; i <= fine; i += every)
    for (let j = 0; j < fine; j++) ends.push(vertex(i, j), vertex(i, j + 1));
  const wireGeometry = owned(new BufferGeometry());
  wireGeometry.setAttribute('position', occluderGeometry.getAttribute('position'));
  wireGeometry.setAttribute('cell', occluderGeometry.getAttribute('cell'));
  wireGeometry.setIndex(ends);
  const wireMaterial = fogged();
  const wire = new LineSegments(wireGeometry, wireMaterial);
  scene.add(occluder, wire);

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

  const trailPoints = new BufferAttribute(new Float32Array(trailCap * 3), 3);
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
  const labels = axes.map(({ text, at, offEdge }) => {
    const element = document.createElement('span');
    element.className =
      'absolute left-0 top-0 whitespace-nowrap bg-bg px-[1ch] text-[11px] leading-4 text-faint';
    element.textContent = text;
    overlay.append(element);
    const [, y] = point(at);
    return {
      element,
      at: new Vector3(toX(at.fee + offEdge.fee), y, toZ(at.price + offEdge.price)),
    };
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

  function exposeFogWindow(i: number, j: number, cubeAt: [number, number, number]) {
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
    set(occluderMaterial.uniforms.uColor.value, tokens.bg);
    set(wireMaterial.uniforms.uColor.value, mix(tokens.bg, tokens.ink, wireTone));
    set(cubeMaterial.uniforms.uInk.value, tokens.ink);
    set(cubeMaterial.uniforms.uBg.value, tokens.bg);
    set(trailMaterial.color, tokens.ink);
  }

  const raycaster = new Raycaster();
  const pointer = new Vector2();
  let drag: { x: number; y: number; from: View; moved: boolean; pointer: number } | null = null;
  const on = { signal: stage.signal };
  const stillLabel = p.view.getAttribute('aria-label') ?? '';
  p.view.tabIndex = 0;
  p.view.setAttribute('aria-label', 'The valley. The arrow keys turn it.');
  p.view.dataset.turn = '';
  stage.defer(() => {
    p.view.removeAttribute('tabindex');
    p.view.setAttribute('aria-label', stillLabel);
    delete p.view.dataset.turn;
  });
  const turnTo = (next: View) => {
    target = clampView(next);
    stage.wake();
  };
  p.view.addEventListener(
    'pointerdown',
    (event) => {
      if (event.button !== 0) return;
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
      const [hit] = raycaster.intersectObject(occluder, false);
      if (hit) {
        place({
          fee: clamp(along(fareBox.fee, hit.point.x / cells + 0.5), fareBox.fee),
          price: clamp(along(fareBox.price, 0.5 - hit.point.z / cells), fareBox.price),
        });
      }
    }
    drag = null;
    delete p.view.dataset.dragging;
  };
  p.view.addEventListener('pointerup', release, on);
  p.view.addEventListener('pointercancel', release, on);
  p.view.addEventListener(
    'keydown',
    (event) => {
      const turn = arrows[event.key];
      if (!turn) return;
      const next = clampView({ yaw: target.yaw + turn.yaw, pitch: target.pitch + turn.pitch });
      const atLimit = next.yaw === target.yaw && next.pitch === target.pitch;
      if (atLimit) return;
      event.preventDefault();
      turnTo(next);
    },
    on,
  );

  // A page can hold only a few WebGL contexts.
  let idle = 0;
  let restoreDeadline = 0;
  const failUnlessRestored = () => {
    clearTimeout(restoreDeadline);
    restoreDeadline = window.setTimeout(
      () => stage.fail(new Error('The valley lost its WebGL context')),
      restoreGraceMs,
    );
  };
  stage.onLive((live) => {
    clearTimeout(idle);
    clearTimeout(restoreDeadline);
    if (live && gl.isContextLost()) {
      renderer.forceContextRestore();
      failUnlessRestored();
    } else if (!live) idle = window.setTimeout(() => renderer.forceContextLoss(), idleReleaseMs);
  });
  stage.defer(() => {
    clearTimeout(idle);
    clearTimeout(restoreDeadline);
  });
  p.valley.addEventListener('webglcontextlost', () => stage.live && failUnlessRestored(), on);
  p.valley.addEventListener(
    'webglcontextrestored',
    () => {
      clearTimeout(restoreDeadline);
      stage.wake();
    },
    on,
  );

  await nextTask();
  stage.signal.throwIfAborted();
  paint(stage.tokens);
  resize();
  placeCamera();
  fit();
  await nextTask();
  stage.signal.throwIfAborted();
  // compileAsync warns where the browser can't compile in parallel.
  if (renderer.extensions.has('KHR_parallel_shader_compile')) {
    await renderer.compileAsync(scene, camera);
    stage.signal.throwIfAborted();
  } else renderer.compile(scene, camera);
  // The first draw of each object reads its program's uniforms and logs and uploads its buffers.
  renderer.setScissor(0, 0, 1, 1);
  for (const object of [occluder, wire, cube, trailLine]) {
    await nextTask();
    stage.signal.throwIfAborted();
    renderer.setScissorTest(true);
    renderer.render(object, camera);
    renderer.setScissorTest(false);
  }

  return {
    draw(at, trail, fog) {
      if (
        p.valley.clientWidth !== width ||
        p.valley.clientHeight !== height ||
        Math.min(devicePixelRatio, 2) !== ratio
      )
        resize();
      if (!width || !height) return { turning: false };
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

      const recent = trail.slice(-trailCap);
      recent.forEach((rule, k) => {
        const [x, y, z] = point(rule);
        trailPoints.setXYZ(k, x, y + 0.06, z);
      });
      trailPoints.needsUpdate = true;
      trailGeometry.setDrawRange(0, recent.length);

      placeCamera();
      fit();
      renderer.render(scene, camera);
      for (const label of labels) {
        const [x, y] = project(label.at);
        label.element.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px) translate(-50%, -50%)`;
      }
      if (fog) exposeFogWindow(i, j, cubeAt);
      else delete p.view.dataset.window;
      return { turning };
    },
    resetView: () => turnTo(rest),
  };
}

const ringLifts = Array.from({ length: 9 }, (_, k) => (k + 1) / 10);

type Label = {
  text: string;
  x: number;
  y: number;
  align: 'left' | 'center' | 'right';
  baseline: 'middle' | 'top';
};

type ContourFigure = ReturnType<typeof contourFigure>;

function contourFigure(width: number, height: number) {
  const pad = { l: 36, r: 6, t: 26, b: 26 };
  const plot = { x: pad.l, y: pad.t, width: width - pad.l - pad.r, height: height - pad.t - pad.b };
  const x = (fee: number) => plot.x + share(fee, fareBox.fee) * plot.width;
  const y = (price: number) => plot.y + plot.height - share(price, fareBox.price) * plot.height;
  const floor = plot.y + plot.height;
  const labels: Label[] = [
    { text: 'price per km', x: 0, y: 8, align: 'left', baseline: 'middle' },
    ...[fareBox.price.min, 0, fareBox.price.max].map(
      (price): Label => ({
        text: dollars(price),
        x: pad.l - 8,
        y: y(price),
        align: 'right',
        baseline: 'middle',
      }),
    ),
    { text: 'starting fee', x: x(0), y: floor + 8, align: 'left', baseline: 'top' },
    { text: dollars(5), x: x(5), y: floor + 8, align: 'center', baseline: 'top' },
    {
      text: dollars(fareBox.fee.max),
      x: x(fareBox.fee.max),
      y: floor + 8,
      align: 'right',
      baseline: 'top',
    },
  ];
  const rings = ringLifts.map((t) => contour(lossAtLift(t)));
  return {
    width,
    height,
    plot,
    x,
    y,
    axis: { x: plot.x, y: Math.round(floor), width: plot.width },
    labels,
    rings,
    pixelsPerUnit: {
      x: plot.width / (fareBox.fee.max - fareBox.fee.min),
      y: plot.height / (fareBox.price.max - fareBox.price.min),
    },
    pick(px: number, py: number): FareRule | null {
      const at = {
        fee: along(fareBox.fee, (px - plot.x) / plot.width),
        price: along(fareBox.price, (floor - py) / plot.height),
      };
      return onMap(at) ? at : null;
    },
  };
}

function valley2d(stage: Stage, p: Parts, place: (at: FareRule) => void): ValleyMap {
  p.view.dataset.pick = '';
  stage.defer(() => delete p.view.dataset.pick);
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
        const feeAt = (k: number) => x(along(fareBox.fee, k / cells));
        const priceAt = (k: number) => y(along(fareBox.price, k / cells));
        const left = feeAt(i - fogReach);
        const right = feeAt(i + fogReach + 1);
        const top = priceAt(j + fogReach + 1);
        const bottom = priceAt(j - fogReach);
        ctx.beginPath();
        ctx.rect(left, top, right - left, bottom - top);
        ctx.clip();
        ctx.strokeStyle = css(tokens.rule);
        ctx.beginPath();
        for (let k = -fogReach; k <= fogReach + 1; k++) {
          const across = Math.round(feeAt(i + k)) + 0.5;
          const up = Math.round(priceAt(j + k)) + 0.5;
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
      return { turning: false };
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
  ctx.scale(figure.pixelsPerUnit.x, -figure.pixelsPerUnit.y);
  ctx.beginPath();
  ctx.ellipse(0, 0, ring.across, ring.along, valley.angle, 0, Math.PI * 2);
  ctx.restore();
  ctx.stroke();
}

const anchors = { left: 'start', center: 'middle', right: 'end' } as const;
const baselines = { middle: 'central', top: 'text-before-edge' } as const;

export function Still() {
  return (
    <>
      <ContourSvg figure={contourFigure(471, 360)} className="max-[640px]:hidden" />
      <ContourSvg figure={contourFigure(320, 230)} className="hidden max-[640px]:block" />
    </>
  );
}

function ContourSvg({ figure, className }: { figure: ContourFigure; className: string }) {
  const { width, height, plot, axis, labels, rings, pixelsPerUnit } = figure;
  const cube = { x: figure.x(start.fee), y: figure.y(start.price) };
  const degrees = (valley.angle * 180) / Math.PI;
  return (
    <svg
      className={`demo-still ${className}`}
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
          transform={`translate(${figure.x(valley.bottom.fee)} ${figure.y(valley.bottom.price)}) scale(${pixelsPerUnit.x} ${-pixelsPerUnit.y}) rotate(${degrees})`}
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
