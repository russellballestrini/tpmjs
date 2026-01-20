'use client';

/**
 * UseCaseCaseStudy Component
 *
 * Hero, story, technical proof, related use cases
 */

interface UseCase {
  id: string;
  slug: string;
  marketingTitle: string;
  marketingDesc: string;
  roiEstimate: string | null;
  businessValue: string | null;
  problemStatement: string | null;
  solutionNarrative: string | null;
  rankScore: number;
  createdAt: Date;
  lastRegeneratedAt: Date | null;
  personas: Array<{
    persona: {
      slug: string;
      name: string;
      description: string | null;
      icon: string | null;
    };
  }>;
  industries: Array<{
    industry: {
      slug: string;
      name: string;
      description: string | null;
    };
  }>;
  categories: Array<{
    category: {
      slug: string;
      name: string;
      type: string;
      description: string | null;
    };
  }>;
  socialProof: {
    qualityScore: number;
    totalRuns: number;
    consecutivePasses: number;
    lastRunStatus: string | null;
    lastRunAt: Date | null;
    successRate: number | null;
    lastRunAgo: string | null;
  } | null;
  scenario: {
    id: string;
    prompt: string;
    name: string | null;
    description: string | null;
    tags: string[];
    qualityScore: number;
    totalRuns: number;
    lastRunStatus: string | null;
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

interface UseCaseCaseStudyProps {
  useCase: UseCase;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: case study component
export default function UseCaseCaseStudy({ useCase }: UseCaseCaseStudyProps) {
  const qualityPercent = useCase.socialProof
    ? Math.round(useCase.socialProof.qualityScore * 100)
    : 0;

  const successRate = useCase.socialProof?.successRate
    ? Math.round(useCase.socialProof.successRate * 100)
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-12">
          <div className="mx-auto max-w-3xl">
            {/* Breadcrumb */}
            {useCase.scenario.collection && (
              <p className="text-sm text-muted-foreground">
                <a
                  href={`/${useCase.scenario.collection.user.username}/collections/${useCase.scenario.collection.slug}/use-cases`}
                  className="hover:text-foreground"
                >
                  {useCase.scenario.collection.name}
                </a>
                {' / '}Use Case
              </p>
            )}

            {/* Title */}
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              {useCase.marketingTitle}
            </h1>

            {/* Description */}
            <p className="mt-4 text-xl text-muted-foreground">{useCase.marketingDesc}</p>

            {/* Key stats */}
            <div className="mt-8 flex flex-wrap gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Quality Score</p>
                <p className="text-2xl font-bold text-green-600">{qualityPercent}%</p>
              </div>
              {useCase.socialProof && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Runs</p>
                    <p className="text-2xl font-bold">{useCase.socialProof.totalRuns}</p>
                  </div>
                  {successRate !== null && (
                    <div>
                      <p className="text-sm text-muted-foreground">Success Rate</p>
                      <p className="text-2xl font-bold">{successRate}%</p>
                    </div>
                  )}
                </>
              )}
              {useCase.roiEstimate && (
                <div>
                  <p className="text-sm text-muted-foreground">ROI Estimate</p>
                  <p className="text-2xl font-bold">{useCase.roiEstimate}</p>
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="mt-8">
              <a
                href={`/playground?scenarioId=${useCase.scenario.id}`}
                className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90"
              >
                Try This Use Case
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-3xl space-y-12">
          {/* Problem Statement */}
          {useCase.problemStatement && (
            <section>
              <h2 className="text-2xl font-bold">The Problem</h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                {useCase.problemStatement}
              </p>
            </section>
          )}

          {/* Solution Narrative */}
          {useCase.solutionNarrative && (
            <section>
              <h2 className="text-2xl font-bold">The Solution</h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                {useCase.solutionNarrative}
              </p>
            </section>
          )}

          {/* Business Value */}
          {useCase.businessValue && (
            <section>
              <h2 className="text-2xl font-bold">Business Value</h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                {useCase.businessValue}
              </p>
            </section>
          )}

          {/* Technical Proof */}
          <section>
            <h2 className="text-2xl font-bold">Technical Proof</h2>

            <div className="mt-4 rounded-lg border bg-card p-6">
              {/* Scenario prompt */}
              <div>
                <h3 className="font-semibold">Scenario Prompt</h3>
                <p className="mt-2 text-sm text-muted-foreground">{useCase.scenario.prompt}</p>
              </div>

              {/* Quality metrics */}
              <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Quality</p>
                  <p className="text-lg font-semibold">
                    {Math.round(useCase.scenario.qualityScore * 100)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Runs</p>
                  <p className="text-lg font-semibold">{useCase.scenario.totalRuns}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p
                    className={`text-lg font-semibold ${
                      useCase.scenario.lastRunStatus === 'pass' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {useCase.scenario.lastRunStatus === 'pass' ? 'Passing' : 'Failing'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Run</p>
                  <p className="text-lg font-semibold">
                    {useCase.socialProof?.lastRunAgo || 'Never'}
                  </p>
                </div>
              </div>

              {/* Tools used */}
              {useCase.scenario.collection && (
                <div className="mt-6">
                  <h3 className="font-semibold">Collection</h3>
                  <a
                    href={`/${useCase.scenario.collection.user.username}/collections/${useCase.scenario.collection.slug}`}
                    className="mt-2 block text-sm text-primary hover:underline"
                  >
                    {useCase.scenario.collection.name}
                  </a>
                  <a
                    href={`/${useCase.scenario.collection.user.username}/collections/${useCase.scenario.collection.slug}/scenarios/${useCase.scenario.id}`}
                    className="mt-2 block text-sm text-primary hover:underline"
                  >
                    View scenario details
                  </a>
                </div>
              )}
            </div>
          </section>

          {/* Tags */}
          {useCase.scenario.tags.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold">Tags</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {useCase.scenario.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Personas */}
          {useCase.personas.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold">For These Roles</h2>
              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                {useCase.personas.map((p) => (
                  <div key={p.persona.slug} className="rounded-lg border bg-card p-4">
                    <p className="font-semibold">
                      {p.persona.icon && <span className="mr-2">{p.persona.icon}</span>}
                      {p.persona.name}
                    </p>
                    {p.persona.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{p.persona.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Industries */}
          {useCase.industries.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold">Industries</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {useCase.industries.map((ind) => (
                  <span
                    key={ind.industry.slug}
                    className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                  >
                    {ind.industry.name}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Categories */}
          {useCase.categories.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold">Categories</h2>
              <div className="mt-4 space-y-2">
                {useCase.categories.map((cat) => (
                  <span
                    key={cat.category.slug}
                    className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 mr-2"
                  >
                    {cat.category.name}
                    <span className="ml-1 text-xs opacity-70">({cat.category.type})</span>
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
