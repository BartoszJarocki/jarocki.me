import Link from 'next/link';

import { Lede } from '../components/Index';
import { PageShell } from '../components/PageShell';

export default function NotFound() {
  return (
    <PageShell seoTitle="Not found" noindex>
      <Lede>
        <p>404. That page isn&apos;t here.</p>
      </Lede>
      <p className="plate mt-14 w-fit">
        <Link href="/" className="faint-link">
          <span aria-hidden="true">←</span> home
        </Link>
      </p>
    </PageShell>
  );
}
