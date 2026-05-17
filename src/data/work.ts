export type WorkEntry = {
  company: string;
  title: string;
  start: string;
  end: string;
  link?: string;
};

export const Work: WorkEntry[] = [
  {
    company: 'Motion',
    title: 'Senior Software Engineer',
    start: '2025',
    end: 'Present',
    link: 'https://motionapp.com',
  },
  {
    company: 'Film.io',
    title: 'Software Architect',
    start: '2024',
    end: '2025',
    link: 'https://film.io/',
  },
  {
    company: 'Parabol',
    title: 'Full Stack Developer',
    start: '2021',
    end: '2024',
    link: 'https://www.parabol.co/',
  },
  {
    company: 'Lumenalta',
    title: 'Lead Android Developer → Full Stack Developer',
    start: '2015',
    end: '2021',
    link: 'https://lumenalta.com/',
  },
  {
    company: 'Better Software Group',
    title: 'Android Developer → Lead Android Developer',
    start: '2012',
    end: '2015',
    link: 'https://bsgroup.eu/',
  },
  {
    company: 'Nokia Siemens Networks',
    title: 'C/C++ Developer',
    start: '2010',
    end: '2012',
  },
];
