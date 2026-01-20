/**
 * Use Cases Directory Page
 *
 * Global browseable/searchable feed of all use cases with persona-based filtering
 */

import { Suspense } from 'react';
import UseCasesFeed from '~/components/UseCasesFeed';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'TPMJS Use Cases - Real AI Workflows That Work',
  description:
    'Explore 1000+ proven use cases for TPMJS tools. Filter by persona, industry, or category to find workflows that deliver real business value.',
};

export default function UseCasesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              TPMJS Use Cases
            </h1>
            <p className="mt-4 text-lg text-muted-foreground md:text-xl">
              Real AI workflows that work. Filter by persona, industry, or category to find proven
              solutions for your business.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<UseCasesFeedSkeleton />}>
          <UseCasesFeed />
        </Suspense>
      </div>
    </div>
  );
}

function UseCasesFeedSkeleton() {
  return (
    <div className="space-y-6">
      {/* Filter skeleton */}
      <div className="flex flex-wrap gap-4">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-10 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-10 w-48 animate-pulse rounded-lg bg-muted" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border">
        <div className="h-12 animate-pulse bg-muted/50" />
        {Array.from({ length: 10 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton loading state
          <div key={i} className="h-16 animate-pulse border-t bg-muted/30" />
        ))}
      </div>
    </div>
  );
}
