import Image from 'next/image';

import AvatarImage from '../../public/assets/blog/authors/bartosz.jpeg';
import { PageShell } from '../components/PageShell';
import { SiteNav } from '../components/SiteNav';

const seoTitle = 'Bartosz Jarocki';
const seoDescription =
  'Building AI at Motion. Exploring what software engineering looks like when agents do most of the typing.';

export default function Home() {
  return (
    <PageShell seoTitle={seoTitle} seoDescription={seoDescription}>
      <h1 className="flex items-center gap-2.5 text-base font-medium text-ink">
        <Image
          src={AvatarImage}
          alt=""
          width={28}
          height={28}
          className="h-7 w-7 rounded-full object-cover"
          priority
        />
        <span>Bartosz Jarocki</span>
      </h1>

      <div className="mt-4 space-y-3 text-base text-body">
        <p>
          building AI at{' '}
          <a
            href="https://motionapp.com"
            target="_blank"
            rel="noopener noreferrer"
            className="ds-link"
          >
            motion
          </a>{' '}
          —{' '}
          <a
            href="https://motionapp.com/careers"
            target="_blank"
            rel="noopener noreferrer"
            className="ds-link"
          >
            we&apos;re hiring
          </a>
          !
        </p>
        <p>exploring what software engineering looks like when agents do most of the typing.</p>
      </div>

      <SiteNav omit={['home']} className="mt-8" />
    </PageShell>
  );
}
