import { prisma } from '@tpmjs/db';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { QuestionDetailClient } from './QuestionDetailClient';

export const dynamic = 'force-dynamic';

interface QuestionPageProps {
  params: Promise<{ username: string; slug: string; questionId: string }>;
}

async function getQuestion(questionId: string) {
  const question = await prisma.skillQuestion.findUnique({
    where: { id: questionId },
    select: {
      id: true,
      question: true,
      answer: true,
      confidence: true,
      similarCount: true,
      tags: true,
      answerTokens: true,
      createdAt: true,
      updatedAt: true,
      collection: {
        select: {
          id: true,
          name: true,
          slug: true,
          isPublic: true,
          user: {
            select: {
              username: true,
            },
          },
        },
      },
      skillNodes: {
        select: {
          relevance: true,
          skill: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              questionCount: true,
            },
          },
        },
        orderBy: { relevance: 'desc' },
      },
      toolNodes: {
        select: {
          relevance: true,
          tool: {
            select: {
              id: true,
              name: true,
              description: true,
              package: {
                select: {
                  npmPackageName: true,
                  category: true,
                },
              },
            },
          },
        },
        orderBy: { relevance: 'desc' },
      },
    },
  });

  return question;
}

async function getSimilarQuestions(questionId: string, collectionId: string, skillIds: string[]) {
  if (skillIds.length === 0) return [];

  return prisma.skillQuestion.findMany({
    where: {
      id: { not: questionId },
      collectionId,
      skillNodes: {
        some: {
          skillId: { in: skillIds },
        },
      },
    },
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      question: true,
      confidence: true,
      createdAt: true,
    },
  });
}

export async function generateMetadata({ params }: QuestionPageProps): Promise<Metadata> {
  const { questionId } = await params;
  const question = await getQuestion(questionId);

  if (!question || !question.collection.isPublic) {
    return {
      title: 'Question Not Found | TPMJS',
    };
  }

  const truncatedQuestion =
    question.question.length > 60
      ? question.question.slice(0, 60) + '...'
      : question.question;

  return {
    title: `${truncatedQuestion} | TPMJS Skills`,
    description: question.answer.slice(0, 160),
    openGraph: {
      title: truncatedQuestion,
      description: question.answer.slice(0, 160),
      type: 'article',
    },
  };
}

export default async function QuestionPage({ params }: QuestionPageProps) {
  const { username, slug, questionId } = await params;
  const cleanUsername = username.startsWith('@') ? username.slice(1) : username;

  const question = await getQuestion(questionId);

  if (!question) {
    notFound();
  }

  if (!question.collection.isPublic) {
    notFound();
  }

  // Verify the URL matches the actual collection
  const collectionUsername = question.collection.user.username || '';
  const collectionSlug = question.collection.slug || '';

  if (collectionUsername !== cleanUsername || collectionSlug !== slug) {
    notFound();
  }

  const skillIds = question.skillNodes.map((sn) => sn.skill.id);
  const similarQuestions = await getSimilarQuestions(questionId, question.collection.id, skillIds);

  return (
    <QuestionDetailClient
      question={{
        id: question.id,
        question: question.question,
        answer: question.answer,
        confidence: question.confidence,
        similarCount: question.similarCount,
        tags: question.tags,
        answerTokens: question.answerTokens,
        createdAt: question.createdAt.toISOString(),
        updatedAt: question.updatedAt.toISOString(),
        skillNodes: question.skillNodes.map((sn) => ({
          relevance: sn.relevance,
          skill: {
            id: sn.skill.id,
            name: sn.skill.name,
            slug: sn.skill.slug,
            description: sn.skill.description,
            questionCount: sn.skill.questionCount,
          },
        })),
        toolNodes: question.toolNodes.map((tn) => ({
          relevance: tn.relevance,
          tool: {
            id: tn.tool.id,
            name: tn.tool.name,
            description: tn.tool.description,
            package: {
              npmPackageName: tn.tool.package.npmPackageName,
              category: tn.tool.package.category,
            },
          },
        })),
      }}
      collection={{
        id: question.collection.id,
        name: question.collection.name,
        slug: collectionSlug,
        username: collectionUsername,
      }}
      similarQuestions={similarQuestions.map((sq) => ({
        id: sq.id,
        question: sq.question,
        confidence: sq.confidence,
        createdAt: sq.createdAt.toISOString(),
      }))}
    />
  );
}
