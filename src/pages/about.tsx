import { NextSeo } from 'next-seo';
import Image from 'next/image';
import {
  AboutMeContent,
  AboutMeSiteDescription,
  AboutMeSiteTitle,
  Blogs,
  Books,
  PeopleWorthFollowingOnTwitter,
  Podcasts,
  Quotes,
  VideosWorthWatching,
} from '../data/about';
import AvatarImage from '../../public/assets/blog/authors/bartosz.jpeg';
import { Container } from '../components/Container';
import React, { useEffect, useState } from 'react';
import { PageTitle } from '../components/PageTitle';
import { Section } from '../components/Section';
import { Quote } from '../components/Quote';
import { MailIcon } from '@heroicons/react/outline';
import { GitHubIcon } from '../components/Icons/GitHubIcon';
import { InstagramIcon } from '../components/Icons/InstagramIcon';
import { SocialLink } from '../components/SocialLink';
import { ExternalLink } from '../components/ExternalLink';
import { TwitterIcon } from '../components/Icons/TwitterIcon';

const AboutMe = () => {
  const [randomQuote, setRandomQuote] = useState<{ author: string; content: string }>();

  useEffect(() => {
    setRandomQuote(Quotes[Math.floor(Math.random() * Quotes.length)]);
  }, []);

  return (
    <>
      <NextSeo
        title={AboutMeSiteTitle}
        description={AboutMeSiteDescription}
        canonical={process.env.NEXT_PUBLIC_SITE_URL}
        openGraph={{
          url: process.env.NEXT_PUBLIC_SITE_URL,
          title: AboutMeSiteTitle,
          description: AboutMeSiteDescription,
          images: [{ url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/og?title=${AboutMeSiteTitle}` }],
          site_name: AboutMeSiteTitle,
        }}
      />
      <Container className="mt-16 sm:mt-32">
        <div className="grid grid-cols-1 gap-y-16 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:gap-y-12">
          <div className="lg:pl-20">
            <div className="max-w-xs px-2.5 lg:max-w-none">
              <Image
                src={AvatarImage}
                alt=""
                sizes="(min-width: 1024px) 32rem, 20rem"
                className="aspect-square rotate-3 rounded-2xl bg-zinc-100 object-cover dark:bg-zinc-800"
              />
            </div>
          </div>
          <div className="lg:order-first lg:row-span-2">
            <PageTitle>Hi, I&apos;m Bartosz Jarocki.</PageTitle>
            <div className="mt-6 space-y-7 text-base text-zinc-600 dark:text-zinc-400">
              {AboutMeContent}
            </div>

            <Section>
              <Section.Title as="h2">Work</Section.Title>
              <Section.Content>
                I&apos;m a software developer with over 10 years of experience. I started as a C/C++
                developer, then transitioned to Android world and now I&apos;m mostly focused on
                developing great user experiences using React.
                <br />
                <br />I created multiple Android applications from scratch for companies around the
                world like <a href={'https://www.visionmedia.com/'}>VisionMedia</a>,{' '}
                <a href={'https://www.dkms.org/en'}>DKMS</a>,{' '}
                <ExternalLink href={'https://www.aaa.com/'}>AAA</ExternalLink>,{' '}
                <ExternalLink href={'https://polskapress.pl/pl'}>PolskaPress</ExternalLink> or{' '}
                <ExternalLink href={'https://www.canaldigital.no/'}>Canal Digital</ExternalLink>. I
                helped to create/review/design mobile applications for startups like{' '}
                <ExternalLink href={'https://play.google.com/store/apps/details?id=io.bimapp'}>
                  Bim
                </ExternalLink>
                , <ExternalLink href={'https://www.tastycloud.fr'}>Tastycloud</ExternalLink>,{' '}
                <ExternalLink
                  href={'https://play.google.com/store/apps/details?id=com.howdyhub.howdy'}
                >
                  Howdy
                </ExternalLink>{' '}
                and{' '}
                <ExternalLink
                  href={
                    'https://play.google.com/store/apps/details?id=com.vikingco.vikingapp.poland'
                  }
                >
                  Mobile Vikings
                </ExternalLink>
                . I developed a WebRTC powered video conferencing frontend application using
                React.js/GraphQL/Typescript for{' '}
                <ExternalLink href={'https://www.evercast.us'}>Evercast</ExternalLink>. I also had
                led development teams many times. If you&apos;d like to work with me{' '}
                <ExternalLink href="https://twitter.com/messages/compose?recipient_id=512460212">
                  DM me on Twitter
                </ExternalLink>{' '}
                or just{' '}
                <ExternalLink href="mailto:bartosz.jarocki@icloud.com">email me.</ExternalLink>
              </Section.Content>
            </Section>
            <Section>
              <Section.Title as="h2">Books worth re-reading</Section.Title>
              <Section.Content>
                <ul className="mt-1 list-disc">
                  {Books.map((book) => (
                    <li key={book.name}>
                      <ExternalLink href={book.link}>{book.name}</ExternalLink>
                    </li>
                  ))}
                </ul>
              </Section.Content>
            </Section>
            <Section>
              <Section.Title as="h2">Podcasts I listen to</Section.Title>
              <Section.Content>
                <ul className="mt-1 list-disc">
                  {Podcasts.map((podcast) => (
                    <li key={podcast.name}>
                      <ExternalLink href={podcast.link}>{podcast.name}</ExternalLink>
                    </li>
                  ))}
                </ul>
              </Section.Content>
            </Section>
            <Section>
              <Section.Title as="h2">Blogs I read</Section.Title>
              <Section.Content>
                <ul className="mt-1 list-disc">
                  {Blogs.map((blog) => (
                    <li key={blog.name}>
                      <ExternalLink href={blog.link}>{blog.name}</ExternalLink>
                    </li>
                  ))}
                </ul>
              </Section.Content>
            </Section>
            <Section>
              <Section.Title as="h2">Videos worth watching</Section.Title>
              <Section.Content>
                <ul className="mt-1 list-disc">
                  {VideosWorthWatching.map((video) => (
                    <li key={video.name}>
                      <ExternalLink href={video.link}>{video.name}</ExternalLink>
                    </li>
                  ))}
                </ul>
              </Section.Content>
            </Section>
            <Section>
              <Section.Title as="h2">People with unique perspective I follow</Section.Title>
              <Section.Content>
                {PeopleWorthFollowingOnTwitter.map<React.ReactNode>((personOnTwitter) => (
                  <ExternalLink key={personOnTwitter.name} href={personOnTwitter.link}>
                    {personOnTwitter.name}
                  </ExternalLink>
                )).reduce((prev, curr) => [prev, ', ', curr])}
                .
              </Section.Content>
            </Section>
            {randomQuote && (
              <Section>
                <Section.Title as="h2">Quote worth thinking about</Section.Title>
                <Section.Content>
                  <div className="mt-8 space-y-8 px-4">
                    <Quote quote={randomQuote.content} author={randomQuote.author} />
                  </div>
                </Section.Content>
              </Section>
            )}
          </div>
          <div className="lg:pl-20">
            <ul role="list">
              <SocialLink href="#" icon={TwitterIcon}>
                Follow on Twitter
              </SocialLink>
              <SocialLink href="#" icon={InstagramIcon} className="mt-4">
                Follow on Instagram
              </SocialLink>
              <SocialLink href="#" icon={GitHubIcon} className="mt-4">
                Follow on GitHub
              </SocialLink>
              <SocialLink
                href="mailto:bartosz@jarocki.me"
                icon={MailIcon}
                className="mt-8 border-t border-zinc-100 pt-8 dark:border-zinc-700/40"
              >
                bartosz@jarocki.me
              </SocialLink>
            </ul>
          </div>
        </div>
      </Container>
    </>
  );
};

export default AboutMe;
