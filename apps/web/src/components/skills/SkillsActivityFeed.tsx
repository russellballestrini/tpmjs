'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tpmjs/ui/Card/Card';
import { EmptyState } from '@tpmjs/ui/EmptyState/EmptyState';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Skeleton } from '@tpmjs/ui/Skeleton/Skeleton';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Simple relative time formatter
function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

interface SkillQuestion {
  id: string;
  question: string;
  answer: string;
  confidence: number;
  similarCount: number;
  tags: string[];
  createdAt: string;
  skillNodes: Array<{
    skill: {
      name: string;
    };
  }>;
}

interface SkillsActivityFeedProps {
  collectionId: string;
  username: string;
  slug: string;
  limit?: number;
}

export function SkillsActivityFeed({
  collectionId,
  username,
  slug,
  limit = 10,
}: SkillsActivityFeedProps): React.ReactElement {
  const basePath = `/${username}/collections/${slug}`;
  const [questions, setQuestions] = useState<SkillQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const response = await fetch(
          `/api/skills/activity?collectionId=${collectionId}&limit=${limit}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch activity');
        }
        const data = await response.json();
        setQuestions(data.questions || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }

    fetchQuestions();
  }, [collectionId, limit]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} variant="default">
            <CardContent padding="md">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card variant="default" className="border-error/20 bg-error/5">
        <CardContent padding="md">
          <div className="flex items-center gap-2">
            <Icon icon="alertCircle" size="sm" className="text-error" />
            <p className="text-sm text-error">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Card variant="default" className="border-dashed">
        <CardContent padding="lg">
          <EmptyState
            icon="message"
            title="No questions yet"
            description="Be the first to ask a question about this collection's tools."
            size="sm"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {questions.map((q) => (
        <Link key={q.id} href={`${basePath}/skills/questions/${q.id}`} className="block">
          <Card
            variant="default"
            className="hover:border-primary/20 hover:bg-muted/30 transition-all cursor-pointer"
          >
            <CardHeader padding="sm" className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle as="h4" className="text-sm font-medium line-clamp-2">
                  {q.question}
                </CardTitle>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Badge variant={q.confidence >= 0.7 ? 'success' : 'secondary'} size="sm">
                    {Math.round(q.confidence * 100)}%
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent padding="sm" className="pt-0">
              <CardDescription className="line-clamp-2 text-xs mb-3">
                {q.answer.slice(0, 150)}
                {q.answer.length > 150 ? '...' : ''}
              </CardDescription>

              <div className="flex items-center justify-between">
                <div className="flex gap-1.5 flex-wrap">
                  {q.skillNodes.slice(0, 2).map((sn) => (
                    <Badge key={sn.skill.name} variant="outline" size="sm">
                      {sn.skill.name}
                    </Badge>
                  ))}
                  {q.skillNodes.length > 2 && (
                    <Badge variant="outline" size="sm">
                      +{q.skillNodes.length - 2}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-foreground-tertiary">
                  {q.similarCount > 0 && (
                    <span className="flex items-center gap-1">
                      <Icon icon="user" size="sm" />
                      {q.similarCount}
                    </span>
                  )}
                  <span>{formatRelativeTime(new Date(q.createdAt))}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
