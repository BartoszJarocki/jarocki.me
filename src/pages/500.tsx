import Link from 'next/link';

import { Lede } from '../components/Index';
import { PageShell } from '../components/PageShell';

export default function ServerError() {
  return (
    <PageShell seoTitle="Something broke" noindex>
      <Lede>
        <p>500. Something broke.</p>
      </Lede>
      <p className="plate mt-14 w-fit">
        <Link href="/" className="faint-link">
          <span aria-hidden="true">←</span> home
        </Link>
      </p>
    </PageShell>
  );
}
