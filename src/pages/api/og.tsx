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
  const description = searchParams.get('description');

  return new ImageResponse(
    (
      <main tw="h-full w-full bg-[#FB2576] pb-1 flex flex-col">
        <div tw="w-full h-full flex flex-col items-start justify-start bg-zinc-900 text-zinc-100 p-8">
          <div tw="self-end text-2xl text-zinc-500">jarocki.me</div>
          <div tw="w-full mt-auto flex items-start justify-start">
            <div tw="flex flex-col mt-auto max-w-2xl">
              <h1 tw="text-5xl mt-auto">{title}</h1>
              {description && <h2 tw="text-2xl text-zinc-200">{description}</h2>}
            </div>
            <img
              tw="rounded-lg w-32 h-32 self-end ml-auto"
              src="https://jarocki.me/assets/blog/authors/bartosz.jpeg"
              alt="Avatar"
            />
          </div>
        </div>
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
