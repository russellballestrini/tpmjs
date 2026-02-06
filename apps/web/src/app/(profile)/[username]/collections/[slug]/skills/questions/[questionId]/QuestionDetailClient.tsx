'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@tpmjs/ui/Card/Card';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { useState } from 'react';
import { Streamdown } from 'streamdown';
import { AppHeader } from '~/components/AppHeader';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

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

interface QuestionDetailClientProps {
  question: {
    id: string;
    question: string;
    answer: string;
    confidence: number;
    similarCount: number;
    tags: string[];
    answerTokens: number;
    createdAt: string;
    updatedAt: string;
    skillNodes: Array<{
      relevance: number;
      skill: {
        id: string;
        name: string;
        slug: string;
        description: string;
        questionCount: number;
      };
    }>;
    toolNodes: Array<{
      relevance: number;
      tool: {
        id: string;
        name: string;
        description: string;
        package: {
          npmPackageName: string;
          category: string;
        };
      };
    }>;
  };
  collection: {
    id: string;
    name: string;
    slug: string;
    username: string;
  };
  similarQuestions: Array<{
    id: string;
    question: string;
    confidence: number;
    createdAt: string;
  }>;
}

export function QuestionDetailClient({
  question,
  collection,
  similarQuestions,
}: QuestionDetailClientProps): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const basePath = `/${collection.username}/collections/${collection.slug}`;
  const questionUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : `https://tpmjs.com${basePath}/skills/questions/${question.id}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(questionUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
            Questions
          </Link>
          <Icon icon="chevronRight" className="w-4 h-4" />
          <span className="text-foreground truncate max-w-[200px]">
            {question.question.slice(0, 40)}...
          </span>
        </nav>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Question Header */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <h1 className="text-xl font-bold text-foreground leading-tight">
                  {question.question}
                </h1>
                <Button variant="ghost" size="sm" onClick={copyLink} className="flex-shrink-0">
                  <Icon icon={copied ? 'check' : 'link'} className="w-4 h-4 mr-1.5" />
                  {copied ? 'Copied!' : 'Copy link'}
                </Button>
              </div>

              <div className="flex items-center gap-4 text-sm text-foreground-secondary">
                <span className="flex items-center gap-1.5">
                  <Icon icon="clock" className="w-4 h-4" />
                  {formatDate(question.createdAt)}
                </span>
                <Badge variant={question.confidence >= 0.7 ? 'success' : 'secondary'} size="md">
                  {Math.round(question.confidence * 100)}% confidence
                </Badge>
                {question.similarCount > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Icon icon="user" className="w-4 h-4" />
                    Asked {question.similarCount} time{question.similarCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Answer */}
            <Card variant="default">
              <CardHeader padding="md">
                <CardTitle as="h2" className="text-base font-semibold flex items-center gap-2">
                  <Icon icon="message" className="w-5 h-5 text-primary" />
                  Answer
                </CardTitle>
              </CardHeader>
              <CardContent padding="md" className="pt-0">
                <div className="prose prose-sm max-w-none text-foreground leading-relaxed">
                  <Streamdown isAnimating={false}>{question.answer}</Streamdown>
                </div>
                {question.answerTokens > 0 && (
                  <p className="mt-4 text-xs text-foreground-tertiary">
                    Response: {question.answerTokens.toLocaleString()} tokens
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Related Tools */}
            {question.toolNodes.length > 0 && (
              <Card variant="default">
                <CardHeader padding="md">
                  <CardTitle as="h2" className="text-base font-semibold flex items-center gap-2">
                    <Icon icon="puzzle" className="w-5 h-5 text-primary" />
                    Related Tools
                  </CardTitle>
                </CardHeader>
                <CardContent padding="md" className="pt-0">
                  <div className="space-y-3">
                    {question.toolNodes.map((tn) => (
                      <Link
                        key={tn.tool.id}
                        href={`/tool/${tn.tool.package.npmPackageName}/${tn.tool.name}`}
                        className="block p-3 bg-muted/50 border border-border rounded-lg hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-foreground">{tn.tool.name}</p>
                            <p className="text-sm text-foreground-secondary line-clamp-2 mt-1">
                              {tn.tool.description}
                            </p>
                          </div>
                          <Badge variant="secondary" size="sm">
                            {tn.tool.package.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-foreground-tertiary mt-2">
                          {tn.tool.package.npmPackageName}
                        </p>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Skills */}
            {question.skillNodes.length > 0 && (
              <Card variant="default">
                <CardHeader padding="sm">
                  <CardTitle as="h3" className="text-sm font-semibold">
                    Skills Identified
                  </CardTitle>
                </CardHeader>
                <CardContent padding="sm" className="pt-0">
                  <div className="space-y-2">
                    {question.skillNodes.map((sn) => (
                      <Link
                        key={sn.skill.id}
                        href={`${basePath}/skills/questions?skill=${encodeURIComponent(sn.skill.slug)}`}
                        className="block p-2 bg-muted/50 border border-border rounded hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm text-foreground">
                            {sn.skill.name}
                          </span>
                          <Badge variant="outline" size="sm">
                            {sn.skill.questionCount} Q
                          </Badge>
                        </div>
                        {sn.skill.description && (
                          <p className="text-xs text-foreground-secondary mt-1 line-clamp-2">
                            {sn.skill.description}
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {question.tags.length > 0 && (
              <Card variant="default">
                <CardHeader padding="sm">
                  <CardTitle as="h3" className="text-sm font-semibold">
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent padding="sm" className="pt-0">
                  <div className="flex flex-wrap gap-1.5">
                    {question.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" size="sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Similar Questions */}
            {similarQuestions.length > 0 && (
              <Card variant="default">
                <CardHeader padding="sm">
                  <CardTitle as="h3" className="text-sm font-semibold">
                    Related Questions
                  </CardTitle>
                </CardHeader>
                <CardContent padding="sm" className="pt-0">
                  <div className="space-y-2">
                    {similarQuestions.map((sq) => (
                      <Link
                        key={sq.id}
                        href={`${basePath}/skills/questions/${sq.id}`}
                        className="block p-2 bg-muted/50 border border-border rounded hover:border-primary/30 transition-colors"
                      >
                        <p className="text-sm text-foreground line-clamp-2">{sq.question}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <Badge variant={sq.confidence >= 0.7 ? 'success' : 'secondary'} size="sm">
                            {Math.round(sq.confidence * 100)}%
                          </Badge>
                          <span className="text-xs text-foreground-tertiary">
                            {formatRelativeTime(new Date(sq.createdAt))}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Back Link */}
            <Link href={`${basePath}/skills/questions`}>
              <Button variant="secondary" className="w-full">
                <Icon icon="arrowLeft" className="w-4 h-4 mr-1.5" />
                All Questions
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
