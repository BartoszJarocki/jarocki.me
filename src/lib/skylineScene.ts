import {
  Box3,
  BoxGeometry,
  Color,
  ColorManagement,
  InstancedBufferAttribute,
  InstancedMesh,
  LinearSRGBColorSpace,
  Matrix4,
  OrthographicCamera,
  Raycaster,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';

import { LEVELS } from './activityStats';
import { tokenReader } from './colorTokens';
import { Teardown, teardown } from './teardown';

type View = { yaw: number; pitch: number };

export type SkylineHandle = {
  setHeights: (heights: number[]) => void;
  destroy: () => void;
};

const UNIT = 10 / 12;
const FRONT_Z = 3 + UNIT / 2;
const LABEL_Z = 4.6;
// Least px from the front edge to a month label's center. It stays under the 7.9px of the desktop
// rest view, so only smaller stages move their labels.
const LABEL_DROP = 7.5;
const REST: View = { yaw: -16, pitch: 34 };
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const ARROWS: Record<string, View> = {
  ArrowLeft: { yaw: 8, pitch: 0 },
  ArrowRight: { yaw: -8, pitch: 0 },
  ArrowUp: { yaw: 0, pitch: -6 },
  ArrowDown: { yaw: 0, pitch: 6 },
};
const deg = Math.PI / 180;

const clampView = ({ yaw, pitch }: View): View => ({
  yaw: Math.max(-60, Math.min(60, yaw)),
  pitch: Math.max(8, Math.min(89, pitch)),
});

const vertexShader = `
  attribute float aHi;
  varying vec3 vN;
  varying float vHi;
  void main() {
    vN = normalize(mat3(instanceMatrix) * normal);
    vHi = aHi;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);
  }`;

// A fixed tone per face instead of lights keeps every pixel a mix of two color tokens.
const fragmentShader = `
  uniform vec3 uInk;
  uniform vec3 uBg;
  uniform float uHover;
  varying vec3 vN;
  varying float vHi;
  void main() {
    vec3 n = normalize(vN);
    float tone = n.z > 0.5 ? 1.0 : n.y > 0.5 ? 0.66 : n.y < -0.5 ? 0.3 : 0.44;
    vec3 c = mix(uBg, uInk, tone);
    if (uHover > 0.5 && vHi < 0.5) c = mix(uBg, c, 0.3);
    gl_FragColor = vec4(c, 1.0);
  }`;

function voxels(cleanup: Teardown, count: number, height: number) {
  const geometry = new BoxGeometry(UNIT, height, UNIT);
  cleanup.add(() => geometry.dispose());
  const lit = new InstancedBufferAttribute(new Float32Array(count), 1);
  geometry.setAttribute('aHi', lit);
  const material = new ShaderMaterial({
    uniforms: { uInk: { value: new Color() }, uBg: { value: new Color() }, uHover: { value: 0 } },
    vertexShader,
    fragmentShader,
  });
  cleanup.add(() => material.dispose());
  const mesh = new InstancedMesh(geometry, material, count);
  cleanup.add(() => mesh.dispose());
  mesh.count = 0;
  mesh.frustumCulled = false;
  return { mesh, lit, columnOf: new Int32Array(count) };
}

type Voxels = ReturnType<typeof voxels>;

export async function mountSkyline(
  stage: HTMLElement,
  dates: string[],
  heights: () => number[],
  onHover: (day: number | null) => void,
  cancel: AbortSignal,
): Promise<SkylineHandle | null> {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    return null;
  }
  const cleanup = teardown();
  cleanup.add(() => renderer.domElement.remove());
  cleanup.add(() => renderer.forceContextLoss());
  cleanup.add(() => renderer.dispose());
  try {
    return await mountScene(stage, dates, heights, onHover, cancel, renderer, cleanup);
  } catch (error) {
    try {
      cleanup.run();
    } catch (cleanupError) {
      console.error(cleanupError);
    }
    throw error;
  }
}

async function mountScene(
  stage: HTMLElement,
  dates: string[],
  heights: () => number[],
  onHover: (day: number | null) => void,
  cancel: AbortSignal,
  renderer: WebGLRenderer,
  cleanup: Teardown,
): Promise<SkylineHandle> {
  // Creating the renderer takes about as long as building and drawing the scene on a slow CPU, so
  // the two run in separate tasks. Input that arrives in between runs first, so heights() is read
  // after the wait.
  await new Promise((resolve) => setTimeout(resolve));
  if (cancel.aborted) throw cancel.reason;
  // Without color management the shader's mix of the token colors reaches the screen unchanged.
  ColorManagement.enabled = false;
  renderer.outputColorSpace = LinearSRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const overlay = document.createElement('div');
  cleanup.add(() => overlay.remove());
  overlay.className = 'skyline-overlay';
  stage.append(renderer.domElement, overlay);

  let week = -1;
  const days = dates.map((date, i) => {
    const day = new Date(`${date}T00:00:00Z`);
    if (i === 0 || day.getUTCDay() === 0) week += 1;
    return { date: day, week, weekday: day.getUTCDay() };
  });
  const weeks = week + 1;
  const middle = (weeks - 1) / 2;
  const columns = days.map((day) => ({
    x: day.week - middle,
    z: day.weekday - 3,
    delay: day.week * 9 + day.weekday * 4,
  }));
  const months = days
    .filter((day) => day.date.getUTCDate() === 1)
    .map((day) => {
      const label = document.createElement('span');
      label.className = 'skyline-month';
      label.textContent = MONTHS[day.date.getUTCMonth()];
      overlay.append(label);
      return { label, x: day.week - middle };
    });

  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, -500, 500);
  const solids = voxels(cleanup, dates.length * LEVELS, UNIT);
  const flats = voxels(cleanup, dates.length, 0.16);
  scene.add(solids.mesh, flats.mesh);
  const center = new Vector3(0, 3, 0);
  const bounds = new Box3(
    new Vector3(-weeks / 2, 0, -3.5),
    new Vector3(weeks / 2, LEVELS, LABEL_Z),
  );
  const raycaster = new Raycaster();
  const pointer = new Vector2();
  const corner = new Vector3();
  const projected = new Vector3();
  const matrix = new Matrix4();
  const token = tokenReader();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const darkScheme = matchMedia('(prefers-color-scheme: dark)');

  const view = { ...REST };
  let target = { ...REST };
  let restScale = 0;
  let labelLift = 0;
  let width = 0;
  let height = 0;
  let shown = dates.map(() => 0);
  let from = shown;
  let goal = shown;
  let morphStart = 0;
  let hovered: number | null = null;
  let drag: { x: number; y: number; from: View; moved: boolean; pointer: number } | null = null;
  let raf = 0;
  cleanup.add(() => cancelAnimationFrame(raf));

  function paint() {
    const bg = token('--bg');
    solids.mesh.material.uniforms.uInk.value = token('--ink');
    solids.mesh.material.uniforms.uBg.value = bg;
    flats.mesh.material.uniforms.uInk.value = token('--rule');
    flats.mesh.material.uniforms.uBg.value = bg;
  }

  function highlight({ mesh, lit, columnOf }: Voxels) {
    for (let i = 0; i < mesh.count; i++) lit.array[i] = columnOf[i] === hovered ? 1 : 0;
    lit.needsUpdate = true;
    mesh.material.uniforms.uHover.value = hovered === null ? 0 : 1;
  }

  function place({ mesh, columnOf }: Voxels, n: number, column: number, y: number) {
    const { x, z } = columns[column];
    mesh.setMatrixAt(n, matrix.makeTranslation(x, y, z));
    columnOf[n] = column;
  }

  function commit(set: Voxels, count: number) {
    set.mesh.count = count;
    set.mesh.instanceMatrix.needsUpdate = true;
    set.mesh.boundingSphere = null;
    highlight(set);
  }

  function rebuild() {
    let solid = 0;
    let flat = 0;
    shown.forEach((h, column) => {
      for (let k = 0; k < h; k++) place(solids, solid++, column, k + UNIT / 2);
      if (!h) place(flats, flat++, column, 0.08);
    });
    commit(solids, solid);
    commit(flats, flat);
  }

  function placeCamera() {
    const { yaw, pitch } = view;
    camera.position.set(
      center.x + Math.sin(yaw * deg) * Math.cos(pitch * deg) * 100,
      center.y + Math.sin(pitch * deg) * 100,
      center.z + Math.cos(yaw * deg) * Math.cos(pitch * deg) * 100,
    );
    camera.lookAt(center);
    camera.updateMatrixWorld();
  }

  // Bottom-aligned with room for half a month label under the label row, and never zoomed in past
  // the rest view's scale, so turning the city only shrinks it. A small stage draws the label row too
  // close to the front edge, so the labels drop by labelLift and the room below grows to match.
  function fit() {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const x of [bounds.min.x, bounds.max.x])
      for (const y of [bounds.min.y, bounds.max.y])
        for (const z of [bounds.min.z, bounds.max.z]) {
          corner.set(x, y, z).applyMatrix4(camera.matrixWorldInverse);
          minX = Math.min(minX, corner.x);
          maxX = Math.max(maxX, corner.x);
          minY = Math.min(minY, corner.y);
          maxY = Math.max(maxY, corner.y);
        }
    const rowDrop =
      corner.set(0, 0, FRONT_Z).applyMatrix4(camera.matrixWorldInverse).y -
      corner.set(0, 0, LABEL_Z).applyMatrix4(camera.matrixWorldInverse).y;
    const pad = 4;
    const below = pad + 6;
    const need = Math.max(
      (maxX - minX) / (width - 2 * pad),
      (maxY - minY) / (height - pad - below),
      (maxY - minY - rowDrop) / (height - pad - below - LABEL_DROP),
    );
    if (!restScale) restScale = need;
    const scale = Math.max(need, restScale);
    labelLift = Math.max(0, LABEL_DROP - rowDrop / scale);
    camera.left = minX - (width * scale - (maxX - minX)) / 2;
    camera.right = camera.left + width * scale;
    camera.bottom = minY - (below + labelLift) * scale;
    camera.top = camera.bottom + height * scale;
    camera.updateProjectionMatrix();
  }

  function placeMonths() {
    months.forEach(({ label, x }, i) => {
      label.hidden = width < 520 && i % 2 === 1;
      projected.set(x, 0, LABEL_Z).project(camera);
      const left = (projected.x * 0.5 + 0.5) * width;
      const top = (-projected.y * 0.5 + 0.5) * height + labelLift;
      label.style.transform = `translate(${left}px, ${top}px) translate(-50%, -50%)`;
    });
  }

  function draw() {
    placeCamera();
    fit();
    placeMonths();
    renderer.render(scene, camera);
  }

  function ease() {
    let moving = false;
    for (const key of ['yaw', 'pitch'] as const) {
      const delta = target[key] - view[key];
      if (Math.abs(delta) > 0.05 && !reducedMotion.matches) {
        view[key] += delta * 0.14;
        moving = true;
      } else view[key] = target[key];
    }
    return moving;
  }

  function tick(now: number) {
    const elapsed = reducedMotion.matches ? Infinity : now - morphStart;
    let changed = false;
    let moving = false;
    for (let i = 0; i < shown.length; i++) {
      if (shown[i] === goal[i]) continue;
      const steps = Math.floor(Math.max(0, elapsed - columns[i].delay) / 28);
      const distance = goal[i] - from[i];
      const next = from[i] + Math.sign(distance) * Math.min(Math.abs(distance), steps);
      if (next !== shown[i]) {
        shown[i] = next;
        changed = true;
      }
      if (shown[i] !== goal[i]) moving = true;
    }
    if (changed) rebuild();
    return moving;
  }

  function frame(now: number) {
    raf = 0;
    const turning = ease();
    const morphing = tick(now);
    draw();
    if (turning || morphing) loop();
  }

  function loop() {
    if (!raf) raf = requestAnimationFrame(frame);
  }

  function resize() {
    width = stage.clientWidth;
    height = stage.clientHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(width, height, false);
    restScale = 0;
    const turned = { ...view };
    Object.assign(view, REST);
    placeCamera();
    fit();
    Object.assign(view, turned);
    draw();
  }

  function setHeights(next: number[]) {
    from = shown.slice();
    goal = next;
    morphStart = performance.now();
    if (reducedMotion.matches) shown = next.slice();
    rebuild();
    loop();
  }

  function pick(event: PointerEvent) {
    const rect = stage.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    const [hit] = raycaster.intersectObjects([solids.mesh, flats.mesh], false);
    if (hit?.instanceId === undefined) return null;
    return (hit.object === solids.mesh ? solids : flats).columnOf[hit.instanceId];
  }

  function hover(day: number | null) {
    if (day === hovered) return;
    hovered = day;
    highlight(solids);
    highlight(flats);
    onHover(day);
    loop();
  }

  function turnTo(next: View) {
    target = clampView(next);
    loop();
  }

  function release(event: PointerEvent) {
    if (!drag) return;
    if (!drag.moved && event.type === 'pointerup' && event.pointerType !== 'mouse') {
      hover(pick(event));
    }
    delete stage.dataset.dragging;
    drag = null;
  }

  const listeners = new AbortController();
  cleanup.add(() => delete stage.dataset.dragging);
  cleanup.add(() => listeners.abort());
  const { signal } = listeners;
  stage.addEventListener(
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
    { signal },
  );
  stage.addEventListener(
    'pointermove',
    (event) => {
      if (drag?.pointer === event.pointerId && (event.buttons || event.pointerType !== 'mouse')) {
        const dx = event.clientX - drag.x;
        const dy = event.clientY - drag.y;
        if (!drag.moved && Math.hypot(dx, dy) > 4) {
          drag.moved = true;
          stage.setPointerCapture(event.pointerId);
          stage.dataset.dragging = '';
        }
        if (drag.moved)
          turnTo({ yaw: drag.from.yaw - dx * 0.35, pitch: drag.from.pitch + dy * 0.3 });
      }
      if (event.pointerType === 'mouse') hover(pick(event));
    },
    { signal },
  );
  stage.addEventListener('pointerup', release, { signal });
  stage.addEventListener('pointercancel', release, { signal });
  stage.addEventListener(
    'pointerleave',
    (event) => {
      if (!drag && event.pointerType === 'mouse') hover(null);
    },
    { signal },
  );
  stage.addEventListener('dblclick', () => turnTo(REST), { signal });
  stage.addEventListener(
    'keydown',
    (event) => {
      const step = ARROWS[event.key];
      if (!step) return;
      const next = clampView({ yaw: target.yaw + step.yaw, pitch: target.pitch + step.pitch });
      // At a limit the key keeps its default, so the page scrolls instead of nothing happening.
      if (next.yaw === target.yaw && next.pitch === target.pitch) return;
      event.preventDefault();
      turnTo(next);
    },
    { signal },
  );
  darkScheme.addEventListener(
    'change',
    () => {
      paint();
      draw();
    },
    { signal },
  );
  // three cancels webglcontextlost and rebuilds its state on restore, but only a draw repaints.
  renderer.domElement.addEventListener('webglcontextrestored', draw, { signal });
  const resizeObserver = new ResizeObserver(resize);
  cleanup.add(() => resizeObserver.disconnect());
  resizeObserver.observe(stage);

  paint();
  setHeights(heights());
  resize();

  return { setHeights, destroy: cleanup.run };
}
