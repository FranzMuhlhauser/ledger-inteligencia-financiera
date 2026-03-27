import { useEffect, useRef, useState, RefObject } from 'react';

interface UseLazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
  initialVisible?: number;
}

/**
 * Hook for lazy loading lists with virtualization
 * @param totalItems - Total number of items in the list
 * @param options - Configuration options
 * @returns Object with visible items and ref for the loading sentinel
 */
export function useLazyLoad(
  totalItems: number,
  options: UseLazyLoadOptions = {}
): {
  visibleItems: number;
  sentinelRef: RefObject<HTMLDivElement | null>;
  loadMore: () => void;
} {
  const {
    threshold = 0.1,
    rootMargin = '200px',
    initialVisible = 20,
  } = options;

  const [visibleItems, setVisibleItems] = useState(initialVisible);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Reset when total items changes
    setVisibleItems(Math.min(initialVisible, totalItems));
  }, [totalItems, initialVisible]);

  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && visibleItems < totalItems) {
          // Load more items
          setVisibleItems((prev) => Math.min(prev + 10, totalItems));
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [visibleItems, totalItems, threshold, rootMargin]);

  const loadMore = () => {
    setVisibleItems((prev) => Math.min(prev + 10, totalItems));
  };

  return {
    visibleItems,
    sentinelRef,
    loadMore,
  };
}

/**
 * Hook for infinite scroll pagination
 * @param onLoadMore - Callback to load more items
 * @param hasMore - Whether there are more items to load
 * @param isLoading - Whether items are currently loading
 */
export function useInfiniteScroll(
  onLoadMore: () => void,
  hasMore: boolean,
  isLoading: boolean
): RefObject<HTMLDivElement | null> {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sentinelRef.current || isLoading || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '200px',
      }
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [onLoadMore, hasMore, isLoading]);

  return sentinelRef;
}
