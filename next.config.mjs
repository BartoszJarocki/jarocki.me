const config = {
  reactStrictMode: true,
  experimental: {
    scrollRestoration: true,
  },
  async redirects() {
    return [
      { source: '/index', destination: '/', permanent: true },
      { source: '/tags/:tag*', destination: '/notes', permanent: true },
      {
        source: '/blog/:slug*',
        destination: '/notes/:slug*',
        permanent: true,
      },
    ];
  },
};

export default config;
