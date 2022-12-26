import { GitHubIcon } from '../components/Icons/GitHubIcon';
import { InstagramIcon } from '../components/Icons/InstagramIcon';
import { TwitterIcon } from '../components/Icons/TwitterIcon';
import BarepapersLogo from '../images/logos/barepapers.svg';
import logoClevertech from '../images/logos/clevertech.png';
import JarockiMeLogo from '../images/logos/jarocki.svg';
import logoJojoMobile from '../images/logos/jojomobile.png';
import MonitoLogo from '../images/logos/monito.svg';
import logoNsn from '../images/logos/nsn.svg';
import logoParabol from '../images/logos/parabol.svg';
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
    logo: JarockiMeLogo,
    link: {
      label: 'github.com',
      href: 'https://github.com/BartoszJarocki/web-jarocki-me',
    },
  },
];

export const SocialMedia = [
  { name: 'Twitter', link: 'https://twitter.com/BartoszJarocki', icon: TwitterIcon },
  { name: 'Instagram', link: 'https://www.instagram.com/bartosz.jarocki/', icon: InstagramIcon },
  { name: 'Github', link: 'https://github.com/BartoszJarocki', icon: GitHubIcon },
];

export const Work = [
  {
    company: 'Parabol',
    title: 'Full Stack Developer',
    logo: logoParabol,
    start: '2021',
    end: 'Present',
  } as const,
  {
    company: 'Clevertech',
    title: 'Lead Android Developer → Full Stack Developer',
    logo: logoClevertech,
    start: '2015',
    end: '2021',
  },
  {
    company: 'Jojo Mobile',
    title: 'Android Developer → Lead Android Developer',
    logo: logoJojoMobile,
    start: '2012',
    end: '2015',
  },
  {
    company: 'Nokia Siemens Networks',
    title: 'C/C++ Developer',
    logo: logoNsn,
    start: '2010',
    end: '2012',
  },
];

export const CompaniesLinks = [
  {
    name: 'VisionMedia',
    link: 'https://www.visionmedia.com/',
  },
  {
    name: 'DKMS',
    link: 'https://www.dkms.org/en',
  },
  {
    name: 'AAA',
    link: 'https://www.aaa.com/',
  },
  {
    name: 'PolskaPress',
    link: 'https://polskapress.pl/pl',
  },
  {
    name: 'Canal Digital',
    link: 'https://www.canaldigital.no/',
  },
];

export const Books = [
  {
    name: 'Shoe Dog: A Memoir by the Creator of Nike by Phil Knight',
    link: 'https://www.amazon.com/Shoe-Dog-Memoir-Creator-Nike-ebook/dp/B0176M1A44',
  },
  {
    name: 'The Black Swan: The Impact of the Highly Improbable by Nassim Nicholas Taleb',
    link: 'https://amzn.to/2NwihaS',
  },
  {
    name: 'Antifragile: Things That Gain from Disorder by Nassim Nicholas Taleb',
    link: 'https://amzn.to/3aIG805',
  },
  {
    name: 'Fooled by Randomness: The Hidden Role of Chance in Life and in the Markets by Nassim Nicholas Taleb',
    link: 'https://amzn.to/3kbvaD9',
  },
  {
    name: 'Daily stoic by Ryan Holiday',
    link: 'https://amzn.to/3n8ATuC',
  },
  {
    name: 'A Guide to the Good Life: The Ancient Art of Stoic Joy by William B. Irvine',
    link: 'https://amzn.to/3iuL1ud',
  },
  {
    name: 'Atomic Habits by James Clear',
    link: 'https://amzn.to/3iqimpZ',
  },
];

export const VideosWorthWatching = [
  {
    name: 'Steve Jobs 2005 Stanford Commencement Address',
    link: 'https://www.youtube.com/watch?v=UF8uR6Z6KLc',
  },
  {
    name: 'Falcon Heavy & Starman',
    link: 'https://www.youtube.com/watch?v=A0FZIwabctw',
  },
];

export const Podcasts = [
  {
    name: 'Lex Fridman Podcast',
    link: 'https://www.youtube.com/@lexfridman',
  },
  {
    name: 'Huberman Lab',
    link: 'https://www.youtube.com/@hubermanlab',
  },
  {
    name: 'Joe Rogan',
    link: 'https://www.youtube.com/@joerogan',
  },
  {
    name: 'The Tim Ferriss Show',
    link: 'https://www.youtube.com/channel/UCznv7Vf9nBdJYvBagFdAHWw',
  },
  {
    name: 'Build your SaaS',
    link: 'https://saas.transistor.fm/',
  },
];

export const PeopleWorthFollowingOnTwitter = [
  {
    name: 'Andrew Wilkinson',
    link: 'https://twitter.com/awilkinson',
  },
  {
    name: 'Oliur',
    link: 'https://twitter.com/UltraLinx',
  },
  {
    name: 'Jack Butcher',
    link: 'https://twitter.com/jackbutcher',
  },
  {
    name: 'Sahil Lavingia',
    link: 'https://twitter.com/shl',
  },
  {
    name: 'James Clear',
    link: 'https://twitter.com/JamesClear',
  },
  {
    name: 'Naval',
    link: 'https://twitter.com/naval',
  },
  {
    name: 'Paul Graham',
    link: 'https://twitter.com/paulg',
  },
  {
    name: "John O'Nolan",
    link: 'https://twitter.com/JohnONolan',
  },
  {
    name: 'Jon Yongfook',
    link: 'https://twitter.com/yongfook',
  },
  {
    name: 'Joel Gascoigne',
    link: 'https://twitter.com/joelgascoigne',
  },
  {
    name: 'Pieter Levels',
    link: 'https://twitter.com/levelsio',
  },
];

export const Blogs = [
  {
    name: 'Wait but why',
    link: 'https://waitbutwhy.com/',
  },
  {
    name: 'Paul Graham',
    link: 'http://www.paulgraham.com/',
  },
  {
    name: 'Joel Hooks',
    link: 'https://joelhooks.com',
  },
  {
    name: 'David Perell',
    link: 'https://www.perell.com/',
  },
  {
    name: 'Dan Abramov',
    link: 'https://overreacted.io',
  },
  {
    name: 'Lee Robinson',
    link: 'https://leerob.io',
  },
  {
    name: 'Naval Ravikant',
    link: 'https://nav.al/',
  },
];

export const Quotes = [
  {
    content: 'We have two lives, and the second begins when we realize we only have one.',
    author: '― Confucius',
  },
  {
    content: 'The man who moves a mountain begins by carrying away small stones.',
    author: '― Confucius',
  },
  {
    content:
      'The man who asks a question is a fool for a minute, the man who does not ask is a fool for life.',
    author: '― Confucius',
  },
  {
    content:
      "Twenty years from now you will be more disappointed by the things that you didn't do than by the ones you did so. So throw off the bowlines. Sail away from the safe harbor. Catch the trade winds in your sails. Explore. Dream. Discover.",
    author: '― Mark Twain',
  },
  {
    content:
      "You have no responsibility to live up to what other people think you ought to accomplish. I have no responsibility to be like they expect me to be. It's their mistake, not my failing.",
    author: '― Mark Twain',
  },
  {
    content:
      'Watch your thoughts, they become your words; watch your words, they become your actions; watch your actions, they become your habits; watch your habits, they become your character; watch your character, it becomes your destiny.',
    author: '― Laozi',
  },
  {
    content: 'If you are going through hell, keep going.',
    author: '― Winston S. Churchill',
  },
  {
    content: 'Attitude is a little thing that makes a big difference.',
    author: '― Winston S. Churchill',
  },
  {
    content:
      'To think is easy. To act is hard. But the hardest thing in the world is to act in accordance with your thinking.',
    author: '― Johann Wolfgang von Goethe',
  },
  {
    content: 'It is not death that a man should fear, but he should fear never beginning to live.',
    author: '― Marcus Aurelius',
  },
  {
    content: 'If it is not right do not do it; if it is not true do not say it.',
    author: '― Marcus Aurelius',
  },
  {
    content:
      'You have power over your mind - not outside events. Realize this, and you will find strength.',
    author: '― Marcus Aurelius',
  },
  {
    content: 'The happiness of your life depends upon the quality of your thoughts.',
    author: '― Marcus Aurelius',
  },
  {
    content:
      'If you are distressed by anything external, the pain is not due to the thing itself, but to your estimate of it; and this you have the power to revoke at any moment.',
    author: '― Marcus Aurelius',
  },
  {
    content: 'There is no easy way from the earth to the stars',
    author: '― Seneca',
  },
  {
    content: 'We suffer more often in imagination than in reality',
    author: '― Seneca',
  },
];
