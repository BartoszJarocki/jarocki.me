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
    // Initialize Fathom when the app loads
    Fathom.load(Config.siteId, {
      includedDomains: Config.domains,
    });

    function onRouteChangeComplete() {
      Fathom.trackPageview();
    }
    // Record a page view when route changes
    router.events.on('routeChangeComplete', onRouteChangeComplete);

    // Unassign event listener
    return () => {
      router.events.off('routeChangeComplete', onRouteChangeComplete);
    };
  }, []);
};
