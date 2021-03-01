import { Layout } from '../../components/layout';
import { NextSeo } from 'next-seo';
import {
  AboutMeContent,
  AboutMeSiteDescription,
  AboutMeSiteTitle,
  Blogs,
  Books,
  PeopleWorthFollowingOnTwitter,
  Podcasts,
  Quotes,
  RecommendedPodcastEpisodes,
  VideosWorthWatching,
} from '../../_data/about';
import { Navigation } from '../../components/navigation';
import { Container } from '../../components/container';
import React from 'react';
import { Title } from '../../components/title';
import { ExternalLink } from '../../components/external-link';
import { Section } from '../../components/section';
import { Quote } from '../../components/quote';

const AboutMe = () => {
  return (
    <Layout>
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
      <Navigation />
      <Container>
        <header>
          <Title>About me</Title>
          <p className="prose lg:prose-lg mt-2">{AboutMeContent}</p>
        </header>
        <Section title={'Work'}>
          <p className="prose lg:prose-lg">
            I'm a software developer with over 10 years of experience. I started as a C/C++
            developer, then transitioned to Android world and now I'm mostly focused on developing
            great user experiences using React.
            <br />
            <br />I created multiple Android applications from scratch for companies around the
            world like{' '}
            <ExternalLink href={'https://www.visionmedia.com/'}>VisionMedia</ExternalLink>,{' '}
            <ExternalLink href={'https://www.dkms.org/en'}>DKMS</ExternalLink>,{' '}
            <ExternalLink href={'https://www.aaa.com/'}>AAA</ExternalLink>,{' '}
            <ExternalLink href={'https://polskapress.pl/pl'}>PolskaPress</ExternalLink> or{' '}
            <ExternalLink href={'https://www.canaldigital.no/'}>Canal Digital</ExternalLink>. I
            helped to create/review/design mobile applications for startups like{' '}
            <ExternalLink href={'https://play.google.com/store/apps/details?id=io.bimapp'}>
              Bim
            </ExternalLink>
            , <ExternalLink href={'https://www.tastycloud.fr'}>Tastycloud</ExternalLink>,{' '}
            <ExternalLink href={'https://play.google.com/store/apps/details?id=com.howdyhub.howdy'}>
              Howdy
            </ExternalLink>{' '}
            and{' '}
            <ExternalLink
              href={'https://play.google.com/store/apps/details?id=com.vikingco.vikingapp.poland'}
            >
              Mobile Vikings
            </ExternalLink>
            . I developed a WebRTC powered video conferencing frontend application using
            React.js/GraphQL/Typescript for{' '}
            <ExternalLink href={'https://www.evercast.us'}>Evercast</ExternalLink>. I also had led
            development teams many times. If you'd like to work with me{' '}
            <ExternalLink href="https://twitter.com/messages/compose?recipient_id=512460212">
              DM me on Twitter
            </ExternalLink>{' '}
            or just <ExternalLink href="mailto:bartosz.jarocki@icloud.com">email me.</ExternalLink>
          </p>
        </Section>
        <Section title={'Books'}>
          <div className="prose lg:prose-lg">
            Books I think are must-read or I simply enjoyed a lot
            <ul className="mt-1">
              {Books.map((book) => (
                <li key={book.name}>
                  <ExternalLink href={book.link}>{book.name}</ExternalLink>
                </li>
              ))}
            </ul>
          </div>
        </Section>
        <Section title={'Videos'}>
          <div className="prose lg:prose-lg">
            Random videos I think are worth watching
            <ul className="mt-1">
              {VideosWorthWatching.map((video) => (
                <li key={video.name}>
                  <ExternalLink href={video.link}>{video.name}</ExternalLink>
                </li>
              ))}
            </ul>
          </div>
        </Section>
        <Section title={'Podcasts'}>
          <div className="prose lg:prose-lg">
            Podcasts I think are worth listening to
            <ul className="mt-1">
              {Podcasts.map((podcast) => (
                <li key={podcast.name}>
                  <ExternalLink href={podcast.link}>{podcast.name}</ExternalLink>
                </li>
              ))}
            </ul>
            <p className="mt-4">Episodes I'd recommend the most</p>
            <ul className="mt-1">
              {RecommendedPodcastEpisodes.map((episode) => (
                <li key={episode.name}>
                  <ExternalLink href={episode.link}>{episode.name}</ExternalLink>
                </li>
              ))}
            </ul>
          </div>
        </Section>
        <Section title={'Blogs'}>
          <div className="prose lg:prose-lg">
            Blogs I read
            <ul className="mt-1">
              {Blogs.map((blog) => (
                <li key={blog.name}>
                  <ExternalLink href={blog.link}>{blog.name}</ExternalLink>
                </li>
              ))}
            </ul>
          </div>
        </Section>
        <Section title={'People'}>
          <div className="prose lg:prose-lg">
            People I think are worth following on Twitter:{' '}
            {PeopleWorthFollowingOnTwitter.map<React.ReactNode>((personOnTwitter) => (
              <ExternalLink key={personOnTwitter.name} href={personOnTwitter.link}>
                {personOnTwitter.name}
              </ExternalLink>
            )).reduce((prev, curr) => [prev, ', ', curr])}
            .
          </div>
        </Section>
        <Section title={'Quotes'}>
          <div className="prose lg:prose-lg">
            Random quotes I found inspirational and meaningful
            {Quotes.map((quote, index) => (
              <Quote key={index} quote={quote.content} author={quote.author} />
            ))}
          </div>
        </Section>
      </Container>
    </Layout>
  );
};

export default AboutMe;
