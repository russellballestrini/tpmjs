'use client';

import { useEffect, useRef, useState } from 'react';

export interface UseScrollRevealOptions {
  /**
   * Threshold for Intersection Observer (0-1)
   * @default 0.2
   */
  threshold?: number;

  /**
   * Root margin for Intersection Observer
   * @default '-100px'
   */
  rootMargin?: string;

  /**
   * Whether to trigger animation only once
   * @default true
   */
  once?: boolean;

  /**
   * Delay before animation starts (ms)
   * @default 0
   */
  delay?: number;
}

/**
 * useScrollReveal Hook
 *
 * Triggers animations when an element enters the viewport using Intersection Observer.
 * Returns a ref to attach to the element and a boolean indicating visibility.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { ref, isVisible } = useScrollReveal({ threshold: 0.3 });
 *
 *   return (
 *     <div
 *       ref={ref}
 *       className={isVisible ? 'animate-brutalist-entrance' : 'opacity-0'}
 *     >
 *       Content
 *     </div>
 *   );
 * }
 * ```
 */
export function useScrollReveal<T extends HTMLElement>(
  options: UseScrollRevealOptions = {}
): {
  ref: React.RefObject<T | null>;
  isVisible: boolean;
} {
  const { threshold = 0.2, rootMargin = '-100px', once = true, delay = 0 } = options;

  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // If animation has already happened and once is true, don't re-observe
    if (once && hasAnimated) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          if (delay > 0) {
            setTimeout(() => {
              setIsVisible(true);
              if (once) {
                setHasAnimated(true);
              }
            }, delay);
          } else {
            setIsVisible(true);
            if (once) {
              setHasAnimated(true);
            }
          }

          // Disconnect if once is true
          if (once) {
            observer.disconnect();
          }
        } else if (!once) {
          // Reset visibility if not once
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, once, delay, hasAnimated]);

  return { ref, isVisible };
}
