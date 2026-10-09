import Link from 'next/link';

import { Lede } from '../components/Index';
import { PageShell } from '../components/PageShell';

export default function ServerError() {
  return (
    <PageShell seoTitle="Something broke">
      <Lede>
        <p>500. Something broke.</p>
      </Lede>
      <p className="mt-14">
        <Link href="/" className="faint-link">
          ← home
        </Link>
      </p>
    </PageShell>
  );
}
