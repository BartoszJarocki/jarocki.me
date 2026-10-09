export type ElsewhereLink = {
  key: string;
  value: string;
  href: string;
};

export const GitHubUser = 'BartoszJarocki';

export const Elsewhere: ElsewhereLink[] = [
  { key: 'email', value: 'bartosz@jarocki.me', href: 'mailto:bartosz@jarocki.me' },
  { key: 'github', value: GitHubUser, href: `https://github.com/${GitHubUser}` },
  { key: 'x', value: '@BartoszJarocki', href: 'https://x.com/BartoszJarocki' },
  { key: 'linkedin', value: 'bjarocki', href: 'https://www.linkedin.com/in/bjarocki' },
];
