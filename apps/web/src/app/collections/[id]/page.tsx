import { prisma } from '@tpmjs/db';
import { notFound, redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface CollectionRedirectPageProps {
  params: Promise<{ id: string }>;
}

/**
 * DEPRECATED: This route is deprecated in favor of /@username/collections/[slug]
 * All requests are 301 redirected to the new canonical URL.
 */
export default async function CollectionRedirectPage({ params }: CollectionRedirectPageProps) {
  const { id } = await params;

  // Look up the collection by ID
  const collection = await prisma.collection.findUnique({
    where: { id },
    select: {
      slug: true,
      isPublic: true,
      user: {
        select: { username: true },
      },
    },
  });

  // If collection doesn't exist, return 404
  if (!collection) {
    notFound();
  }

  // If collection is private, return 404 (don't reveal existence)
  if (!collection.isPublic) {
    notFound();
  }

  // If user has no username or collection has no slug, can't redirect to pretty URL
  if (!collection.user.username || !collection.slug) {
    notFound();
  }

  // 301 permanent redirect to the canonical URL
  redirect(`/@${collection.user.username}/collections/${collection.slug}`);
}
