import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DataTexture,
  Group,
  LineBasicMaterial,
  LineSegments,
  LinearFilter,
  LinearSRGBColorSpace,
  Matrix4,
  Mesh,
  OrthographicCamera,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Texture,
  Vector3,
  WebGLRenderer,
} from 'three';

import { tokenReader } from './colorTokens';
import {
  ANALOGIES,
  CORPUS,
  D,
  Neighbor,
  analogy,
  buildSpace,
  cosine,
  row,
  seeded,
  tokenize,
  topK,
} from './embeddingSpace';

export type BackdropHandle = { destroy: () => void };

type UV = [number, number, number, number];
type Sprite = { uv: UV; w: number };
type Atlas = { texture: CanvasTexture; h: number; sprites: Map<string, Sprite> };
type Batch = {
  mat: ShaderMaterial;
  quad: (x: number, y: number, w: number, h: number, uv: UV, m: number) => void;
  flush: () => void;
};
type TextSet = {
  w: (s: string) => number;
  draw: (s: string, x: number, y: number, m: number) => void;
};
type ScreenPoint = { x: number; y: number };
type Placed = { x: number; y: number; w: number; h?: number };

const K = 8;
// Seconds per token, the glide between tokens, and a phase offset that leaves t = 6 settled on
// ' software'.
const STEP = 3.4;
const GLIDE = 1.5;
const PHASE = 3.6;
const START = 7;
const TRAIL = 5;
const SWING = 96;
const YAW = 0.32;
const PITCH = 0.2;
const FOV = 30;
// A linear map from the three drawn embedding axes to world units, so sums and differences stay
// exact on screen.
const SCALE = [18, 15, 18];
const HALF_W = 11.6;
const HALF_H = 6;
const DEPTH = 6;
const AN_PERIOD = 20;
const AN_OFFSET = 2;
const REST_T = 6;
// The motion is slow, so 30 frames a second look the same as 60 and cost half.
const FPS = 30;
const POINTER_MS = 3000;
// The loops of the mount yield once a slice has run this long, so on a slow phone none of its tasks
// comes near the 50ms of a long task.
const SLICE_MS = 16;

const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const smooth = (a: number, b: number, x: number) => {
  const u = clamp((x - a) / (b - a), 0, 1);
  return u * u * (3 - 2 * u);
};
const show = (tok: string) => (tok.startsWith(' ') ? '·' + tok.slice(1) : tok);
const fmt = (s: number) => s.toFixed(2);
const nextTask = () => new Promise((resolve) => setTimeout(resolve));

function atlas(
  strings: Iterable<string>,
  size: number,
  weight: number,
  family: string,
  pr: number,
): Atlas {
  const px = Math.round(size * pr);
  const font = `${weight} ${px}px ${family}`;
  const c = document.createElement('canvas');
  const g = c.getContext('2d')!;
  g.font = font;
  const pad = Math.ceil(px * 0.15);
  const lineH = Math.ceil(px * 1.3);
  const rects = [...new Set(strings)].map((s) => {
    const w = Math.ceil(g.measureText(s).width) + pad * 2;
    return { s, w, x: 0, y: 0 };
  });
  const area = rects.reduce((sum, r) => sum + r.w * lineH, 0);
  const width = Math.max(...rects.map((r) => r.w), Math.ceil(Math.sqrt(area)));
  let x = 0;
  let y = 0;
  for (const r of rects) {
    if (x + r.w > width) {
      x = 0;
      y += lineH;
    }
    r.x = x;
    r.y = y;
    x += r.w;
  }
  c.width = width;
  c.height = y + lineH;
  g.font = font;
  g.fillStyle = '#fff';
  g.textBaseline = 'middle';
  const sprites = new Map<string, Sprite>();
  for (const r of rects) {
    g.fillText(r.s, r.x + pad, r.y + lineH / 2);
    const uv: UV = [
      r.x / c.width,
      1 - (r.y + lineH) / c.height,
      (r.x + r.w) / c.width,
      1 - r.y / c.height,
    ];
    sprites.set(r.s, { uv, w: r.w / pr });
  }
  const texture = new CanvasTexture(c);
  texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;
  return { texture, h: lineH / pr, sprites };
}

export async function mountEmbeddings(
  stage: HTMLElement,
  cancel: AbortSignal,
): Promise<BackdropHandle | null> {
  // Evaluating three, creating the WebGL context, building the space, and compiling the shaders
  // would each be a long task on a slow CPU, so the mount runs in short tasks and input runs in
  // between.
  await nextTask();
  if (cancel.aborted) throw cancel.reason;
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    return null;
  }
  const owned: { dispose: () => void }[] = [];
  const own = <T extends { dispose: () => void }>(resource: T) => {
    owned.push(resource);
    return resource;
  };
  const release = () => {
    for (const resource of owned) resource.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  };
  let sliceStart = 0;
  const nextSlice = async () => {
    await nextTask();
    sliceStart = performance.now();
    if (cancel.aborted) {
      release();
      throw cancel.reason;
    }
  };
  const yieldIfSpent = async () => {
    if (performance.now() - sliceStart >= SLICE_MS) await nextSlice();
  };

  renderer.outputColorSpace = LinearSRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const pr = renderer.getPixelRatio();
  await nextSlice();
  const family = getComputedStyle(stage).fontFamily;
  await Promise.all([
    document.fonts.load(`11px ${family}`),
    document.fonts.load(`500 13px ${family}`),
  ]);
  await nextSlice();

  const token = tokenReader();
  const bg = new Color();
  const ink = new Color();
  const paint = () => {
    bg.copy(token('--bg'));
    ink.copy(token('--ink'));
  };
  paint();

  const words = tokenize(CORPUS);
  const build = buildSpace(seeded(11), words);
  let step = build.next();
  for (; !step.done; step = build.next()) await yieldIfSpent();
  const space = step.value;
  const { N, tokens, vec } = space;
  const capitalized = tokens.map((t) => t !== t.toLowerCase());

  const P = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) for (let d = 0; d < 3; d++) P[i * 3 + d] = vec[i * D + d] * SCALE[d];
  const at = (i: number, out = new Vector3()) => out.set(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]);

  const seq = words.map((w) => space.index.get(w)!);
  const nnMemo = new Map<number, Neighbor[]>();
  const neighbors = (i: number) => {
    let list = nnMemo.get(i);
    if (!list) {
      list = topK(cosine(space, row(space, i)), K, (j) => j === i || capitalized[j]);
      nnMemo.set(i, list);
    }
    return list;
  };
  for (const i of new Set(seq)) {
    neighbors(i);
    await yieldIfSpent();
  }
  const analogies = ANALOGIES.map((a) => {
    const r = analogy(space, a);
    const qPos = new Vector3(r.q[0] * SCALE[0], r.q[1] * SCALE[1], r.q[2] * SCALE[2]);
    const caption = `${a[0].trim()} - ${a[1].trim()} + ${a[2].trim()} → ${tokens[r.answer].trim()}`;
    return { ...r, qPos, caption };
  });

  const labelStrings: string[] = [];
  for (const i of new Set(seq)) {
    labelStrings.push(show(tokens[i]));
    for (const n of neighbors(i)) labelStrings.push(show(tokens[n.i]));
  }
  for (const a of analogies) {
    for (const i of [a.ia, a.ib, a.ic, a.answer]) labelStrings.push(show(tokens[i]));
    labelStrings.push(a.caption, fmt(a.cos));
  }
  for (let c = 0; c <= 100; c++) labelStrings.push(fmt(c / 100));
  labelStrings.push('cos');
  await nextSlice();
  const labelAtlas = atlas(labelStrings, 11, 400, family, pr);
  own(labelAtlas.texture);
  await nextSlice();
  const headAtlas = atlas(
    seq.map((i) => show(tokens[i])),
    13,
    500,
    family,
    pr,
  );
  own(headAtlas.texture);
  await nextSlice();

  const scene = new Scene();
  // Every 3D object lives in one group, so a stage-shaped squash of y stays one linear map for
  // points, lines and labels.
  const world = new Group();
  scene.add(world);
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 200);
  const pointMat = (depthFade: number) =>
    own(
      new ShaderMaterial({
        uniforms: {
          uBg: { value: bg },
          uInk: { value: ink },
          uPR: { value: pr },
          uScale: { value: 30 },
          uNear: { value: 10 },
          uFar: { value: 30 },
          uFade: { value: depthFade },
        },
        vertexShader: `
          attribute float aMix; attribute float aSize;
          uniform float uPR, uScale, uNear, uFar, uFade;
          varying float vMix;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mv;
            float d = -mv.z;
            float near = clamp((uFar - d) / (uFar - uNear), 0.0, 1.0);
            vMix = aMix * mix(1.0 - uFade, 1.0, near);
            gl_PointSize = floor(clamp(aSize * uScale / d, 1.0, 7.0) * uPR + 0.5);
          }`,
        fragmentShader: `
          uniform vec3 uBg, uInk; varying float vMix;
          void main() { gl_FragColor = vec4(mix(uBg, uInk, vMix), 1.0); }`,
      }),
    );

  const cloudGeo = own(new BufferGeometry());
  const baseMix = new Float32Array(N);
  const baseSize = new Float32Array(N);
  const dust = space.clusterNames.indexOf('dust');
  for (let i = 0; i < N; i++) {
    const isDust = space.cluster[i] === dust;
    baseMix[i] = isDust ? 0.34 : 0.62;
    baseSize[i] = isDust ? 1.4 : 2.1;
  }
  cloudGeo.setAttribute('position', new BufferAttribute(P, 3));
  cloudGeo.setAttribute('aMix', new BufferAttribute(baseMix, 1));
  cloudGeo.setAttribute('aSize', new BufferAttribute(baseSize, 1));
  const cloudMat = pointMat(0.62);
  world.add(new Points(cloudGeo, cloudMat));

  const HI = 40;
  const hiGeo = own(new BufferGeometry());
  const hiPos = new BufferAttribute(new Float32Array(HI * 3), 3);
  const hiMix = new BufferAttribute(new Float32Array(HI), 1);
  const hiSize = new BufferAttribute(new Float32Array(HI), 1);
  hiGeo.setAttribute('position', hiPos);
  hiGeo.setAttribute('aMix', hiMix);
  hiGeo.setAttribute('aSize', hiSize);
  const hiMat = pointMat(0.2);
  hiMat.depthTest = false;
  const hi = new Points(hiGeo, hiMat);
  hi.renderOrder = 2;
  hi.frustumCulled = false;
  world.add(hi);

  const LN = 64;
  const lineGeo = own(new BufferGeometry());
  const linePos = new BufferAttribute(new Float32Array(LN * 6), 3);
  const lineCol = new BufferAttribute(new Float32Array(LN * 6), 3);
  lineGeo.setAttribute('position', linePos);
  lineGeo.setAttribute('color', lineCol);
  const lineMat = own(new LineBasicMaterial({ vertexColors: true, depthTest: false }));
  const lines = new LineSegments(lineGeo, lineMat);
  lines.renderOrder = 1;
  lines.frustumCulled = false;
  world.add(lines);

  // Overlay in CSS pixels, y down: plates, labels, and screen-space marks.
  const overlay = new Scene();
  const ortho = new OrthographicCamera(0, 1, 0, -1, -1, 1);
  const white = own(new DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1));
  white.needsUpdate = true;
  const batches: Batch[] = [];
  const batch = (texture: Texture, max: number, order: number): Batch => {
    const geo = own(new BufferGeometry());
    const pos = new BufferAttribute(new Float32Array(max * 12), 3);
    const uv = new BufferAttribute(new Float32Array(max * 8), 2);
    const mx = new BufferAttribute(new Float32Array(max * 4), 1);
    const idx: number[] = [];
    for (let q = 0; q < max; q++)
      idx.push(q * 4, q * 4 + 1, q * 4 + 2, q * 4, q * 4 + 2, q * 4 + 3);
    geo.setIndex(idx);
    geo.setAttribute('position', pos);
    geo.setAttribute('uv', uv);
    geo.setAttribute('aMix', mx);
    const mat = own(
      new ShaderMaterial({
        uniforms: { map: { value: texture }, uBg: { value: bg }, uInk: { value: ink } },
        vertexShader: `
          attribute float aMix; varying float vMix; varying vec2 vUv;
          void main() { vMix = aMix; vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `
          uniform sampler2D map; uniform vec3 uBg, uInk; varying float vMix; varying vec2 vUv;
          void main() {
            float a = texture2D(map, vUv).a * clamp(abs(vMix), 0.0, 1.0);
            if (a < 0.003) discard;
            gl_FragColor = vec4(mix(uBg, uInk, vMix < 0.0 ? 0.0 : 1.0), a);
          }`,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
    );
    const mesh = new Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = order;
    overlay.add(mesh);
    let n = 0;
    const b: Batch = {
      mat,
      // mix > 0 draws ink at that coverage, mix < 0 draws bg at |mix|: both stay on the bg-ink line.
      quad(x, y, w, h, [u0, v0, u1, v1], m) {
        if (n >= max || Math.abs(m) < 0.004) return;
        const sx = Math.round(x * pr) / pr;
        const sy = Math.round(y * pr) / pr;
        pos.array.set([sx, -sy - h, 0, sx + w, -sy - h, 0, sx + w, -sy, 0, sx, -sy, 0], n * 12);
        uv.array.set([u0, v0, u1, v0, u1, v1, u0, v1], n * 8);
        mx.array.fill(m, n * 4, n * 4 + 4);
        n++;
      },
      flush() {
        geo.setDrawRange(0, n * 6);
        pos.needsUpdate = true;
        uv.needsUpdate = true;
        mx.needsUpdate = true;
        n = 0;
      },
    };
    batches.push(b);
    return b;
  };
  const plates = batch(white, 16, 1);
  const labelText = batch(labelAtlas.texture, 80, 2);
  const headText = batch(headAtlas.texture, 8, 3);
  const hoverText = batch(white, 12, 3);
  const textSet = (a: Atlas, b: Batch): TextSet => ({
    w: (s) => a.sprites.get(s)?.w ?? 0,
    draw: (s, x, y, m) => {
      const sprite = a.sprites.get(s);
      if (sprite) b.quad(x, y - a.h / 2, sprite.w, a.h, sprite.uv, m);
    },
  });
  const labels = textSet(labelAtlas, labelText);
  const heads = textSet(headAtlas, headText);
  const placed: Placed[] = [];
  const hits = (x: number, y: number, w: number) =>
    placed.some((r) => x < r.x + r.w + 4 && x + w + 4 > r.x && Math.abs(y - r.y) < (r.h ?? 12));
  const placeLabel = (
    s: string,
    p: ScreenPoint,
    m: number,
    dy = 0,
    extra = 0,
    optional = false,
  ) => {
    const w = labelAtlas.sprites.get(s)?.w;
    if (w === undefined) return { x: p.x, y: p.y, w: 0 };
    const full = w + extra;
    const sides = p.x + 7 + full > W - 6 ? [-1, 1] : [1, -1];
    const spots = [0, -12, 12, -24, 24].flatMap((off) =>
      sides.map((side) => ({ x: side > 0 ? p.x + 7 : p.x - 7 - full, y: p.y + dy + off })),
    );
    const best = spots.find((r) => !hits(r.x, r.y, full)) ?? (optional ? null : spots[0]);
    if (!best) return { x: p.x, y: p.y, w: 0 };
    placed.push({ x: best.x, y: best.y, w: full });
    labels.draw(s, best.x, best.y, m);
    return { x: best.x, y: best.y, w };
  };
  const hoverSets = new Map<number, { atlas: Atlas; set: TextSet }>();
  const hoverSet = (tok: number) => {
    let entry = hoverSets.get(tok);
    if (!entry) {
      const a = atlas(
        [show(tokens[tok]), ...neighbors(tok).map((n) => show(tokens[n.i]))],
        11,
        400,
        family,
        pr,
      );
      entry = { atlas: a, set: textSet(a, hoverText) };
      hoverSets.set(tok, entry);
      if (hoverSets.size > 24) {
        const [oldest] = hoverSets.keys();
        hoverSets.get(oldest)?.atlas.texture.dispose();
        hoverSets.delete(oldest);
      }
    }
    hoverText.mat.uniforms.map.value = entry.atlas.texture;
    return entry.set;
  };

  const OL = 24;
  const olGeo = own(new BufferGeometry());
  const olPos = new BufferAttribute(new Float32Array(OL * 6), 3);
  const olCol = new BufferAttribute(new Float32Array(OL * 6), 3);
  olGeo.setAttribute('position', olPos);
  olGeo.setAttribute('color', olCol);
  const olMat = own(new LineBasicMaterial({ vertexColors: true, depthTest: false }));
  const olLines = new LineSegments(olGeo, olMat);
  olLines.frustumCulled = false;
  olLines.renderOrder = 4;
  overlay.add(olLines);

  let W = 0;
  let Hh = 0;
  let dist = 0;
  const tmp = new Color();
  const mixColor = (m: number) => tmp.copy(bg).lerp(ink, clamp(m, 0, 1));

  let nl = 0;
  const seg = (a: Vector3, b: Vector3, ma: number, mb = ma) => {
    if (nl >= LN) return;
    linePos.array.set([a.x, a.y, a.z, b.x, b.y, b.z], nl * 6);
    const ca = mixColor(ma);
    lineCol.array.set([ca.r, ca.g, ca.b], nl * 6);
    const cb = mixColor(mb);
    lineCol.array.set([cb.r, cb.g, cb.b], nl * 6 + 3);
    nl++;
  };
  let no = 0;
  const oseg = (x0: number, y0: number, x1: number, y1: number, m: number) => {
    if (no >= OL) return;
    const s = 0.5 / pr;
    const snap = (v: number) => Math.round(v * pr) / pr;
    olPos.array.set([snap(x0) + s, -snap(y0) - s, 0, snap(x1) + s, -snap(y1) - s, 0], no * 6);
    const c = mixColor(m);
    olCol.array.set([c.r, c.g, c.b, c.r, c.g, c.b], no * 6);
    no++;
  };
  const box = (x: number, y: number, r: number, m: number) => {
    oseg(x - r, y - r, x + r, y - r, m);
    oseg(x + r, y - r, x + r, y + r, m);
    oseg(x + r, y + r, x - r, y + r, m);
    oseg(x - r, y + r, x - r, y - r, m);
  };
  let nh = 0;
  const highlight = (v: Vector3, m: number, size: number) => {
    if (nh >= HI) return;
    hiPos.array.set([v.x, v.y, v.z], nh * 3);
    hiMix.array[nh] = m;
    hiSize.array[nh] = size;
    nh++;
  };

  const scr = new Vector3();
  const toScreen = (v: Vector3): ScreenPoint => {
    scr.copy(v).applyMatrix4(world.matrixWorld).project(camera);
    return { x: (scr.x * 0.5 + 0.5) * W, y: (0.5 - scr.y * 0.5) * Hh };
  };

  const va = new Vector3();
  const vb = new Vector3();
  const qv = new Vector3();

  const nb = new Vector3();
  const tip = new Vector3();
  const drawNeighbors = (
    tok: number,
    q: Vector3,
    fade: number,
    grow: number,
    names = labels,
    head = heads,
  ) => {
    const nn = neighbors(tok);
    for (let r = 0; r < nn.length; r++) {
      const g = smooth(r * 0.06, r * 0.06 + 0.4, grow);
      if (g <= 0) continue;
      at(nn[r].i, nb);
      tip.copy(q).lerp(nb, g);
      seg(q, tip, 0.7 * fade, 0.45 * fade);
      highlight(nb, 0.95 * fade * g, 3.2);
    }
    const p = toScreen(q);
    const name = show(tokens[tok]);
    const rowH = 15;
    const colW = 7 * 4 + 8;
    let wMax = 0;
    for (const n of nn) wMax = Math.max(wMax, names.w(show(tokens[n.i])));
    const blockW = Math.max(colW + wMax, head.w(name));
    const blockH = headAtlas.h + 6 + nn.length * rowH;
    const gap = 22;
    const roomR = W - 16 - (p.x + gap + blockW);
    const roomL = p.x - gap - blockW - 16;
    const outward = p.x < W / 2 ? roomL > 0 : roomR < 0;
    const x0 = outward ? p.x - gap - blockW : p.x + gap;
    const y0 = clamp(p.y - headAtlas.h / 2, 12, Hh - blockH - 12);
    plates.quad(x0 - 8, y0 - 6, blockW + 16, blockH + 10, [0, 0, 1, 1], -fade);
    placed.push({ x: x0 - 8, y: y0 + blockH / 2, w: blockW + 16, h: blockH / 2 + 12 });
    head.draw(name, x0, y0 + headAtlas.h / 2, fade);
    oseg(x0, y0 + headAtlas.h + 2, x0 + blockW, y0 + headAtlas.h + 2, 0.25 * fade);
    nn.forEach((n, r) => {
      const y = y0 + headAtlas.h + 6 + rowH * (r + 0.5);
      labels.draw(fmt(n.s), x0, y, 0.5 * fade);
      names.draw(show(tokens[n.i]), x0 + colW, y, 0.8 * fade);
    });
    box(p.x, p.y, 5, 0.9 * fade);
  };

  const drawAnalogy = (t: number) => {
    const u = (t + AN_OFFSET) / AN_PERIOD;
    const k = Math.floor(u);
    const ph = (u - k) * AN_PERIOD;
    const a = analogies[((k % analogies.length) + analogies.length) % analogies.length];
    const fade = smooth(0, 0.8, ph) * (1 - smooth(AN_PERIOD - 2.5, AN_PERIOD - 0.5, ph));
    if (fade <= 0) return;
    const pa = at(a.ia);
    const pb = at(a.ib);
    const pc = at(a.ic);
    const pd = at(a.answer);
    const pq = a.qPos;
    // a -> b is the offset, a -> c the other side; the same offset from c lands at b - a + c.
    const g1 = smooth(0.4, 1.6, ph);
    const g2 = smooth(1.2, 2.4, ph);
    const g3 = smooth(2.2, 3.4, ph);
    const m = 0.55 * fade;
    seg(pa, va.copy(pa).lerp(pb, g1), m);
    seg(pa, va.copy(pa).lerp(pc, g2), m);
    if (g3 > 0) {
      seg(pc, va.copy(pc).lerp(pq, g3), m);
      seg(pb, va.copy(pb).lerp(pq, g3), m);
    }
    const g4 = smooth(3.2, 3.8, ph);
    if (g4 > 0) seg(pq, va.copy(pq).lerp(pd, g4), 0.35 * fade);
    const ends: [Vector3, number][] = [
      [pa, 1],
      [pb, g1],
      [pc, g2],
      [pd, g4],
    ];
    for (const [p, g] of ends) highlight(p, fade * g, 3.4);
    const sa = toScreen(pa);
    const sb = toScreen(pb);
    const sc = toScreen(pc);
    const sd = toScreen(pd);
    const sq = toScreen(pq);
    if (g3 >= 1) box(sq.x, sq.y, 3, 0.8 * fade * g4 + 0.4 * fade * (1 - g4));
    const tm = 0.75 * fade;
    placeLabel(show(tokens[a.ia]), sa, tm);
    placeLabel(show(tokens[a.ib]), sb, tm * g1);
    placeLabel(show(tokens[a.ic]), sc, tm * g2);
    const d = placeLabel(show(tokens[a.answer]), sd, tm * g4, 0, labels.w(fmt(a.cos)) + 4);
    labels.draw(fmt(a.cos), d.x + d.w + 4, d.y, 0.45 * fade * g4);
    const capW = labels.w(a.caption);
    const xs = [sa.x, sb.x, sc.x, sd.x, sq.x];
    const bottom = Math.max(sa.y, sb.y, sc.y, sd.y, sq.y) + 20;
    const outer =
      (Math.min(...xs) + Math.max(...xs)) / 2 > W / 2
        ? Math.min(...xs) - 8
        : Math.max(...xs) + 8 - capW;
    labels.draw(a.caption, clamp(outer, 8, W - capW - 8), bottom, 0.6 * fade * g4);
  };

  // The pointer in stage coordinates from -1 to 1, y up, and when it last moved.
  const pointer = { x: 0, y: 0, at: -Infinity };
  const pm = new Matrix4();
  const hovered = () => {
    if (performance.now() - pointer.at >= POINTER_MS) return -1;
    const px = (pointer.x * 0.5 + 0.5) * W;
    const py = (0.5 - pointer.y * 0.5) * Hh;
    const e = pm
      .multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
      .multiply(world.matrixWorld).elements;
    let best = -1;
    let bd = 14 * 14;
    for (let i = 0; i < N; i++) {
      if (space.cluster[i] === dust || capitalized[i]) continue;
      const x = P[i * 3];
      const y = P[i * 3 + 1];
      const z = P[i * 3 + 2];
      const cw = e[3] * x + e[7] * y + e[11] * z + e[15];
      const sx = ((e[0] * x + e[4] * y + e[8] * z + e[12]) / cw) * 0.5 * W + W / 2 - px;
      const sy = Hh / 2 - ((e[1] * x + e[5] * y + e[9] * z + e[13]) / cw) * 0.5 * Hh - py;
      const dd = sx * sx + sy * sy;
      if (dd < bd) {
        bd = dd;
        best = i;
      }
    }
    return best;
  };

  function resize() {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    if (w === W && h === Hh) return;
    renderer.setSize(w, h, false);
    W = w;
    Hh = h;
    const a = w / h;
    camera.aspect = a;
    const tan = Math.tan(((FOV / 2) * Math.PI) / 180);
    // A portrait stage rolls the camera so the band runs down the screen.
    const portrait = a < 1;
    camera.up.set(portrait ? 1 : 0, portrait ? 0 : 1, 0);
    const along = portrait ? tan : tan * a;
    const across = portrait ? tan * a : tan;
    const e = along / across;
    // A very wide stage, like the hero band, squashes y and lifts the band into the unfaded top.
    const wide = clamp((e - 2.4) / 0.8, 0, 1);
    world.scale.set(1, 1 - 0.42 * wide, 1);
    world.updateMatrixWorld();
    const dW = HALF_W / along;
    const dH = (HALF_H * world.scale.y) / across;
    dist = Math.min(dW, Math.max(dH * 1.3, dW * 0.4));
    camera.setViewOffset(w, h, 0, 0.15 * wide * h, w, h);
    camera.updateProjectionMatrix();
    ortho.left = 0;
    ortho.right = w;
    ortho.top = 0;
    ortho.bottom = -h;
    ortho.updateProjectionMatrix();
    for (const mat of [cloudMat, hiMat]) {
      mat.uniforms.uScale.value = dist * 1.1 * clamp(Math.min(w, h) / 640, 0.72, 1);
      mat.uniforms.uNear.value = dist - DEPTH;
      mat.uniforms.uFar.value = dist + DEPTH;
    }
  }

  function frame(t: number) {
    const yaw = YAW * Math.sin((t / SWING) * Math.PI * 2);
    camera.position.set(
      Math.sin(yaw) * Math.cos(PITCH) * dist,
      Math.sin(PITCH) * dist,
      Math.cos(yaw) * Math.cos(PITCH) * dist,
    );
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();

    nl = 0;
    no = 0;
    nh = 0;
    placed.length = 0;
    const L = seq.length;
    const u = (t + PHASE) / STEP;
    const k = Math.floor(u);
    const ph = (u - k) * STEP;
    const tokAt = (j: number) => seq[(((START + j) % L) + L) % L];
    const cur = tokAt(k);
    const prev = tokAt(k - 1);
    const move = smooth(0, GLIDE, ph);
    at(prev, va);
    at(cur, vb);
    qv.copy(va).lerp(vb, move);

    let head = qv.clone();
    const trailLabels: [string, ScreenPoint, number][] = [];
    for (let j = 1; j <= TRAIL; j++) {
      const p = at(tokAt(k - j));
      const age = (j - 1 + move) / TRAIL;
      const m = 0.5 * (1 - age);
      if (m > 0) seg(head, p, m + 0.08, m);
      if (j > 1 || move > 0.6) {
        highlight(p, 0.85 * (1 - age), 2.8);
        const shown = 0.6 * (1 - age) * (j === 1 ? smooth(0.6, 1, move) : 1);
        trailLabels.push([show(tokens[tokAt(k - j)]), toScreen(p), shown]);
      }
      head = p;
    }

    const hover = hovered();
    if (hover >= 0) {
      const set = hoverSet(hover);
      drawNeighbors(hover, at(hover), 1, 1, set, set);
    } else {
      const out = 1 - smooth(0, 0.35, ph);
      if (out > 0) drawNeighbors(prev, va.clone(), out, 1);
      const inn = smooth(GLIDE + 0.05, GLIDE + 0.45, ph);
      if (inn > 0) drawNeighbors(cur, vb.clone(), inn, smooth(GLIDE, GLIDE + 0.7, ph));
    }
    highlight(qv, 1, 5.5);

    drawAnalogy(t);
    for (const [str, p, m] of trailLabels) placeLabel(str, p, m, -9, 0, true);

    lineGeo.setDrawRange(0, nl * 2);
    linePos.needsUpdate = true;
    lineCol.needsUpdate = true;
    olGeo.setDrawRange(0, no * 2);
    olPos.needsUpdate = true;
    olCol.needsUpdate = true;
    hiGeo.setDrawRange(0, nh);
    hiPos.needsUpdate = true;
    hiMix.needsUpdate = true;
    hiSize.needsUpdate = true;
    for (const b of batches) b.flush();

    renderer.autoClear = true;
    renderer.render(scene, camera);
    renderer.autoClear = false;
    renderer.render(overlay, ortho);
  }

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const darkScheme = matchMedia('(prefers-color-scheme: dark)');
  const t0 = performance.now();
  const now = () => (reducedMotion.matches ? REST_T : (performance.now() - t0) / 1000);

  // The shaders, the textures, the buffers of each scene, and the drawing buffer each take a task
  // here, so the first frame only draws.
  const warmUp = [
    () => renderer.compile(scene, camera),
    () => renderer.compile(overlay, ortho),
    () => renderer.initTexture(white),
    () => renderer.initTexture(labelAtlas.texture),
    () => renderer.initTexture(headAtlas.texture),
    () => renderer.render(scene, camera),
    () => renderer.render(overlay, ortho),
    resize,
    () => frame(now()),
  ];
  for (const step of warmUp) {
    await nextSlice();
    step();
  }
  stage.append(renderer.domElement);

  let visible = false;
  let raf = 0;
  let last = -Infinity;
  const running = () => visible && !document.hidden && !reducedMotion.matches;

  function tick(time: number) {
    raf = 0;
    if (!running()) return;
    raf = requestAnimationFrame(tick);
    if (time - last < 1000 / FPS - 2) return;
    last = time;
    frame((time - t0) / 1000);
  }

  function play() {
    if (running() && !raf) raf = requestAnimationFrame(tick);
  }

  const listeners = new AbortController();
  const { signal } = listeners;
  addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType !== 'mouse') return;
      const rect = stage.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      pointer.at = performance.now();
    },
    { signal },
  );
  document.addEventListener('visibilitychange', play, { signal });
  reducedMotion.addEventListener(
    'change',
    () => {
      if (reducedMotion.matches) frame(REST_T);
      else play();
    },
    { signal },
  );
  darkScheme.addEventListener(
    'change',
    () => {
      paint();
      frame(now());
    },
    { signal },
  );
  // three cancels webglcontextlost and rebuilds its state on restore, but only a draw repaints.
  renderer.domElement.addEventListener('webglcontextrestored', () => frame(now()), { signal });
  const resizeObserver = new ResizeObserver(() => {
    resize();
    frame(now());
  });
  resizeObserver.observe(stage);
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    play();
  });
  intersectionObserver.observe(stage);

  return {
    destroy() {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      listeners.abort();
      for (const { atlas: a } of hoverSets.values()) a.texture.dispose();
      release();
    },
  };
}
