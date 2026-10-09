export type ElsewhereLink = {
  key: string;
  value: string;
  href: string;
};

export const Elsewhere: ElsewhereLink[] = [
  { key: 'email', value: 'bartosz@jarocki.me', href: 'mailto:bartosz@jarocki.me' },
  { key: 'github', value: 'BartoszJarocki', href: 'https://github.com/BartoszJarocki' },
  { key: 'x', value: '@BartoszJarocki', href: 'https://x.com/BartoszJarocki' },
  { key: 'linkedin', value: 'bjarocki', href: 'https://www.linkedin.com/in/bjarocki' },
];
