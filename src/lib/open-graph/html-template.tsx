/* eslint-disable @next/next/no-img-element */
/* eslint-disable @next/next/no-page-custom-font */
/* eslint-disable @next/next/no-head-element */
import * as ReactDOMServer from 'react-dom/server';
import { PropsWithChildren } from 'src/@types/react';

export const backgroundColor = `#1e2020`;
export const color = `#fff`;
export const spacing = 16;
export const maxWidth = 600;
export const h1fontSize = 40;
export const h2fontSize = 20;
export const fontSize = 16;

const styleReset = `
  /**
   * Avoid browser level font resizing.
   * 1. Windows Mobile
   * 2. iOS / OSX
   */
  body,
  table,
  td,
  a {
      -ms-text-size-adjust: 100%; /* 1 */
      -webkit-text-size-adjust: 100%; /* 2 */
  }

  /**
   * Remove extra space added to tables and cells in Outlook.
   */
  table,
  td {
      mso-table-rspace: 0pt;
      mso-table-lspace: 0pt;
  }

  /**
   * Remove blue links for iOS devices.
   */
  a[x-apple-data-detectors] {
      font-family: inherit ;
      font-size: inherit ;
      font-weight: inherit ;
      line-height: inherit ;
      color: inherit ;
      text-decoration: none ;
  }

  body {
      width: 100%;
      height: 100%;
  }

  /**
   * Collapse table borders to avoid space between cells.
   */
  table {
      border-collapse: collapse ;
  }

  a {
      color: #5634d1;
  }

  img {
      height: auto;
      line-height: 100%;
      text-decoration: none;
      border: 0;
      outline: none;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  p,
  i,
  b,
  a,
  ul,
  li,
  blockquote,
  hr,
  img,
  div,
  span,
  strong {
      line-height: 1.2;
      margin:0;
      padding:0;
  }
`;

export const Html: React.FC<PropsWithChildren & { lang: string }> = ({ lang, children }) => {
  return <html lang={lang}>{children}</html>;
};

export const Head: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="x-apple-disable-message-reformatting" />
      <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
      <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
      <meta name="color-scheme" content="light" />
      <meta name="supported-color-schemes" content="light" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style dangerouslySetInnerHTML={{ __html: styleReset }} />
      {children}
    </head>
  );
};

export const Body: React.FC<PropsWithChildren> = ({ children, ...rest }) => {
  return (
    <body
      style={{
        backgroundColor,
        color,
        padding: 0,
        margin: 0,
        fontSize,
        fontFamily: `'Inter', sans-serif`,
        width: '100vw',
        height: '100vh',
      }}
      {...rest}
    >
      {children}
    </body>
  );
};

export const Space = ({ size = 1 }: { size?: number }) => {
  return <div style={{ height: size * spacing }} />;
};

export function renderHTML({ title }: { title: string }) {
  return ReactDOMServer.renderToStaticMarkup(
    <Html lang="en">
      <Head />
      <Body>
        <main
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'end',
            alignItems: 'start',
            padding: spacing * 2,
          }}
        >
          <h1 style={{ fontSize: h1fontSize, wordWrap: 'break-word', fontWeight: 700 }}>{title}</h1>
          <Space size={0.5} />
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img
              style={{ height: 36, width: 36, objectFit: 'cover', borderRadius: '100%' }}
              src="https://jarocki.me/assets/blog/authors/bartosz.jpeg"
              alt="Avatar"
            />
            <h2 style={{ fontSize: h2fontSize, marginLeft: spacing, fontWeight: 400 }}>
              Bartosz Jarocki
            </h2>
          </div>
          <Space size={4} />
        </main>
      </Body>
    </Html>,
  );
}
