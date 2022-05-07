import {
  ComputedFields,
  defineDocumentType,
  defineNestedType,
  makeSource,
} from 'contentlayer/source-files';

import readingTime from 'reading-time';
import rehypeSlug from 'rehype-slug';
import rehypeCodeTitles from 'rehype-code-titles';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypePrism from 'rehype-prism-plus';

const computedFields: ComputedFields = {
  readingTime: { type: 'json', resolve: (doc) => readingTime(doc.body.raw) },
  wordCount: {
    type: 'number',
    resolve: (doc) => doc.body.raw.split(/\s+/gu).length,
  },
  slug: {
    type: 'string',
    resolve: (doc) => doc._raw.sourceFileName.replace(/\.mdx$/, ''),
  },
};

const AuthorNestedType = defineNestedType(() => ({
  name: 'author',
  fields: {
    name: {
      type: 'string',
      required: true,
    },
    picture: {
      type: 'string',
      required: true,
    },
  },
}));

const Blog = defineDocumentType(() => ({
  name: 'Blog',
  filePathPattern: 'blog/*.mdx',
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    description: { type: 'string', required: true },
    date: { type: 'string', required: true },
    image: { type: 'string', required: false },
    tags: { type: 'list', required: true, of: { type: 'string' } },
    author: { type: 'nested', of: AuthorNestedType, required: true },
  },
  computedFields,
}));

const contentLayerConfig = makeSource({
  contentDirPath: 'src/data',
  documentTypes: [Blog],
  mdx: {
    rehypePlugins: [
      rehypeSlug,
      rehypeCodeTitles,
      rehypePrism,
      [
        rehypeAutolinkHeadings,
        {
          properties: {
            className: ['anchor'],
          },
        },
      ],
    ],
  },
});

export default contentLayerConfig;
