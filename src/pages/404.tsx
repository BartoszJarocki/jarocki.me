import Link from 'next/link';

import { Lede } from '../components/Index';
import { PageShell } from '../components/PageShell';

export default function NotFound() {
  return (
    <PageShell seoTitle="Not found">
      <Lede>
        <p>404. That page isn&apos;t here.</p>
      </Lede>
      <p className="mt-14">
        <Link href="/" className="faint-link">
          ← home
        </Link>
      </p>
    </PageShell>
  );
}
