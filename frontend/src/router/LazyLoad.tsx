import { Suspense, type ComponentType } from 'react';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { PageLoadingFallback } from '@/components/common/LoadingSkeleton';

export const LazyLoad = (Component: ComponentType) => (
  <ErrorBoundary>
    <Suspense fallback={<PageLoadingFallback />}>
      <Component />
    </Suspense>
  </ErrorBoundary>
);
