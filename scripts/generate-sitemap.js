const fs = require('fs');
const globby = require('globby');
const prettier = require('prettier');

(async () => {
  const prettierConfig = await prettier.resolveConfig('./.prettierrc.js');

  // Ignore Next.js specific files (e.g., _app.js) and API routes.
  const pages = await globby([
    'src/pages/**/*{.tsx,.mdx}',
    'src/_posts/*',
    '!src/pages/_*.tsx',
    '!src/pages/**/[slug]{.tsx,.mdx}',
  ]);

  console.log('Generating sitemap for pages', pages);
  const sitemap = `
        <?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            ${pages
              .map((page) => {
                const path = page
                  .replace('pages', '')
                  .replace('/index', '')
                  .replace('_posts', '/blog')
                  .replace('.tsx', '')
                  .replace('.mdx', '')
                  .replace('src/', '');

                return `
                        <url>
                            <loc>https://jarocki.me${path}</loc>
                        </url>
                    `;
              })
              .join('')}
        </urlset>
    `;

  // If you're not using Prettier, you can remove this.
  const formatted = prettier.format(sitemap, {
    ...prettierConfig,
    parser: 'html',
  });

  fs.writeFileSync('public/sitemap.xml', formatted);
})();
