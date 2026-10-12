import Head from 'next/head';

// next-seo's JSON-LD components escape & as &amp; inside the script, which breaks URLs with a query.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify({ '@context': 'https://schema.org', ...data });

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: json.replace(/</g, '\\u003c') }}
      />
    </Head>
  );
}
