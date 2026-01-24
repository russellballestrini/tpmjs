'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@tpmjs/ui/Card/Card';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { ProgressBar } from '@tpmjs/ui/ProgressBar/ProgressBar';
import { Skeleton } from '@tpmjs/ui/Skeleton/Skeleton';
import { useEffect, useState } from 'react';

interface SkillStats {
  totalQuestions: number;
  totalSkills: number;
  topSkills: Array<{
    name: string;
    questionCount: number;
    confidence: number;
  }>;
}

interface SkillsStatsProps {
  collectionId: string;
}

export function SkillsStats({ collectionId }: SkillsStatsProps): React.ReactElement | null {
  const [stats, setStats] = useState<SkillStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch(`/api/skills/stats?collectionId=${collectionId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [collectionId]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <Card key={i} variant="default">
            <CardContent padding="md">
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-20" />
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

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card variant="default">
          <CardContent padding="md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-none bg-primary/10 flex items-center justify-center">
                <Icon icon="message" size="md" className="text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{stats.totalQuestions}</p>
                <p className="text-xs text-foreground-secondary">Questions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="default">
          <CardContent padding="md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-none bg-primary/10 flex items-center justify-center">
                <Icon icon="star" size="md" className="text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{stats.totalSkills}</p>
                <p className="text-xs text-foreground-secondary">Skills</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Skills */}
      {stats.topSkills.length > 0 && (
        <Card variant="default">
          <CardHeader padding="sm">
            <CardTitle as="h4" className="text-sm font-medium">
              Top Skills
            </CardTitle>
          </CardHeader>
          <CardContent padding="sm" className="pt-0">
            <div className="space-y-3">
              {stats.topSkills.slice(0, 5).map((skill, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" size="sm" className="truncate max-w-[140px]">
                      {skill.name}
                    </Badge>
                    <span className="text-xs text-foreground-secondary">{skill.questionCount} Q</span>
                  </div>
                  <ProgressBar
                    value={skill.confidence * 100}
                    size="sm"
                    variant="primary"
                    showLabel={false}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
