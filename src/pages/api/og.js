import { getScreenshot } from '../../lib/web';
import { getHtml } from '../../lib/_og/template';

export default async (req, res) => {
  try {
    const html = getHtml(req.query);
    const file = await getScreenshot({
      html,
      width: 1200,
      height: 630,
      isDev: !process.env.IS_PRODUCTION,
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', `image/png`);
    res.setHeader(
      'Cache-Control',
      `public, immutable, no-transform, s-maxage=31536000, max-age=31536000`,
    );
    res.end(file);
  } catch (e) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/html');
    res.end('<h1>Internal Error</h1><p>Sorry, there was a problem</p>');
    console.error(e);
  }
};
