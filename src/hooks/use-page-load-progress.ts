import { useRouter } from 'next/router';
import { useEffect } from 'react';
import nprogress from 'nprogress';

export const usePageLoadProgress = () => {
  const router = useRouter();

  useEffect(() => {
    function onRouteChangeStart() {
      nprogress.start();
    }

    function onRouteChangeComplete() {
      nprogress.done();
    }

    router.events.on('routeChangeStart', onRouteChangeStart);
    router.events.on('routeChangeComplete', onRouteChangeComplete);

    return () => {
      router.events.off('routeChangeStart', onRouteChangeStart);
      router.events.off('routeChangeComplete', onRouteChangeComplete);
    };
  }, []);
};
