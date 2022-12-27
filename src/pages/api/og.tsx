/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const config = {
  runtime: 'experimental-edge',
};

const font = fetch(new URL('../../../public/assets/font/Inter.ttf', import.meta.url)).then((res) =>
  res.arrayBuffer(),
);

const generateImage = async (req: NextRequest) => {
  const fontData = await font;
  const { searchParams } = req.nextUrl;
  const title = searchParams.get('title');

  return new ImageResponse(
    (
      <main
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 32,
          backgroundColor: '#18181b',
          color: '#fff',
        }}
      >
        <img
          style={{ height: 84, width: 84, objectFit: 'cover', borderRadius: '100%' }}
          src="https://jarocki.me/assets/blog/authors/bartosz.jpeg"
          alt="Avatar"
        />
        <h1 style={{ fontSize: 32, wordWrap: 'break-word', marginTop: 32 }}>{title}</h1>
      </main>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Inter',
          data: fontData,
          style: 'normal',
        },
      ],
    },
  );
};

export default generateImage;
