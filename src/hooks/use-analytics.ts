import { useRouter } from 'next/router';
import { useEffect } from 'react';
import * as Fathom from 'fathom-client';

const Config = {
  siteId: process.env.NEXT_PUBLIC_ANALYTICS_ID!,
  domains: process.env.NEXT_PUBLIC_ANALYTICS_DOMAINS!.split(','),
};

export const useAnalytics = () => {
  const router = useRouter();

  useEffect(() => {
    Fathom.load(Config.siteId, {
      includedDomains: Config.domains,
    });

    const onRouteChangeComplete = (url: string) => {
      console.log(`Route change completed: ${url}.`);
      Fathom.trackPageview();
    };
    router.events.on('routeChangeComplete', onRouteChangeComplete);

    return () => {
      router.events.off('routeChangeComplete', onRouteChangeComplete);
    };
  }, []);
};
