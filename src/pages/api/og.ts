import { NextApiRequest, NextApiResponse } from 'next';

import { getScreenshot } from '../../lib/open-graph/chrome-api';
import { getHtml } from '../../lib/open-graph/html-template';

const cacheMaxAge = 60 * 60 * 24 * 365; // a year

/**
 * Most common OG image size
 */
const DefaultImageSize = {
  height: 630,
  width: 1200,
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const title = req.query.title as string;
    const html = getHtml(title);
    const file = await getScreenshot({
      html,
      width: DefaultImageSize.width,
      height: DefaultImageSize.height,
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', `image/png`);
    res.setHeader(
      'Cache-Control',
      `public, immutable, no-transform, s-maxage=${cacheMaxAge}, max-age=${cacheMaxAge}`,
    );
    res.end(file);
  } catch (e) {
    console.error(e);

    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/html');
    res.end('<h1>Error, image can not be generated!</h1>');
  }
};
