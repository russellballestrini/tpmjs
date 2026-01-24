'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@tpmjs/ui/Card/Card';
import { Icon } from '@tpmjs/ui/Icon/Icon';
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
      <div className="grid grid-cols-2 gap-3">
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
      <Card variant="default" className="border-red-200 bg-red-50">
        <CardContent padding="md">
          <p className="text-sm text-red-600">{error}</p>
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
      <div className="grid grid-cols-2 gap-3">
        <Card variant="default">
          <CardContent padding="md">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-50">
                <Icon icon="message" size="md" className="text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.totalQuestions}</p>
                <p className="text-xs text-foreground-secondary">Questions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="default">
          <CardContent padding="md">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-50">
                <Icon icon="star" size="md" className="text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.totalSkills}</p>
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
            <div className="space-y-2">
              {stats.topSkills.slice(0, 5).map((skill, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="outline" size="sm" className="truncate max-w-[180px]">
                      {skill.name}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground-secondary flex-shrink-0">
                    <span>{skill.questionCount} Q</span>
                    <div
                      className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden"
                      title={`${Math.round(skill.confidence * 100)}% confidence`}
                    >
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${skill.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
