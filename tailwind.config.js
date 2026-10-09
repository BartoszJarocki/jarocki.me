module.exports = {
  content: ['./src/**/*.{tsx,jsx,ts,js}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'var(--font-geist-sans)',
          'ui-sans-serif',
          'system-ui',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'var(--font-geist-mono)',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Consolas',
          'monospace',
        ],
        pixel: [
          'var(--font-geist-pixel-square)',
          'var(--font-geist-mono)',
          'ui-monospace',
          'monospace',
        ],
      },
      keyframes: {
        blink: { '50%': { opacity: '0.15' } },
      },
      animation: {
        blink: 'blink 2s steps(1) infinite',
      },
      colors: {
        bg: 'var(--bg)',
        ink: 'var(--ink)',
        body: 'var(--body)',
        faint: 'var(--faint)',
        rule: 'var(--rule)',
        wash: 'var(--wash)',
      },
    },
  },
};
