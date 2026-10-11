export type ElsewhereLink = {
  key: string;
  value: string;
  href: string;
};

export const GitHubUser = 'BartoszJarocki';
export const XUser = 'BartoszJarocki';

export const Elsewhere: ElsewhereLink[] = [
  { key: 'email', value: 'bartosz@jarocki.me', href: 'mailto:bartosz@jarocki.me' },
  { key: 'github', value: GitHubUser, href: `https://github.com/${GitHubUser}` },
  { key: 'x', value: `@${XUser}`, href: `https://x.com/${XUser}` },
  { key: 'linkedin', value: 'bjarocki', href: 'https://www.linkedin.com/in/bjarocki' },
];
