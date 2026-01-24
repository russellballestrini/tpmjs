import { prisma } from '@tpmjs/db';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { QuestionsListClient } from './QuestionsListClient';

export const dynamic = 'force-dynamic';

interface QuestionsPageProps {
  params: Promise<{ username: string; slug: string }>;
  searchParams: Promise<{ skill?: string }>;
}

async function getCollection(username: string, slug: string) {
  const cleanUsername = username.startsWith('@') ? username.slice(1) : username;

  const collection = await prisma.collection.findFirst({
    where: {
      slug,
      user: { username: cleanUsername },
      isPublic: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      user: { select: { username: true } },
    },
  });

  return collection;
}

export async function generateMetadata({ params }: QuestionsPageProps): Promise<Metadata> {
  const { username, slug } = await params;
  const collection = await getCollection(username, slug);

  if (!collection) {
    return {
      title: 'Questions Not Found | TPMJS',
    };
  }

  return {
    title: `Questions - ${collection.name} | TPMJS Skills`,
    description: `Browse questions and answers about ${collection.name} tools`,
  };
}

export default async function QuestionsPage({ params, searchParams }: QuestionsPageProps) {
  const { username, slug } = await params;
  const { skill } = await searchParams;
  const collection = await getCollection(username, slug);

  if (!collection) {
    notFound();
  }

  return (
    <QuestionsListClient
      collection={{
        id: collection.id,
        name: collection.name,
        slug: collection.slug || '',
        username: collection.user.username || '',
      }}
      initialSkillFilter={skill}
    />
  );
}
