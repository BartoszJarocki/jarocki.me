import BarepapersLogo from '../images/logos/barepapers.svg';
import MonitoLogo from '../images/logos/monito.svg';
import ParabolLogo from '../images/logos/parabol.svg';
import YearProgressLogo from '../images/logos/yearprogress.svg';

export const MyProjects = [
  {
    title: 'Parabol',
    techStack: ['TypeScript', 'React', 'Node.js'],
    description: 'The Agile meeting co-pilot that delivers better meetings with less effort.',
    logo: ParabolLogo,
    link: {
      label: 'github.com',
      href: 'https://github.com/ParabolInc/parabol',
    },
  },
  {
    title: 'Monito',
    techStack: ['Chrome Extension', 'Next.js', '▲Vercel'],
    description: 'Browser extension that records everything happening in a web application.',
    logo: MonitoLogo,
    link: {
      label: 'monito.dev',
      href: 'https://monito.dev',
    },
  },
  {
    title: 'Barepapers',
    techStack: ['Next.js', 'Puppeteer', '▲Vercel'],
    description: 'Generates beautiful wallpapers using random shapes and gradients.',
    logo: BarepapersLogo,
    link: {
      label: 'barepapers.com',
      href: 'https://barepapers.com',
    },
  },
  {
    title: 'Year progress',
    techStack: ['Next.js', '▲Vercel'],
    description: 'Tracks current year progress and displas a countdown.',
    logo: YearProgressLogo,
    link: {
      label: 'getyearprogress.com',
      href: 'https://getyearprogress.com',
    },
  },
  {
    title: 'Jarocki.me',
    techStack: ['Next.js', 'Puppeteer', '▲Vercel'],
    description: 'My personal website you are currently on, built with Next.js.',
    link: {
      label: 'github.com',
      href: 'https://github.com/BartoszJarocki/web-jarocki-me',
    },
  },
];
