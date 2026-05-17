export type Project = {
  title: string;
  description: string;
  href?: string;
};

export const SideProjects: Project[] = [
  {
    title: 'monito',
    href: 'https://monito.dev',
    description: 'AI QA engineer',
  },
  {
    title: '43frames',
    href: 'https://43frames.com',
    description: 'AI photo / video studio',
  },
  {
    title: 'minimal',
    href: 'https://useminimal.com',
    description: 'minimalist calendars for lifetime',
  },
  {
    title: 'tzc',
    href: 'https://tzc.app',
    description: 'timezone converter',
  },
];

export const PastProjects: Project[] = [
  {
    title: 'Parabol',
    description: 'The Agile meeting co-pilot that delivers better meetings with less effort.',
    href: 'https://github.com/ParabolInc/parabol',
  },
  {
    title: 'Evercast',
    description:
      'Creative collaboration platform that combines video conferencing and HD media streaming.',
    href: 'https://www.evercast.us/',
  },
  {
    title: 'Mobile Vikings',
    description: 'Android application for leading virtual mobile operator in Poland.',
    href: 'https://mobilevikings.pl/',
  },
  {
    title: 'Howdy',
    description: 'Howdy is a place for you to join communities you care about.',
    href: 'https://play.google.com/store/apps/details?id=com.howdyhub.howdy',
  },
  {
    title: 'Tastycloud',
    description: 'Android application for managing and displaying restaurant menus in kiosk mode.',
    href: 'https://www.tastycloud.fr/',
  },
  {
    title: 'Ambit',
    description: 'Android application that helps with sharing your contact details.',
  },
  {
    title: 'Bim',
    description: 'Android application that helps with booking a table in restaurants.',
  },
  {
    title: 'Canal Digital GO',
    description: 'Video streaming mobile application for Canal Digital subscribers.',
  },
];
