/**
 * Collection Use Cases Page
 *
 * Browseable/searchable feed of use cases for a specific collection
 */

import { prisma } from '@tpmjs/db';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import UseCasesFeed from '~/components/UseCasesFeed';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ username: string; slug: string }>;
  searchParams: Promise<{ persona?: string; search?: string; sort?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { username, slug } = await params;

  try {
    const collection = await prisma.collection.findFirst({
      where: {
        slug,
        user: { username },
      },
      select: {
        name: true,
        description: true,
      },
    });

    if (!collection) {
      return {
        title: 'Collection Not Found - TPMJS',
      };
    }

    return {
      title: `Use Cases - ${collection.name} - TPMJS`,
      description: collection.description || `Use cases for ${collection.name}`,
    };
  } catch {
    return {
      title: 'Collection Use Cases - TPMJS',
    };
  }
}

export default async function CollectionUseCasesPage({ params, searchParams }: Props) {
  const { username, slug } = await params;
  const { persona, search, sort } = await searchParams;

  // Verify collection exists and is public
  const collection = await prisma.collection.findFirst({
    where: {
      slug,
      user: { username },
      isPublic: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      user: {
        select: {
          username: true,
        },
      },
    },
  });

  if (!collection) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm text-muted-foreground">
              <a
                href={`/${collection.user.username}/collections/${collection.slug}`}
                className="hover:text-foreground"
              >
                {collection.name}
              </a>
              {' / '}Use Cases
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Use Cases</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Proven workflows from this collection that deliver real business value.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<UseCasesFeedSkeleton />}>
          <UseCasesFeed
            collectionId={collection.id}
            initialPersona={persona}
            initialSearch={search}
            initialSort={sort}
          />
        </Suspense>
      </div>
    </div>
  );
}

function UseCasesFeedSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-10 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-10 w-48 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="rounded-lg border">
        <div className="h-12 animate-pulse bg-muted/50" />
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse border-t bg-muted/30" />
        ))}
      </div>
    </div>
  );
}
