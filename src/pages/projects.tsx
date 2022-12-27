import { NextSeo } from 'next-seo';
import Image from 'next/image';

import { Card } from '../components/Card';
import { LinkIcon } from '../components/Icons/LinkIcon';
import { PageLayout } from '../components/SimpleLayout';
import { MyProjects } from '../data/lifeApi';

const seoTitle = 'Projects | Bartosz Jarocki';
const seoDescription = "Projects I've work on, worked on and will work on";

export default function Projects() {
  return (
    <>
      <NextSeo
        title={seoTitle}
        description={seoDescription}
        canonical={`https://${process.env.NEXT_PUBLIC_VERCEL_URL}/projects`}
        openGraph={{
          images: [{ url: `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/api/og?title=${seoTitle}}` }],
        }}
      />
      <PageLayout
        title="Things I've made trying to put my dent in the universe."
        intro="I've worked on tons of little projects over the years but these are the ones that I'm most proud of."
      >
        <ul
          role="list"
          className="grid grid-cols-1 gap-x-12 gap-y-16 sm:grid-cols-2 lg:grid-cols-3"
        >
          {MyProjects.map((project) => (
            <Card as="li" key={project.title}>
              <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md shadow-zinc-800/5 ring-1 ring-zinc-900/5 dark:border dark:border-zinc-700/50 dark:bg-zinc-800 dark:ring-0">
                <Image
                  src={project.logo}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover"
                  unoptimized
                />
              </div>
              <h2 className="mt-6 text-base font-semibold text-zinc-800 dark:text-zinc-100">
                <Card.Link href={project.link.href!}>{project.title}</Card.Link>
              </h2>
              <Card.Description>{project.description}</Card.Description>
              <p className="relative z-10 mt-6 flex text-sm font-medium text-zinc-400 transition group-hover:text-primary dark:text-zinc-200">
                <LinkIcon className="h-6 w-6 flex-none" />
                <span className="ml-2">{project.link.label}</span>
              </p>
            </Card>
          ))}
        </ul>
      </PageLayout>
    </>
  );
}
