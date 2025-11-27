'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tpmjs/ui/Card/Card';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import { Container } from '@tpmjs/ui/Container/Container';
import { Header } from '@tpmjs/ui/Header/Header';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { ProgressBar } from '@tpmjs/ui/ProgressBar/ProgressBar';
import Link from 'next/link';
import { createElement, useEffect, useState } from 'react';

interface Tool {
  id: string;
  npmPackageName: string;
  npmVersion: string;
  description: string;
  category: string;
  tags: string[];
  npmRepository: { url: string; type: string } | null;
  qualityScore: string;
  isOfficial: boolean;
  npmDownloadsLastMonth: number;
  npmDownloadsLastWeek: number;
  tpmjsMetadata: {
    example?: string;
    parameters?: Array<{
      name: string;
      type: string;
      description: string;
      required: boolean;
      default?: unknown;
    }>;
    returns?: {
      type: string;
      description: string;
    };
    authentication?: {
      required: boolean;
      type?: string;
    };
    pricing?: {
      model: string;
    };
    frameworks?: string[];
    links?: {
      documentation?: string;
      repository?: string;
      homepage?: string;
    };
    aiAgent?: {
      useCase?: string;
      limitations?: string;
      examples?: string[];
    };
  } | null;
  githubStars: number | null;
  npmLicense: string | null;
  npmKeywords: string[];
  createdAt: string;
  updatedAt: string;
}

export default function ToolDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): React.ReactElement {
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slug, setSlug] = useState<string>('');

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    if (!slug) return;

    const fetchTool = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/tools/${encodeURIComponent(slug)}`);
        const data = await response.json();

        if (data.success) {
          setTool(data.data);
          setError(null);
        } else {
          setError(data.error || 'Failed to fetch tool');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchTool();
  }, [slug]);

  if (loading) {
    return createElement('div', { className: 'min-h-screen bg-background' }, [
      createElement(Header, {
        key: 'header',
        title: createElement('div', { className: 'flex items-center gap-2' }, [
          createElement(Link, { key: 'link', href: '/', className: 'flex items-center gap-2' }, [
            createElement('span', { key: 'title', className: 'text-2xl font-bold' }, 'TPMJS'),
            createElement(Badge, { key: 'badge', variant: 'outline', size: 'sm' }, 'Beta'),
          ]),
        ]),
        sticky: true,
        size: 'md',
      }),
      createElement(
        Container,
        { key: 'container', size: 'xl', padding: 'md', className: 'py-12' },
        createElement(
          'div',
          { className: 'text-center text-foreground-secondary' },
          'Loading tool...'
        )
      ),
    ]);
  }

  if (error || !tool) {
    return createElement('div', { className: 'min-h-screen bg-background' }, [
      createElement(Header, {
        key: 'header',
        title: createElement('div', { className: 'flex items-center gap-2' }, [
          createElement(Link, { key: 'link', href: '/', className: 'flex items-center gap-2' }, [
            createElement('span', { key: 'title', className: 'text-2xl font-bold' }, 'TPMJS'),
            createElement(Badge, { key: 'badge', variant: 'outline', size: 'sm' }, 'Beta'),
          ]),
        ]),
        sticky: true,
        size: 'md',
      }),
      createElement(
        Container,
        { key: 'container', size: 'xl', padding: 'md', className: 'py-12' },
        createElement(
          'div',
          { className: 'text-center' },
          createElement('p', { className: 'text-red-500 text-lg mb-4' }, error || 'Tool not found'),
          createElement(
            Link,
            { href: '/tool/tool-search' },
            createElement(Button, { variant: 'default' }, 'Browse All Tools')
          )
        )
      ),
    ]);
  }

  return createElement('div', { className: 'min-h-screen bg-background' }, [
    // Header
    createElement(Header, {
      key: 'header',
      title: createElement('div', { className: 'flex items-center gap-2' }, [
        createElement(Link, { key: 'link', href: '/', className: 'flex items-center gap-2' }, [
          createElement('span', { key: 'title', className: 'text-2xl font-bold' }, 'TPMJS'),
          createElement(Badge, { key: 'badge', variant: 'outline', size: 'sm' }, 'Beta'),
        ]),
      ]),
      actions: createElement('div', { className: 'flex items-center gap-3' }, [
        createElement(
          Link,
          { key: 'browse', href: '/tool/tool-search' },
          createElement(Button, { variant: 'ghost', size: 'sm' }, 'Browse Tools')
        ),
        tool.npmRepository
          ? createElement(
              'a',
              {
                key: 'github',
                href: tool.npmRepository.url.replace('git+', '').replace('.git', ''),
                target: '_blank',
                rel: 'noopener noreferrer',
                className: 'text-foreground-secondary hover:text-foreground transition-colors',
              },
              createElement(Icon, { icon: 'github', size: 'md' })
            )
          : null,
      ]),
      sticky: true,
      size: 'md',
    }),

    // Main content
    createElement(Container, { key: 'container', size: 'xl', padding: 'md', className: 'py-8' }, [
      // Breadcrumb
      createElement(
        'div',
        {
          key: 'breadcrumb',
          className: 'flex items-center gap-2 text-sm text-foreground-secondary mb-6',
        },
        [
          createElement(
            Link,
            { key: 'home', href: '/', className: 'hover:text-foreground' },
            'Home'
          ),
          createElement('span', { key: 'sep1' }, '/'),
          createElement(
            Link,
            { key: 'tools', href: '/tool/tool-search', className: 'hover:text-foreground' },
            'Tools'
          ),
          createElement('span', { key: 'sep2' }, '/'),
          createElement(
            'span',
            { key: 'current', className: 'text-foreground' },
            tool.npmPackageName
          ),
        ]
      ),

      // Title section
      createElement('div', { key: 'title-section', className: 'mb-8' }, [
        createElement(
          'div',
          { key: 'title-row', className: 'flex items-start justify-between mb-4' },
          [
            createElement('div', { key: 'title-content' }, [
              createElement(
                'h1',
                { key: 'title', className: 'text-4xl font-bold text-foreground mb-2' },
                tool.npmPackageName
              ),
              createElement(
                'p',
                { key: 'description', className: 'text-lg text-foreground-secondary' },
                tool.description
              ),
            ]),
            tool.isOfficial
              ? createElement(
                  Badge,
                  { key: 'official', variant: 'default', size: 'lg' },
                  'Official'
                )
              : null,
          ]
        ),
        createElement('div', { key: 'badges', className: 'flex flex-wrap gap-2' }, [
          createElement(Badge, { key: 'category', variant: 'secondary' }, tool.category),
          createElement(Badge, { key: 'version', variant: 'outline' }, `v${tool.npmVersion}`),
          tool.npmLicense
            ? createElement(Badge, { key: 'license', variant: 'outline' }, tool.npmLicense)
            : null,
        ]),
      ]),

      // Main grid
      createElement(
        'div',
        { key: 'main-grid', className: 'grid grid-cols-1 lg:grid-cols-3 gap-6' },
        [
          // Left column - Main content
          createElement('div', { key: 'left-col', className: 'lg:col-span-2 space-y-6' }, [
            // Installation
            createElement(Card, { key: 'installation' }, [
              createElement(CardHeader, { key: 'header' }, [
                createElement(CardTitle, { key: 'title' }, 'Installation'),
                createElement(
                  CardDescription,
                  { key: 'desc' },
                  'Install this tool using your preferred package manager'
                ),
              ]),
              createElement(CardContent, { key: 'content', className: 'space-y-4' }, [
                createElement(CodeBlock, {
                  key: 'npm',
                  code: `npm install ${tool.npmPackageName}`,
                  language: 'bash',
                  showCopy: true,
                }),
                createElement(CodeBlock, {
                  key: 'yarn',
                  code: `yarn add ${tool.npmPackageName}`,
                  language: 'bash',
                  showCopy: true,
                }),
                createElement(CodeBlock, {
                  key: 'pnpm',
                  code: `pnpm add ${tool.npmPackageName}`,
                  language: 'bash',
                  showCopy: true,
                }),
              ]),
            ]),

            // Usage Example
            tool.tpmjsMetadata?.example
              ? createElement(Card, { key: 'example' }, [
                  createElement(CardHeader, { key: 'header' }, [
                    createElement(CardTitle, { key: 'title' }, 'Usage Example'),
                    createElement(CardDescription, { key: 'desc' }, 'Quick start example'),
                  ]),
                  createElement(
                    CardContent,
                    { key: 'content' },
                    createElement(CodeBlock, {
                      code: tool.tpmjsMetadata.example,
                      language: 'typescript',
                      showCopy: true,
                    })
                  ),
                ])
              : null,

            // AI Agent Information
            tool.tpmjsMetadata?.aiAgent
              ? createElement(Card, { key: 'ai-agent' }, [
                  createElement(CardHeader, { key: 'header' }, [
                    createElement(CardTitle, { key: 'title' }, 'AI Agent Integration'),
                    createElement(
                      CardDescription,
                      { key: 'desc' },
                      'How AI agents can use this tool'
                    ),
                  ]),
                  createElement(CardContent, { key: 'content', className: 'space-y-4' }, [
                    tool.tpmjsMetadata.aiAgent.useCase
                      ? createElement('div', { key: 'usecase' }, [
                          createElement(
                            'h4',
                            {
                              key: 'title',
                              className: 'text-sm font-semibold text-foreground mb-2',
                            },
                            'Use Case'
                          ),
                          createElement(
                            'p',
                            { key: 'text', className: 'text-sm text-foreground-secondary' },
                            tool.tpmjsMetadata.aiAgent.useCase
                          ),
                        ])
                      : null,
                    tool.tpmjsMetadata.aiAgent.limitations
                      ? createElement('div', { key: 'limitations' }, [
                          createElement(
                            'h4',
                            {
                              key: 'title',
                              className: 'text-sm font-semibold text-foreground mb-2',
                            },
                            'Limitations'
                          ),
                          createElement(
                            'p',
                            { key: 'text', className: 'text-sm text-foreground-secondary' },
                            tool.tpmjsMetadata.aiAgent.limitations
                          ),
                        ])
                      : null,
                    tool.tpmjsMetadata.aiAgent.examples &&
                    tool.tpmjsMetadata.aiAgent.examples.length > 0
                      ? createElement('div', { key: 'examples' }, [
                          createElement(
                            'h4',
                            {
                              key: 'title',
                              className: 'text-sm font-semibold text-foreground mb-2',
                            },
                            'Examples'
                          ),
                          createElement(
                            'ul',
                            { key: 'list', className: 'list-disc list-inside space-y-1' },
                            tool.tpmjsMetadata.aiAgent.examples.map((example, i) =>
                              createElement(
                                'li',
                                { key: i, className: 'text-sm text-foreground-secondary' },
                                example
                              )
                            )
                          ),
                        ])
                      : null,
                  ]),
                ])
              : null,

            // Parameters
            tool.tpmjsMetadata?.parameters && tool.tpmjsMetadata.parameters.length > 0
              ? createElement(Card, { key: 'parameters' }, [
                  createElement(CardHeader, { key: 'header' }, [
                    createElement(CardTitle, { key: 'title' }, 'Parameters'),
                    createElement(
                      CardDescription,
                      { key: 'desc' },
                      'Available configuration options'
                    ),
                  ]),
                  createElement(
                    CardContent,
                    { key: 'content' },
                    createElement(
                      'div',
                      { className: 'space-y-4' },
                      tool.tpmjsMetadata.parameters.map((param) =>
                        createElement(
                          'div',
                          {
                            key: param.name,
                            className: 'border-b border-border pb-4 last:border-0',
                          },
                          [
                            createElement(
                              'div',
                              { key: 'header', className: 'flex items-start justify-between mb-2' },
                              [
                                createElement(
                                  'code',
                                  { key: 'name', className: 'text-sm font-mono text-foreground' },
                                  param.name
                                ),
                                param.required
                                  ? createElement(
                                      Badge,
                                      { key: 'required', variant: 'error', size: 'sm' },
                                      'Required'
                                    )
                                  : createElement(
                                      Badge,
                                      { key: 'optional', variant: 'outline', size: 'sm' },
                                      'Optional'
                                    ),
                              ]
                            ),
                            createElement(
                              'div',
                              { key: 'type', className: 'text-sm text-foreground-secondary mb-1' },
                              [
                                createElement(
                                  'span',
                                  { key: 'label', className: 'font-semibold' },
                                  'Type: '
                                ),
                                createElement(
                                  'code',
                                  { key: 'value', className: 'font-mono' },
                                  param.type
                                ),
                              ]
                            ),
                            createElement(
                              'p',
                              { key: 'desc', className: 'text-sm text-foreground-secondary' },
                              param.description
                            ),
                            param.default !== undefined
                              ? createElement(
                                  'div',
                                  {
                                    key: 'default',
                                    className: 'text-sm text-foreground-tertiary mt-1',
                                  },
                                  [
                                    createElement(
                                      'span',
                                      { key: 'label', className: 'font-semibold' },
                                      'Default: '
                                    ),
                                    createElement(
                                      'code',
                                      { key: 'value', className: 'font-mono' },
                                      JSON.stringify(param.default)
                                    ),
                                  ]
                                )
                              : null,
                          ]
                        )
                      )
                    )
                  ),
                ])
              : null,
          ]),

          // Right column - Sidebar
          createElement('div', { key: 'right-col', className: 'space-y-6' }, [
            // Stats
            createElement(Card, { key: 'stats' }, [
              createElement(
                CardHeader,
                { key: 'header' },
                createElement(CardTitle, { key: 'title' }, 'Statistics')
              ),
              createElement(CardContent, { key: 'content', className: 'space-y-4' }, [
                createElement('div', { key: 'downloads' }, [
                  createElement(
                    'p',
                    { key: 'label', className: 'text-sm text-foreground-secondary mb-1' },
                    'Downloads/month'
                  ),
                  createElement(
                    'p',
                    { key: 'value', className: 'text-2xl font-bold text-foreground' },
                    tool.npmDownloadsLastMonth.toLocaleString()
                  ),
                ]),
                tool.githubStars !== null
                  ? createElement('div', { key: 'stars' }, [
                      createElement(
                        'p',
                        { key: 'label', className: 'text-sm text-foreground-secondary mb-1' },
                        'GitHub Stars'
                      ),
                      createElement(
                        'p',
                        { key: 'value', className: 'text-2xl font-bold text-foreground' },
                        tool.githubStars.toLocaleString()
                      ),
                    ])
                  : null,
                createElement('div', { key: 'quality' }, [
                  createElement(
                    'p',
                    { key: 'label', className: 'text-sm text-foreground-secondary mb-2' },
                    'Quality Score'
                  ),
                  createElement(ProgressBar, {
                    key: 'bar',
                    value: Number.parseFloat(tool.qualityScore) * 100,
                    variant:
                      Number.parseFloat(tool.qualityScore) >= 0.7
                        ? 'success'
                        : Number.parseFloat(tool.qualityScore) >= 0.5
                          ? 'primary'
                          : 'warning',
                    size: 'md',
                    showLabel: true,
                  }),
                ]),
              ]),
            ]),

            // Tags
            tool.tags.length > 0
              ? createElement(Card, { key: 'tags' }, [
                  createElement(
                    CardHeader,
                    { key: 'header' },
                    createElement(CardTitle, { key: 'title' }, 'Tags')
                  ),
                  createElement(
                    CardContent,
                    { key: 'content' },
                    createElement(
                      'div',
                      { className: 'flex flex-wrap gap-2' },
                      tool.tags.map((tag) =>
                        createElement(Badge, { key: tag, variant: 'outline', size: 'sm' }, tag)
                      )
                    )
                  ),
                ])
              : null,

            // Links
            createElement(Card, { key: 'links' }, [
              createElement(
                CardHeader,
                { key: 'header' },
                createElement(CardTitle, { key: 'title' }, 'Links')
              ),
              createElement(CardContent, { key: 'content', className: 'space-y-2' }, [
                createElement(
                  'a',
                  {
                    key: 'npm',
                    href: `https://www.npmjs.com/package/${tool.npmPackageName}`,
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    className:
                      'flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground',
                  },
                  [
                    createElement(Icon, { key: 'icon', icon: 'externalLink', size: 'sm' }),
                    createElement('span', { key: 'text' }, 'View on NPM'),
                  ]
                ),
                tool.tpmjsMetadata?.links?.documentation
                  ? createElement(
                      'a',
                      {
                        key: 'docs',
                        href: tool.tpmjsMetadata.links.documentation,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        className:
                          'flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground',
                      },
                      [
                        createElement(Icon, { key: 'icon', icon: 'externalLink', size: 'sm' }),
                        createElement('span', { key: 'text' }, 'Documentation'),
                      ]
                    )
                  : null,
                tool.tpmjsMetadata?.links?.repository
                  ? createElement(
                      'a',
                      {
                        key: 'repo',
                        href: tool.tpmjsMetadata.links.repository,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        className:
                          'flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground',
                      },
                      [
                        createElement(Icon, { key: 'icon', icon: 'github', size: 'sm' }),
                        createElement('span', { key: 'text' }, 'Repository'),
                      ]
                    )
                  : null,
                tool.tpmjsMetadata?.links?.homepage
                  ? createElement(
                      'a',
                      {
                        key: 'home',
                        href: tool.tpmjsMetadata.links.homepage,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        className:
                          'flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground',
                      },
                      [
                        createElement(Icon, { key: 'icon', icon: 'externalLink', size: 'sm' }),
                        createElement('span', { key: 'text' }, 'Homepage'),
                      ]
                    )
                  : null,
              ]),
            ]),

            // Frameworks
            tool.tpmjsMetadata?.frameworks && tool.tpmjsMetadata.frameworks.length > 0
              ? createElement(Card, { key: 'frameworks' }, [
                  createElement(
                    CardHeader,
                    { key: 'header' },
                    createElement(CardTitle, { key: 'title' }, 'Frameworks')
                  ),
                  createElement(
                    CardContent,
                    { key: 'content' },
                    createElement(
                      'div',
                      { className: 'flex flex-wrap gap-2' },
                      tool.tpmjsMetadata.frameworks.map((framework) =>
                        createElement(
                          Badge,
                          { key: framework, variant: 'secondary', size: 'sm' },
                          framework
                        )
                      )
                    )
                  ),
                ])
              : null,
          ]),
        ]
      ),
    ]),
  ]);
}
