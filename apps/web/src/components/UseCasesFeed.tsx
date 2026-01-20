'use client';

/**
 * UseCasesFeed Component
 *
 * Table + search + persona dropdown for browsing use cases
 */

import { useEffect, useState } from 'react';
import useSWR from 'swr';

interface UseCase {
  id: string;
  slug: string;
  marketingTitle: string;
  marketingDesc: string;
  roiEstimate: string | null;
  businessValue: string | null;
  rankScore: number;
  personas: Array<{ persona: { slug: string; name: string } }>;
  industries: Array<{ industry: { slug: string; name: string } }>;
  categories: Array<{ category: { slug: string; name: string; type: string } }>;
  socialProof: {
    qualityScore: number;
    totalRuns: number;
    consecutivePasses: number;
    lastRunStatus: string | null;
    successRate: number | null;
    lastRunAgo: string | null;
  } | null;
  scenario: {
    id: string;
    collection: {
      id: string;
      name: string;
      slug: string | null;
      user: {
        username: string | null;
      };
    } | null;
  };
}

interface UseCasesFeedProps {
  collectionId?: string;
  initialPersona?: string;
  initialSearch?: string;
  initialSort?: string;
}

const PERSONAS = [
  { slug: 'cto', name: 'CTO' },
  { slug: 'product-manager', name: 'Product Manager' },
  { slug: 'developer', name: 'Developer' },
  { slug: 'founder', name: 'Founder' },
  { slug: 'sales-lead', name: 'Sales Lead' },
  { slug: 'support-lead', name: 'Support Lead' },
  { slug: 'data-analyst', name: 'Data Analyst' },
  { slug: 'marketing-manager', name: 'Marketing Manager' },
];

const SORT_OPTIONS = [
  { value: 'rank', label: 'Relevance' },
  { value: 'quality', label: 'Quality Score' },
  { value: 'runs', label: 'Most Runs' },
  { value: 'recent', label: 'Recently Added' },
];

export default function UseCasesFeed({
  collectionId,
  initialPersona = '',
  initialSearch = '',
  initialSort = 'rank',
}: UseCasesFeedProps) {
  const [persona, setPersona] = useState(initialPersona);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(0);

  // Build API URL
  const apiUrl = collectionId
    ? `/api/public/users/${collectionId.split('-')[0]}/collections/${collectionId}/use-cases`
    : '/api/use-cases';

  // Fetch use cases
  const fetchUrl = `${apiUrl}?persona=${persona}&search=${searchQuery}&sort=${sort}&limit=20&offset=${page * 20}`;

  const { data, error, isLoading } = useSWR(fetchUrl, fetcher, {
    revalidateOnFocus: false,
  });

  const useCases: UseCase[] = data?.data?.useCases || [];
  const pagination = data?.data?.pagination || { total: 0, hasMore: false };

  function fetcher(url: string) {
    return fetch(url).then((res) => res.json());
  }

  // Reset page on filter change
  useEffect(() => {
    setPage(0);
  }, []);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search use cases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border bg-background"
          />
        </div>

        {/* Persona dropdown */}
        <select
          value={persona}
          onChange={(e) => setPersona(e.target.value)}
          className="px-4 py-2 rounded-lg border bg-background"
        >
          <option value="">All Personas</option>
          {PERSONAS.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>

        {/* Sort dropdown */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-4 py-2 rounded-lg border bg-background"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {isLoading ? 'Loading...' : `${pagination.total} use cases found`}
      </p>

      {/* Table */}
      {error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
          <p className="text-destructive">Failed to load use cases</p>
        </div>
      ) : useCases.length === 0 && !isLoading ? (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">No use cases found</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Use Case</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Quality</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Runs</th>
                <th className="px-4 py-3 text-left text-sm font-medium hidden sm:table-cell">
                  Personas
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium hidden md:table-cell">
                  Collection
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 10 }).map((_, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: skeleton loading state
                    <tr key={i} className="border-t">
                      <td className="px-4 py-3">
                        <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                      </td>
                    </tr>
                  ))
                : useCases.map((useCase) => (
                    <tr key={useCase.id} className="border-t hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <a
                          href={`/use-cases/${useCase.slug}`}
                          className="font-medium hover:underline"
                        >
                          {useCase.marketingTitle}
                        </a>
                        {useCase.roiEstimate && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {useCase.roiEstimate}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          {useCase.socialProof
                            ? `${Math.round(useCase.socialProof.qualityScore * 100)}%`
                            : 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{useCase.socialProof?.totalRuns || 0}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {useCase.personas.slice(0, 2).map((p) => (
                            <span
                              key={p.persona.slug}
                              className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                            >
                              {p.persona.name}
                            </span>
                          ))}
                          {useCase.personas.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{useCase.personas.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {useCase.scenario.collection ? (
                          <a
                            href={`/${useCase.scenario.collection.user.username}/collections/${useCase.scenario.collection.slug}`}
                            className="text-sm text-muted-foreground hover:text-foreground"
                          >
                            {useCase.scenario.collection.name}
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">Unknown</span>
                        )}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.hasMore && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 rounded-lg border bg-background hover:bg-muted"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
