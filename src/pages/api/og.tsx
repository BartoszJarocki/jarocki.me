import { NextApiRequest, NextApiResponse } from 'next';
import { ImageResponse } from 'next/og';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { Name, SiteUrl } from '../../data/bio';

// The light tokens from src/styles/index.css in sRGB, because Satori cannot parse oklch.
const colors = { bg: '#fafaf8', ink: '#1a1815', body: '#4a4744', faint: '#716e6c' };

const font = (file: string) => readFileSync(path.join(process.cwd(), 'src/fonts', file));

const fonts = [
  { name: 'Geist Pixel Square', data: font('GeistPixel-Square.ttf'), weight: 500 },
  { name: 'Geist', data: font('Geist-SemiBold.ttf'), weight: 600 },
  { name: 'Geist Mono', data: font('GeistMono-Regular.ttf'), weight: 400 },
] as const;

function param(value: string | string[] | undefined, max: number) {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

export default async function og(req: NextApiRequest, res: NextApiResponse) {
  const title = param(req.query.title, 200);
  const description = param(req.query.description, 300);

  const image = new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: 80,
        background: colors.bg,
        color: colors.ink,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ fontFamily: 'Geist Pixel Square', fontSize: 44, lineHeight: 1 }}>{Name}</div>
        <div style={{ fontFamily: 'Geist Mono', fontSize: 28, lineHeight: 1, color: colors.faint }}>
          {new URL(SiteUrl).host}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {title && (
          <div
            style={{
              display: 'block',
              lineClamp: 3,
              wordBreak: 'break-word',
              fontFamily: 'Geist',
              fontSize: 64,
              lineHeight: 1.1,
              letterSpacing: '-0.028em',
            }}
          >
            {title}
          </div>
        )}
        {description && (
          <div
            style={{
              display: 'block',
              lineClamp: 3,
              wordBreak: 'break-word',
              fontFamily: 'Geist Mono',
              fontSize: 28,
              lineHeight: 1.45,
              color: colors.body,
            }}
          >
            {description}
          </div>
        )}
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [...fonts],
      // next/og marks the image immutable for a year, but a restyle keeps the same URL.
      headers: { 'cache-control': 'public, max-age=86400, stale-while-revalidate=604800' },
    },
  );

  const png = Buffer.from(await image.arrayBuffer());
  res.writeHead(image.status, Object.fromEntries(image.headers));
  res.end(png);
}
