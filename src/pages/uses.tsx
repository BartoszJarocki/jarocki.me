import Head from 'next/head';
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

export default function Uses() {
  return (
    <>
      <Head>
        <title>Uses - Spencer Sharp</title>
        <meta
          name="description"
          content="Software I use, gadgets I love, and other things I recommend."
        />
      </Head>
      <PageLayout
        title="Software I use, gadgets I love, and other things I recommend."
        intro="I get asked a lot about the things I use to build software, stay productive, or buy to fool myself into thinking I’m being productive when I’m really just procrastinating. Here’s a big list of all of my favorite stuff."
      >
        <div className="space-y-20">
          <ToolsSection title="Workstation">
            <Tool title="14” MacBook Pro, M1 Max, 32GB RAM (2021)">
              I was using an Intel-based 16” MacBook Pro prior to this and the difference is night
              and day. I’ve never heard the fans turn on a single time, even under the heavy loads.
              And the battery life is great.
            </Tool>
            <Tool title="Apple Studio Display (Standard Glass)">Pricey but worth it</Tool>
            <Tool title="Logitech MX Keys Mini">One of the best keyboards I’ve ever used.</Tool>
            <Tool title="Logitech MX Master 3">
              I’ve been using the MX Master series for years and it’s still the best mouse I’ve ever
              used.
            </Tool>
            <Tool title="Apple Magic Trackpad">
              Something about all the gestures makes me feel like a wizard with special powers. I
              really like feeling like a wizard with special powers.
            </Tool>
            <Tool title="Herman Miller Aeron Chair">
              If I’m going to slouch in the worst ergonomic position imaginable all day, I might as
              well do it in an expensive chair.
            </Tool>
          </ToolsSection>
          <ToolsSection title="Development tools">
            <Tool title="VS Code">
              I don’t care if it’s missing all of the fancy IDE features everyone else relies on,
              Sublime Text is still the best text editor ever made.
            </Tool>
            <Tool title="iTerm2">
              I’m honestly not even sure what features I get with this that aren’t just part of the
              macOS Terminal but it’s what I use.
            </Tool>
            <Tool title="TablePlus">
              Great software for working with databases. Has saved me from building about a thousand
              admin interfaces for my various projects over the years.
            </Tool>
          </ToolsSection>
          <ToolsSection title="Design">
            <Tool title="Figma">
              We started using Figma as just a design tool but now it’s become our virtual
              whiteboard for the entire company. Never would have expected the collaboration
              features to be the real hook.
            </Tool>
          </ToolsSection>
          <ToolsSection title="Productivity">
            <Tool title="Reycast">
              It’s not the newest kid on the block but it’s still the fastest. The Sublime Text of
              the application launcher world.
            </Tool>
            <Tool title="Obsidian / Apple Notes">
              Using a daily notes system instead of trying to keep things organized by topics has
              been super powerful for me. And with Reflect, it’s still easy for me to keep all of
              that stuff discoverable by topic even though all of my writing happens in the daily
              note.
            </Tool>
            <Tool title="Cron">
              Great tool for scheduling meetings while protecting my calendar and making sure I
              still have lots of time for deep work during the week.
            </Tool>
          </ToolsSection>
        </div>
      </PageLayout>
    </>
  );
}
