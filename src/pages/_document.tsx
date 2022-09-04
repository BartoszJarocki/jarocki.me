import Document, { Html, Head, Main, NextScript } from 'next/document';

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head />
        <body className="text-gray-800 antialiased dark:bg-gray-900 dark:text-gray-200">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
