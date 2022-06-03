import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';

import { renderScreenshot as renderImage } from '../../lib/open-graph/chrome-api';
import { renderHTML } from '../../lib/open-graph/html-template';

const cacheMaxAge = 60 * 60 * 24 * 365; // a year

/**
 * Most common OG image size
 */
const DefaultImageSize = {
  height: 630,
  width: 1200,
};

const generateImage = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const title = req.query.title as string;
    const html = renderHTML({
      title,
    });

    const ogImage = await renderImage({
      html,
      width: DefaultImageSize.width,
      height: DefaultImageSize.height,
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', `image/png`);
    res.setHeader(
      'Cache-Control',
      `public, immutable, no-transform, s-maxage=${cacheMaxAge}, max-age=${cacheMaxAge}, stale-while-revalidate`,
    );
    res.end(ogImage);
  } catch (e) {
    console.error(e);

    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/html');
    res.end('<h1>Error, image can not be generated!</h1>');
  }
};

export default generateImage;
