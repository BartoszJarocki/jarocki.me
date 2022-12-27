import { NextSeo } from 'next-seo';
import { useId } from 'react';

import { Card } from '../components/Card';
import { PageLayout } from '../components/SimpleLayout';

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  let id = useId();

  return (
    <section
      aria-labelledby={id}
      className="md:border-l md:border-zinc-100 md:pl-6 md:dark:border-zinc-700/40"
    >
      <div className="grid max-w-3xl grid-cols-1 items-baseline gap-y-8 md:grid-cols-4">
        <h2 id={id} className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          {title}
        </h2>
        <div className="md:col-span-3">{children}</div>
      </div>
    </section>
  );
}

function ToolsSection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <Section title={title}>
      <ul role="list" className="space-y-16">
        {children}
      </ul>
    </Section>
  );
}

function Tool({
  title,
  href,
  children,
}: {
  title: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <Card as="li">
      <Card.Title as="h3" href={href}>
        {title}
      </Card.Title>
      <Card.Description>{children}</Card.Description>
    </Card>
  );
}

const seoTitle = 'Uses | Bartosz Jarocki';
const seoDescription = 'Software I use, gadgets I love, and other things I recommend.';

export default function Uses() {
  return (
    <>
      <NextSeo
        title={seoTitle}
        description={seoDescription}
        canonical={`https://${process.env.NEXT_PUBLIC_VERCEL_URL}/uses`}
        openGraph={{
          images: [{ url: `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/api/og?title=${seoTitle}}` }],
        }}
      />
      <PageLayout
        title="Software I use, gadgets I love, and other things I recommend."
        intro="Here's a big list of all of my favorite stuff."
      >
        <div className="space-y-20">
          <ToolsSection title="Workstation">
            <Tool title="14” MacBook Pro, M1 Max, 32GB RAM (2021)">
              This laptop is a top-of-the-line machine that can handle virtually any task you throw
              at it, making it a worthwhile investment for anyone looking for a reliable and
              powerful laptop that can be used for years.
            </Tool>
            <Tool title="Apple Studio Display 5K (Standard Glass)">
              5K resolution helps to reduce strain on the eyes and makes it more comfortable to work
              for long periods of time. Not to mention that it looks great.
            </Tool>
            <Tool title="Logitech MX Keys Mini">
              Backlit keys, compact design, good battery life and a great typing experience. Matches
              the space gray color of the laptop almost perfectly.
            </Tool>
            <Tool title="Logitech MX Master 3">
              Let&apos;s be honest, it just looks great with MX Keys Mini keyboard.
            </Tool>
            <Tool title="Apple Magic Trackpad">
              Gestures, taps and swipes are something I miss when I work with my laptop closed.
            </Tool>
            <Tool title="Apple Magic Mouse">
              Because it looks great and it allows me to post pictures with how badly the charging
              port is designed.
            </Tool>
            <Tool title="Autonomous ErgoChair Pro">
              If I&apos;m going to slouch in the worst ergonomic position imaginable all day, I
              might as well do it in an expensive chair.
            </Tool>
          </ToolsSection>
          <ToolsSection title="Development tools">
            <Tool title="VS Code">
              I still miss WebStorm but at least VS Code does not consume 1000% CPU when I open it.
              And to be fair, it&apos;s a great editor.
            </Tool>
            <Tool title="iTerm2">
              I&apos;m honestly not even sure what features I get with this that aren&apos;t just
              part of the macOS Terminal but it&apos;s what I use.
            </Tool>
            <Tool title="TablePlus">
              Great software for working with databases. Has saved me from building about a thousand
              admin interfaces for my various projects over the years.
            </Tool>
          </ToolsSection>
          <ToolsSection title="Design">
            <Tool title="Figma">
              I&apos;m not a designer but it allows me to quickly mock up interfaces and play with
              my ideas. One day I&apos;ll learn how to use it properly.
            </Tool>
          </ToolsSection>
          <ToolsSection title="Productivity">
            <Tool title="Reycast">
              Window manager, calculator, extensions, and more. I can&apos;t live without it.
            </Tool>
            <Tool title="Obsidian / Apple Notes">
              I slowly migrate from Apple Notes to Obsidian. I do like the fact Obsidan notes are
              just files on my disk.
            </Tool>
            <Tool title="Cron">It&apos;s just the best calendar app.</Tool>
          </ToolsSection>
        </div>
      </PageLayout>
    </>
  );
}
