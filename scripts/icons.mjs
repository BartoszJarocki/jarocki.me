import * as hb from 'harfbuzzjs';
import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const font = new hb.Font(
  new hb.Face(new hb.Blob(await readFile('src/fonts/GeistPixel-Square.ttf'))),
);
// Geist Pixel Square draws every glyph from squares 38 units wide.
const unit = 38;
const monogram = 'BJ';
const gap = 2;
// The light and dark ink and background tokens from src/styles/index.css in sRGB.
const colors = { ink: '#1a1815', bg: '#fafaf8', darkInk: '#ecebe8' };

function outline(char) {
  const buffer = new hb.Buffer();
  buffer.addText(char);
  buffer.guessSegmentProperties();
  hb.shape(font, buffer);
  const polygons = [];
  for (const { type, values } of font.glyphToJson(buffer.getGlyphInfos()[0].codepoint)) {
    if (type === 'M') polygons.push([values]);
    else if (type === 'L') polygons.at(-1).push(values);
    else if (type !== 'Z') throw new Error(`${char} has a curve, so it is not a pixel glyph`);
  }
  if (polygons.flat(2).some((value) => value % unit !== 0)) {
    throw new Error(`${char} has a point off the ${unit} unit grid`);
  }
  return polygons;
}

function inside(polygons, x, y) {
  let winding = 0;
  for (const polygon of polygons) {
    polygon.forEach(([x1, y1], i) => {
      const [x2, y2] = polygon[(i + 1) % polygon.length];
      const side = (x2 - x1) * (y - y1) - (x - x1) * (y2 - y1);
      if (y1 <= y && y2 > y && side > 0) winding++;
      if (y1 > y && y2 <= y && side < 0) winding--;
    });
  }
  return winding !== 0;
}

// A glyph as rows of cells from the cap height down to the baseline, cropped to its ink.
function cells(char) {
  const polygons = outline(char);
  const xs = polygons.flat().map(([x]) => x);
  const ys = polygons.flat().map(([, y]) => y);
  const rows = [];
  for (let y = Math.max(...ys) - unit / 2; y > Math.min(...ys); y -= unit) {
    const row = [];
    for (let x = Math.min(...xs) + unit / 2; x < Math.max(...xs); x += unit) {
      row.push(inside(polygons, x, y));
    }
    rows.push(row);
  }
  return rows;
}

const glyphs = [...monogram].map(cells);
const grid = glyphs[0].map((_, y) =>
  glyphs.flatMap((glyph, i) => [...(i > 0 ? Array(gap).fill(false) : []), ...glyph[y]]),
);

// The grid centered on a square, one rectangle per run of cells.
function svg(size, cell, style) {
  const left = Math.floor((size - grid[0].length * cell) / 2);
  const top = Math.floor((size - grid.length * cell) / 2);
  let path = '';
  grid.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (!row[x]) continue;
      const start = x;
      while (row[x + 1]) x++;
      const width = (x - start + 1) * cell;
      path += `M${left + start * cell} ${top + y * cell}h${width}v${cell}h-${width}z`;
    }
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">${style}<path d="${path}"/></svg>\n`;
}

const opaque = (size) =>
  `<style>path{fill:${colors.ink}}</style><rect width="${size}" height="${size}" fill="${colors.bg}"/>`;
const png = (source) => sharp(Buffer.from(source)).png().toBuffer();

// An ICO file that holds one PNG.
function ico(image, size) {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  header.writeUInt8(size, 6);
  header.writeUInt8(size, 7);
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(image.length, 14);
  header.writeUInt32LE(22, 18);
  return Buffer.concat([header, image]);
}

// The grid is 19 cells tall, so at 32px each cell is one pixel, which is what a 2x screen draws
// for a 16px tab icon. The SVG follows the color scheme. The ICO and the home screen icon can't,
// so they keep the light background and stay readable on a dark tab bar.
const scheme = `<style>path{fill:${colors.ink}}@media(prefers-color-scheme:dark){path{fill:${colors.darkInk}}}</style>`;
await writeFile('public/icon.svg', svg(32, 1, scheme));
await writeFile('public/favicon.ico', ico(await png(svg(32, 1, opaque(32))), 32));
await writeFile('public/apple-touch-icon.png', await png(svg(180, 4, opaque(180))));
console.log(`Wrote the ${monogram} icons from ${grid[0].length} by ${grid.length} cells.`);
