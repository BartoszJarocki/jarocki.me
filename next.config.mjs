import { withContentlayer } from 'next-contentlayer';

export default withContentlayer({
  swcMinify: true,
  reactStrictMode: true,
  experimental: {
    legacyBrowsers: false,
    browsersListForSwc: true,
    images: { allowFutureImage: true },
  },
});
