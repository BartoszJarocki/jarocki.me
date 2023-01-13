import { GetStaticPaths, GetStaticProps } from 'next';
import { NextSeo } from 'next-seo';
import React from 'react';

import { PageLayout } from '../../components/PageLayout';
import { NotePreview } from '../../components/notes/NotePreview';
import { Note, notesApi } from '../../lib/notesApi';

const seoTitle = 'Tags';
const seoDescription = 'All of my blog posts tagged with ';

interface Props {
  tag: string;
  relatedNotes: Note[];
}

export default function Tag({ tag, relatedNotes }: Props) {
  return (
    <>
      <NextSeo
        title={seoTitle}
        description={`${seoDescription}#${tag}}`}
        canonical={`${process.env.NEXT_PUBLIC_URL}/tags/${tag}`}
        openGraph={{
          images: [
            {
              url: `${process.env.NEXT_PUBLIC_URL}/api/og?title=${seoTitle}&description=${seoDescription}`,
            },
          ],
        }}
      />
      <PageLayout title="Tags" intro={`All the articles from #${tag}`}>
        <div className="mt-24 md:border-l md:border-zinc-100 md:pl-6 md:dark:border-zinc-700/40">
          <div className="flex max-w-3xl flex-col space-y-16">
            {relatedNotes.map((note) => (
              <NotePreview key={note.slug} note={note} />
            ))}
          </div>
        </div>
      </PageLayout>
    </>
  );
}

export const getStaticProps: GetStaticProps<Props, { tag: string }> = async (context) => {
  const tag = context.params?.tag;
  if (!tag) {
    return {
      notFound: true,
    };
  }

  const relatedNotes = await notesApi.getNotesByTag(tag);

  return {
    props: {
      relatedNotes,
      tag,
    },
    revalidate: 10,
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const tags = await notesApi.getAllTags();

  return {
    paths: tags.map((tag) => ({
      params: { tag },
    })),
    fallback: 'blocking',
  };
};
