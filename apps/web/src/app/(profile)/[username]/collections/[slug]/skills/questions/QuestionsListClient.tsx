'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tpmjs/ui/Card/Card';
import { EmptyState } from '@tpmjs/ui/EmptyState/EmptyState';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Skeleton } from '@tpmjs/ui/Skeleton/Skeleton';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AppHeader } from '~/components/AppHeader';

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
    relevance: number;
    skill: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  toolNodes: Array<{
    relevance: number;
    tool: {
      id: string;
      name: string;
      package: {
        npmPackageName: string;
      };
    };
  }>;
}

interface QuestionsListClientProps {
  collection: {
    id: string;
    name: string;
    slug: string;
    username: string;
  };
  initialSkillFilter?: string;
}

export function QuestionsListClient({
  collection,
  initialSkillFilter,
}: QuestionsListClientProps): React.ReactElement {
  const [questions, setQuestions] = useState<SkillQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [skillFilter, setSkillFilter] = useState(initialSkillFilter);

  const limit = 20;

  const fetchQuestions = useCallback(
    async (currentOffset: number, append: boolean = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const params = new URLSearchParams({
          collectionId: collection.id,
          limit: String(limit),
          offset: String(currentOffset),
        });

        if (skillFilter) {
          params.set('skill', skillFilter);
        }

        const response = await fetch(`/api/skills/questions?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch questions');
        }

        const data = await response.json();

        if (append) {
          setQuestions((prev) => [...prev, ...data.data]);
        } else {
          setQuestions(data.data);
        }

        setHasMore(data.pagination.hasMore);
        setOffset(currentOffset + data.data.length);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [collection.id, skillFilter]
  );

  useEffect(() => {
    setOffset(0);
    fetchQuestions(0, false);
  }, [fetchQuestions]);

  const handleLoadMore = () => {
    fetchQuestions(offset, true);
  };

  const clearSkillFilter = () => {
    setSkillFilter(undefined);
    window.history.replaceState(null, '', `/${collection.username}/collections/${collection.slug}/skills/questions`);
  };

  const basePath = `/${collection.username}/collections/${collection.slug}`;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-foreground-secondary mb-6">
          <Link href={basePath} className="hover:text-foreground">
            {collection.name}
          </Link>
          <Icon icon="chevronRight" className="w-4 h-4" />
          <Link href={`${basePath}/skills/questions`} className="hover:text-foreground">
            Skills
          </Link>
          <Icon icon="chevronRight" className="w-4 h-4" />
          <span className="text-foreground">Questions</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Questions</h1>
            <p className="text-foreground-secondary mt-1">
              Browse all questions asked about {collection.name}
            </p>
          </div>
          <Link href={basePath}>
            <Button variant="secondary" size="sm">
              <Icon icon="arrowLeft" className="w-4 h-4 mr-1.5" />
              Back to Collection
            </Button>
          </Link>
        </div>

        {/* Skill Filter */}
        {skillFilter && (
          <div className="mb-6 flex items-center gap-2">
            <span className="text-sm text-foreground-secondary">Filtered by skill:</span>
            <Badge variant="default" size="md">
              {skillFilter}
              <button
                type="button"
                onClick={clearSkillFilter}
                className="ml-1.5 hover:text-foreground-secondary"
              >
                <Icon icon="x" className="w-3 h-3" />
              </button>
            </Badge>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} variant="default">
                <CardContent padding="md">
                  <Skeleton className="h-5 w-3/4 mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card variant="default" className="border-error/20 bg-error/5">
            <CardContent padding="lg">
              <div className="flex items-center gap-2">
                <Icon icon="alertCircle" size="md" className="text-error" />
                <p className="text-error">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && questions.length === 0 && (
          <Card variant="default" className="border-dashed">
            <CardContent padding="lg">
              <EmptyState
                icon="message"
                title="No questions yet"
                description={
                  skillFilter
                    ? `No questions found for skill "${skillFilter}"`
                    : 'Be the first to ask a question about this collection\'s tools.'
                }
                size="md"
              />
              {skillFilter && (
                <div className="mt-4 text-center">
                  <Button variant="secondary" size="sm" onClick={clearSkillFilter}>
                    Clear filter
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Questions List */}
        {!loading && !error && questions.length > 0 && (
          <div className="space-y-4">
            {questions.map((q) => (
              <Link
                key={q.id}
                href={`${basePath}/skills/questions/${q.id}`}
                className="block"
              >
                <Card
                  variant="default"
                  className="hover:border-primary/30 hover:bg-muted/30 transition-all cursor-pointer"
                >
                  <CardHeader padding="md" className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle as="h3" className="text-base font-medium">
                        {q.question}
                      </CardTitle>
                      <Badge
                        variant={q.confidence >= 0.7 ? 'success' : 'secondary'}
                        size="sm"
                        className="flex-shrink-0"
                      >
                        {Math.round(q.confidence * 100)}%
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent padding="md" className="pt-0">
                    <CardDescription className="line-clamp-3 text-sm mb-4">
                      {q.answer.slice(0, 250)}
                      {q.answer.length > 250 ? '...' : ''}
                    </CardDescription>

                    <div className="flex items-center justify-between">
                      <div className="flex gap-1.5 flex-wrap">
                        {q.skillNodes.slice(0, 3).map((sn) => (
                          <Badge key={sn.skill.id} variant="outline" size="sm">
                            {sn.skill.name}
                          </Badge>
                        ))}
                        {q.skillNodes.length > 3 && (
                          <Badge variant="outline" size="sm">
                            +{q.skillNodes.length - 3}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-foreground-tertiary">
                        {q.toolNodes.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Icon icon="puzzle" className="w-3.5 h-3.5" />
                            {q.toolNodes.length} tool{q.toolNodes.length !== 1 ? 's' : ''}
                          </span>
                        )}
                        {q.similarCount > 0 && (
                          <span className="flex items-center gap-1">
                            <Icon icon="user" className="w-3.5 h-3.5" />
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

            {/* Load More */}
            {hasMore && (
              <div className="text-center pt-4">
                <Button
                  variant="secondary"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <Icon icon="loader" className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load more questions'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
