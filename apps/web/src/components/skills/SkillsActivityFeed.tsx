'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tpmjs/ui/Card/Card';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Skeleton } from '@tpmjs/ui/Skeleton/Skeleton';

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

import { useEffect, useState } from 'react';

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
  limit?: number;
}

export function SkillsActivityFeed({
  collectionId,
  limit = 10,
}: SkillsActivityFeedProps): React.ReactElement {
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
      <Card variant="default" className="border-red-200 bg-red-50">
        <CardContent padding="md">
          <p className="text-sm text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Card variant="default" className="border-dashed">
        <CardContent padding="lg" className="text-center">
          <Icon icon="message" size="lg" className="mx-auto text-foreground-tertiary mb-2" />
          <p className="text-foreground-secondary text-sm">
            No questions yet. Be the first to ask!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {questions.map((q) => (
        <Card key={q.id} variant="default" className="hover:border-foreground/20 transition-colors">
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
            <CardDescription className="line-clamp-2 text-xs mb-2">
              {q.answer.slice(0, 150)}
              {q.answer.length > 150 ? '...' : ''}
            </CardDescription>

            <div className="flex items-center justify-between">
              <div className="flex gap-1 flex-wrap">
                {q.skillNodes.slice(0, 2).map((sn, i) => (
                  <Badge key={i} variant="outline" size="sm">
                    {sn.skill.name}
                  </Badge>
                ))}
                {q.skillNodes.length > 2 && (
                  <Badge variant="outline" size="sm">
                    +{q.skillNodes.length - 2}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-foreground-tertiary">
                {q.similarCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Icon icon="user" size="sm" />
                    {q.similarCount} similar
                  </span>
                )}
                <span>{formatRelativeTime(new Date(q.createdAt))}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
