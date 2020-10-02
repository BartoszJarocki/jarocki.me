import { Layout } from '../../components/layout';
import { NextSeo } from 'next-seo';
import { AboutMeSiteDescription, AboutMeSiteTitle } from '../../_data/about';
import { Navigation } from '../../components/navigation';
import { Container } from '../../components/container';
import React from 'react';
import { Title } from '../../components/title';
import { ExternalLink } from '../../components/external-link';
import { Section } from '../../components/section';

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
          <p className="text-base text-gray-700 mt-2">
            Hey! I'm Bartosz Jarocki and I live in Wrocław, Poland. I grew up in small town Góra. I
            graduated with a bachelor's degree in Control systems engineering and Robotics on
            Wrocław University of Technology. I like bikes, books, plants, programming and exploring
            the world with my wonderful wife Kasia. Also, I’m fascinated by the cosmos and I find
            great pleasure in watching stars.
          </p>
        </header>
        <Section title={'Work'}>
          <p className="text-base text-gray-700">
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
          Books I think are must read
          <ul className="list-disc mt-1">
            <li>
              <ExternalLink
                href={
                  'https://www.amazon.com/Daily-Stoic-Meditations-Wisdom-Perseverance/dp/0735211736'
                }
              >
                Daily stoic by Ryan Holiday
              </ExternalLink>
            </li>
            <li>
              <ExternalLink
                href={'https://www.amazon.com/Guide-Good-Life-Ancient-Stoic-ebook/dp/B0040JHNQG'}
              >
                A Guide to the Good Life: The Ancient Art of Stoic Joy by William B. Irvine
              </ExternalLink>
            </li>
          </ul>
        </Section>
        <Section title={'Videos'}>
          Videos I think are worth watching
          <ul className="list-disc mt-1">
            <li>
              <ExternalLink href={'https://www.youtube.com/watch?v=UF8uR6Z6KLc'}>
                Steve Jobs' 2005 Stanford Commencement Address
              </ExternalLink>
            </li>
            <li>
              <ExternalLink href={'https://www.youtube.com/watch?v=A0FZIwabctw'}>
                Falcon Heavy & Starman
              </ExternalLink>
            </li>
          </ul>
        </Section>
        <Section title={'Podcasts'}>
          Podcasts I think are worth listening to
          <ul className="list-disc mt-1">
            <li>
              <ExternalLink href={'https://www.youtube.com/channel/UCzQUP1qoWDoEbmsQxvdjxgQ'}>
                Joe Rogan
              </ExternalLink>
            </li>
            <li>
              <ExternalLink href={'https://www.youtube.com/channel/UCznv7Vf9nBdJYvBagFdAHWw'}>
                The Tim Ferriss Show
              </ExternalLink>
            </li>
            <li>
              <ExternalLink href={'https://saas.transistor.fm/'}>Build your SaaS</ExternalLink>
            </li>
          </ul>
          <p className="mt-4">Episodes I'd recommend the most</p>
          <ul className="list-disc mt-1">
            <li>
              <ExternalLink href={'https://www.youtube.com/watch?v=3qHkcs3kG44'}>
                Joe Rogan Experience #1309 - Naval Ravikant
              </ExternalLink>
            </li>
            <li>
              <ExternalLink href={'https://www.youtube.com/watch?v=ycPr5-27vSI'}>
                Joe Rogan Experience #1169 - Elon Musk
              </ExternalLink>
            </li>
            <li>
              <ExternalLink href={'https://www.youtube.com/watch?v=-7J-Gwc9pVg&t'}>
                The Tim Ferriss Show - Naval Ravikant
              </ExternalLink>
            </li>
          </ul>
        </Section>
        <Section title={'Blogs'}>
          Blogs I read
          <ul className="list-disc mt-1">
            <li>
              <ExternalLink href={'https://waitbutwhy.com/'}>Wait but why</ExternalLink>
            </li>
            <li>
              <ExternalLink href={'http://www.paulgraham.com/'}>Paul Graham</ExternalLink>
            </li>
            <li>
              <ExternalLink href={'https://joelhooks.com'}>Joel Hooks</ExternalLink>
            </li>
            <li>
              <ExternalLink href={'https://www.perell.com/'}>David Perell</ExternalLink>
            </li>
            <li>
              <ExternalLink href={'https://overreacted.io'}>Dan Abramov</ExternalLink>
            </li>
            <li>
              <ExternalLink href={'https://leerob.io'}>Lee Robinson</ExternalLink>
            </li>
            <li>
              <ExternalLink href={'https://nav.al/'}>Naval Ravikant</ExternalLink>
            </li>
          </ul>
        </Section>
        <Section title={'People'}>
          People I think are worth following on Twitter:{' '}
          <ExternalLink href={'https://twitter.com/awilkinson'}>Andrew Wilkinson</ExternalLink>
          {', '}
          <ExternalLink href={'https://twitter.com/UltraLinx'}>Oliur</ExternalLink>
          {', '}
          <ExternalLink href={'https://twitter.com/jackbutcher'}>Jack Butcher</ExternalLink>
          {', '}
          <ExternalLink href={'https://twitter.com/shl'}>Sahil Lavingia</ExternalLink>
          {', '}
          <ExternalLink href={'https://twitter.com/JamesClear'}>James Clear</ExternalLink>
          {', '}
          <ExternalLink href={'https://twitter.com/naval'}>Naval</ExternalLink>
          {', '}
          <ExternalLink href={'https://twitter.com/paulg'}>Paul Graham</ExternalLink>
          {', '}
          <ExternalLink href={'https://twitter.com/JohnONolan'}>John O'Nolan</ExternalLink>
          {', '}
          <ExternalLink href={'https://twitter.com/yongfook'}>Jon Yongfook</ExternalLink>
          {', '}
          <ExternalLink href={'https://twitter.com/joelgascoigne'}>Joel Gascoigne</ExternalLink>
          {', '}
          <ExternalLink href={'https://twitter.com/levelsio'}>Pieter Levels</ExternalLink>
        </Section>
      </Container>
    </Layout>
  );
};

export default AboutMe;
