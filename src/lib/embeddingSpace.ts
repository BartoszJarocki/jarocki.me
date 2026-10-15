// A toy token embedding table: N tokens in D dims, unit length. The scene draws dims 0 to DRAWN - 1,
// so the drawing is a linear projection and vector arithmetic stays exact on screen.
export const D = 32;
export const DRAWN = 3;

export type EmbeddingSpace = {
  tokens: string[];
  vec: Float32Array;
  cluster: Int16Array;
  index: Map<string, number>;
  N: number;
  clusterNames: readonly string[];
};

export type Neighbor = { i: number; s: number };

export type Analogy = {
  ia: number;
  ib: number;
  ic: number;
  answer: number;
  cos: number;
  q: Float32Array;
};

type Vec3 = [number, number, number];
type Cluster = { name: string; at: Vec3; words?: string; raw?: string[] };
type Family = { pairs: [string, string][]; extra?: string };

export const CORPUS = (
  'building AI at motion. exploring what software engineering looks like when agents do most of the typing. ' +
  "When I was in my early 20' I haven't thought too much about the time and how long life is. I was focused on finishing university and finding my first job. " +
  "During our lifetime everything has a start and an end. It's our nature to not appreciate things we already have and people who are around us. " +
  "If you take it further and optimistically assume you'll live 80 years then if you're 32 like me you have 58 summers, winters, springs, and autumns left."
).toLowerCase();

// prettier-ignore
const CLUSTERS: Cluster[] = [
  {
    name: 'function',
    at: [-0.56, 0.08, 0.12],
    words:
      'the a an of to in at on for with by from about as into onto over under around through and or but not so too also very just than like then if because while though although yet nor either neither whether upon within without across along among against toward between beyond during',
  },
  {
    name: 'pronoun',
    at: [0.58, -0.04, -0.14],
    words:
      "I you we they it me us them my our your their its who what which when where how why that this these those there here it's you'll you're haven't I'm we're they're don't can't isn't won't I've we've whoever whatever myself yourself ourselves themselves itself",
  },
  {
    name: 'aux',
    at: [-0.62, 0.28, -0.15],
    words:
      'is was are were be been being have has had do does did will would can could should may might must shall get got make made let need ought used going gonna wanna',
  },
  {
    name: 'punct',
    at: [0.62, -0.32, -0.2],
    raw: [
      '.', ',', '!', '?', ';', ':', "'", '"', '(', ')', '-', '...', '[', ']', '{', '}', '/', '*',
      '&', '%', '#', '@', '_', '~', '|', '<', '>', '=', '+', ' (', ' -', ' "', " '", ' [', ' {',
      ' *', ' &', ' =', ' +', ' /', '),', ').', '."', ',"', '?"', '!"', "'s", "'t", "'ll", "'re",
      "'ve", "'d", "'m", '--', '->', '=>', '::', '();', '{}', '[]', "'", '`', '```',
    ],
  },
  {
    name: 'suffix',
    at: [-0.64, -0.12, -0.2],
    raw: [
      'ing', 'ed', 'er', 'ers', 'ies', 'ity', 'ment', 'tion', 'ally', 'ly', 's', 'es', 'able',
      'ness', 'ful', 'less', 'ous', 'ive', 'ize', 'ise', 'ist', 'ism', 'al', 'ic', 'ary', 'ory',
      'ship', 'hood', 'ciate', 'ation', 'ence', 'ance', 'est', 'en', 'ish', 'ward', 'wise', 'like',
      'ible', 'ial', 'ian', 'ant', 'ent', 'ings', 'ments', 'tions', 'ated', 'ating', 'ized',
      'izing', 'ful', 'fully', 'ably', 'ically', 'ure', 'age', 'ery', 'let', 'ette', 'oid', 'ology',
    ],
  },
  {
    name: 'time',
    at: [0.48, 0.28, -0.12],
    raw: [' summ', ' wint'],
    words:
      'time times day days year years week weeks month months hour hours minute minutes second moment life lifetime early late long soon start end begin beginning summer summers winter winters spring springs autumn autumns season seasons morning evening night today tomorrow yesterday age decade century future past now already ago left remaining until since before after always never often forever period era date calendar clock weekend holiday birthday deadline history',
  },
  {
    name: 'quantity',
    at: [-0.2, -0.05, 0.28],
    raw: [' furth'],
    words:
      'most much more many few less least some any all each every no both half whole enough several plenty lot lots little big bigger biggest small smaller smallest large huge tiny first last next further extra only single double triple total entire full empty',
  },
  {
    name: 'code',
    at: [0.52, -0.2, 0.24],
    words:
      'software code engineer engineering developer programmer agent agents AI model models neural network token tokens embedding vector matrix compute GPU data dataset function class method variable compiler compile runtime server client API database query bug debug deploy commit git branch merge test tests build typing keyboard terminal script python javascript typescript rust react node linux kernel cache thread async loop array string integer float null undefined byte prompt algorithm transformer attention gradient training inference LLM chat motion',
  },
  {
    name: 'work',
    at: [0.2, -0.28, -0.25],
    raw: [' univers'],
    words:
      'job jobs work career company salary hire hiring manager office boss meeting project startup business money contract interview promotion university student degree study exam school graduate intern resume team client product launch revenue focus focused founder leader leadership colleague customer market',
  },
  {
    name: 'verb',
    at: [-0.44, 0.3, 0.16],
    raw: [' explor', ' appre'],
    words:
      'look looks like assume take find finish live keep say tell feel try want need help show call ask turn move play run hold bring happen sit stand lose pay meet include continue set learn change lead understand watch follow stop create speak allow add spend grow open win offer remember love consider appear buy wait serve die send expect stay fall cut reach kill remain suggest raise pass sell require report decide pull',
  },
  {
    name: 'quality',
    at: [0.0, 0.3, 0.0],
    words:
      'happy sad hard easy good bad great wonderful scary extreme extremely optimistic pessimistic calm angry afraid proud tired busy free grateful lonely regret stress love hope fear joy pain peace nature honest kind brave gentle strange simple beautiful ugly real true false important possible clear sure certain ready',
  },
  {
    name: 'thing',
    at: [0.12, 0.0, 0.3],
    raw: [' everyth'],
    words:
      'things thing stuff everything nothing something anything world earth sun moon rain snow sea river tree forest mountain sky wind light dark fire water stone flower garden field road house room door window table chair book paper phone car city town',
  },
  { name: 'people', at: [-0.6, -0.3, 0.18] },
  { name: 'place', at: [0.55, 0.1, 0.22] },
  { name: 'number', at: [-0.1, -0.32, -0.15] },
  { name: 'dust', at: [0, 0, 0] },
];

// Pairs that share one relation offset, so the classic analogies hold by construction, as they do
// in word2vec.
// prettier-ignore
const FAMILIES: Record<string, Family> = {
  people: {
    pairs: [
      ['man', 'woman'], ['king', 'queen'], ['prince', 'princess'], ['boy', 'girl'],
      ['father', 'mother'], ['son', 'daughter'], ['brother', 'sister'], ['husband', 'wife'],
      ['uncle', 'aunt'], ['he', 'she'], ['him', 'her'], ['his', 'hers'], ['actor', 'actress'],
      ['waiter', 'waitress'], ['nephew', 'niece'], ['grandfather', 'grandmother'],
      ['emperor', 'empress'], ['duke', 'duchess'], ['sir', 'madam'], ['gentleman', 'lady'],
      ['mr', 'mrs'], ['dad', 'mom'], ['groom', 'bride'], ['lord', 'dame'],
    ],
    extra:
      'people person friend friends parent parents child children family spouse human someone everyone baby kid kids neighbor stranger guest',
  },
  place: {
    pairs: [
      ['france', 'paris'], ['poland', 'warsaw'], ['germany', 'berlin'], ['japan', 'tokyo'],
      ['italy', 'rome'], ['spain', 'madrid'], ['england', 'london'], ['portugal', 'lisbon'],
      ['austria', 'vienna'], ['czechia', 'prague'], ['norway', 'oslo'], ['sweden', 'stockholm'],
      ['greece', 'athens'], ['egypt', 'cairo'], ['canada', 'ottawa'], ['ireland', 'dublin'],
      ['ukraine', 'kyiv'], ['china', 'beijing'], ['finland', 'helsinki'], ['hungary', 'budapest'],
    ],
    extra:
      'city country capital town village street home campus europe asia america africa north south east west krakow gdansk wroclaw nokia abroad border',
  },
  verb: {
    pairs: [
      ['walk', 'walked'], ['swim', 'swam'], ['run', 'ran'], ['go', 'went'], ['write', 'wrote'],
      ['think', 'thought'], ['take', 'took'], ['find', 'found'], ['see', 'saw'], ['give', 'gave'],
      ['come', 'came'], ['eat', 'ate'], ['speak', 'spoke'], ['drive', 'drove'], ['sing', 'sang'],
      ['fly', 'flew'], ['know', 'knew'], ['begin', 'began'], ['read', 'read_'], ['type', 'typed'],
      ['build', 'built'], ['live', 'lived'], ['finish', 'finished'], ['focus', 'focused'],
      ['explore', 'explored'], ['assume', 'assumed'], ['appreciate', 'appreciated'],
      ['learn', 'learned'], ['work', 'worked'], ['play', 'played'],
    ],
  },
};

export const ANALOGIES: readonly (readonly [string, string, string, string])[] = [
  [' king', ' man', ' woman', ' queen'],
  [' paris', ' france', ' poland', ' warsaw'],
  [' walked', ' walk', ' swim', ' swam'],
];

const SYLLABLES =
  'th he in er an re on at en nd ti es or te of ed is it al ar st to nt ng se ha as ou io le ve co me de hi ri ro ic ne ea ra ce li ch ll be ma si om ur ca el ta la ns di fo ho pe ec pr no ct us ac ot il tr ly nc et ut ss so rs un lo wa ge ie wh ee wi em ad ol rt po we na ul ni ts mo ow pa im mi ai sh ir su id os iv ia am fi ci vi pl ig tu ev ld ry mp fe bl ab gh ty op wo sa ay ex ke fr oo av ag if ap gr od bo sp rd do uc bu ei ov by rm ep tt oc fa ef cu rn sc gi da yo cr cl du ga qu ue ff ba ey ls va um pp ua up lu go ht ru ug ds lt pi rc rr eg au ck ew mu br bi pt ak pu ui rg ib tl ny ki rk ys ob mm fu ph og ms ye ud mb ip ub oi rl gu dr hr cc tw ft wn nu af hu nn eo vo rv nf xp gn sm fl iz ok nl my gl aw sy oa';

export function tokenize(text: string) {
  const out: string[] = [];
  for (const [piece] of text.matchAll(/\s?[A-Za-z']+|\s?\d+|\s?[^\sA-Za-z\d]/g)) {
    const lead = piece.startsWith(' ') ? ' ' : '';
    const word = piece.trim();
    const suffix = word.length > 6 && word.match(/(ing|tion|ally|ed|ly|er|ers|ies|ity|ment)$/);
    if (suffix) out.push(lead + word.slice(0, -suffix[0].length), suffix[0]);
    else if (word.length > 8) out.push(lead + word.slice(0, 5), word.slice(5));
    else out.push(piece);
  }
  return out;
}

export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(rand: () => number) {
  const u = Math.max(rand(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

function direction(rand: () => number, display: ArrayLike<number>, hiddenNorm: number) {
  const v = new Float32Array(D);
  v.set(display, 0);
  let n = 0;
  for (let i = DRAWN; i < D; i++) n += (v[i] = gauss(rand)) ** 2;
  n = Math.sqrt(n);
  for (let i = DRAWN; i < D; i++) v[i] *= hiddenNorm / n;
  return v;
}

function noise(rand: () => number, sd: number, sh: number) {
  const v = new Float32Array(D);
  for (let i = 0; i < D; i++) v[i] = gauss(rand) * (i < DRAWN ? sd : sh);
  return v;
}

function add(...vs: [ArrayLike<number>, number?][]) {
  const out = new Float32Array(D);
  for (const [v, k = 1] of vs) for (let i = 0; i < D; i++) out[i] += v[i] * k;
  return out;
}

function normalize(v: Float32Array) {
  let n = 0;
  for (let i = 0; i < D; i++) n += v[i] * v[i];
  n = Math.sqrt(n);
  for (let i = 0; i < D; i++) v[i] /= n;
  return v;
}

export function* buildSpace(
  rand: () => number,
  corpus: string[],
): Generator<void, EmbeddingSpace, void> {
  const tokens: string[] = [];
  const vecs: Float32Array[] = [];
  const cluster: number[] = [];
  const index = new Map<string, number>();
  const put = (str: string, v: Float32Array, c: number) => {
    if (index.has(str)) return;
    index.set(str, tokens.length);
    tokens.push(str);
    vecs.push(normalize(v));
    cluster.push(c);
  };
  // Rare tokens share one hidden direction that no cluster uses, so they bunch together and stay
  // out of neighbor lists.
  const rare = direction(rand, [0, 0, 0], 1);
  const centers = CLUSTERS.map((c) => {
    const v = direction(rand, c.at, 1);
    let dot = 0;
    for (let i = DRAWN; i < D; i++) dot += v[i] * rare[i];
    let n = 0;
    for (let i = DRAWN; i < D; i++) n += (v[i] -= dot * rare[i]) ** 2;
    const k = Math.sqrt(1 - Math.hypot(...c.at) ** 2) / Math.sqrt(n);
    for (let i = DRAWN; i < D; i++) v[i] *= k;
    return v;
  });
  const noSpace = direction(rand, [0.0, 0.03, 0.0], 0.34);
  const capital = direction(rand, [0.0, -0.025, 0.02], 0.3);
  const variants = (base: Float32Array, word: string, c: number) => {
    put(' ' + word, add([base], [noise(rand, 0.004, 0.035)]), c);
    if (rand() < 0.65) put(word, add([base], [noSpace], [noise(rand, 0.006, 0.04)]), c);
    if (/^[a-z]/.test(word) && rand() < 0.5)
      put(
        ' ' + word[0].toUpperCase() + word.slice(1),
        add([base], [capital], [noise(rand, 0.006, 0.04)]),
        c,
      );
  };
  const word = (c: number, sd = 0.026, sh = 0.14) => add([centers[c]], [noise(rand, sd, sh)]);

  for (const [c, spec] of CLUSTERS.entries()) {
    yield;
    if (spec.raw) for (const s of spec.raw) put(s, word(c, 0.024, 0.14), c);
    if (spec.words)
      for (const w of spec.words.split(' ')) if (!index.has(' ' + w)) variants(word(c), w, c);
    const family = FAMILIES[spec.name];
    if (!family) continue;
    const sx = -Math.sign(spec.at[0]);
    const rel = [sx * 0.072, 0.015, (rand() - 0.5) * 0.04];
    const a = direction(rand, rel, 0.26);
    const b = direction(rand, [-rel[0], -rel[1], -rel[2]], 0.26);
    let first: Float32Array | null = null;
    let opened = false;
    for (const [x, y] of family.pairs) {
      const role = add([centers[c]], [noise(rand, 0.022, 0.14)]);
      // The analogy's second pair sits across the relation, so its parallelogram opens up on
      // screen.
      if (!first) first = role;
      else if (!opened) {
        role[0] = first[0] + 0.03 * sx;
        role[1] = first[1] + (centers[c][1] > 0 ? -0.12 : 0.12);
        role[2] = first[2];
        opened = true;
      }
      variants(add([role], [a]), x, c);
      variants(add([role], [b]), y.replace(/_$/, ''), c);
    }
    for (const w of family.extra?.split(' ') ?? []) variants(word(c), w, c);
  }

  const num = CLUSTERS.findIndex((c) => c.name === 'number');
  const years = Array.from({ length: 41 }, (_, i) => 1990 + i);
  const values = [...Array(101).keys(), 128, 200, 256, 365, 500, 512, 1000, 1024, ...years];
  yield;
  const axis = direction(rand, [0.17, 0.02, -0.06], 0);
  for (const n of values) {
    const v = add(
      [centers[num]],
      [axis, Math.log10(n + 1) / 3.3 - 0.5],
      [noise(rand, 0.003, 0.06)],
    );
    // Numbers sit on a helix: periodic features in base 10 and 100, as probes find in real models.
    const th10 = (2 * Math.PI * n) / 10;
    const th100 = (2 * Math.PI * n) / 100;
    v[1] += 0.035 * Math.cos(th10);
    v[2] += 0.035 * Math.sin(th10);
    v[DRAWN + 0] += 0.32 * Math.cos(th10);
    v[DRAWN + 1] += 0.32 * Math.sin(th10);
    v[DRAWN + 2] += 0.22 * Math.cos(th100);
    v[DRAWN + 3] += 0.22 * Math.sin(th100);
    v[DRAWN + 4] += 0.4 * (n >= 1900 && n <= 2100 ? 1 : 0);
    put(' ' + n, v, num);
    if (n < 100 && rand() < 0.5) put(String(n), add([v], [noSpace]), num);
  }

  const dust = CLUSTERS.length - 1;
  const syllables = SYLLABLES.split(' ');
  const syllable = () => syllables[Math.floor(rand() * syllables.length)];
  for (let i = 0; tokens.length < 3200 && i < 5000; i++) {
    if (i % 200 === 0) yield;
    const s = syllable() + (rand() < 0.6 ? syllable() : '') + (rand() < 0.2 ? syllable()[0] : '');
    const at = [(rand() * 2 - 1) * 0.76, gauss(rand) * 0.2, gauss(rand) * 0.17];
    put((rand() < 0.35 ? ' ' : '') + s, add([direction(rand, at, 0.6)], [rare, 0.7]), dust);
  }

  for (const tok of corpus) {
    if (index.has(tok)) continue;
    const spaced = index.get(' ' + tok.trim());
    const capitalized = tokens.findIndex((t) => t.toLowerCase() === tok);
    if (spaced !== undefined) put(tok, add([vecs[spaced]], [noSpace]), cluster[spaced]);
    else if (capitalized >= 0) put(tok, add([vecs[capitalized]]), cluster[capitalized]);
    else put(tok, word(dust), dust);
  }

  const N = tokens.length;
  const vec = new Float32Array(N * D);
  vecs.forEach((v, i) => vec.set(v, i * D));
  return {
    tokens,
    vec,
    cluster: Int16Array.from(cluster),
    index,
    N,
    clusterNames: CLUSTERS.map((c) => c.name),
  };
}

export function row(space: EmbeddingSpace, i: number) {
  return space.vec.subarray(i * D, i * D + D);
}

export function cosine(space: EmbeddingSpace, q: ArrayLike<number>) {
  const { vec, N } = space;
  let qn = 0;
  for (let d = 0; d < D; d++) qn += q[d] * q[d];
  qn = Math.sqrt(qn);
  const out = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    let s = 0;
    const o = i * D;
    for (let d = 0; d < D; d++) s += vec[o + d] * q[d];
    out[i] = s / qn;
  }
  return out;
}

export function topK(sims: Float32Array, k: number, skip: (i: number) => boolean) {
  const best: Neighbor[] = [];
  for (let i = 0; i < sims.length; i++) {
    if (skip(i)) continue;
    const s = sims[i];
    if (best.length < k || s > best[best.length - 1].s) {
      best.push({ i, s });
      best.sort((a, b) => b.s - a.s);
      if (best.length > k) best.pop();
    }
  }
  return best;
}

// 3CosAdd, as word2vec evaluates analogies: argmax cos(x, b - a + c) over the vocabulary without
// a, b, and c.
export function analogy(
  space: EmbeddingSpace,
  [b, a, c]: readonly [string, string, string, string],
): Analogy {
  const id = (s: string) => {
    const i = space.index.get(s);
    if (i === undefined) throw new Error(`${JSON.stringify(s)} is not in the embedding space`);
    return i;
  };
  const [ib, ia, ic] = [id(b), id(a), id(c)];
  const q = add([row(space, ib)], [row(space, ia), -1], [row(space, ic)]);
  const [best] = topK(cosine(space, q), 1, (i) => i === ia || i === ib || i === ic);
  return { ia, ib, ic, q, answer: best.i, cos: best.s };
}
