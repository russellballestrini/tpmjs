'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { useState } from 'react';
import { SkillsActivityFeed } from './SkillsActivityFeed';
import { SkillsStats } from './SkillsStats';

interface SkillsSectionProps {
  collectionId: string;
  username: string;
  slug: string;
}

export function SkillsSection({
  collectionId,
  username,
  slug,
}: SkillsSectionProps): React.ReactElement {
  const [showApiDocs, setShowApiDocs] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://tpmjs.com';
  const skillsUrl = `${baseUrl}/${username}/collections/${slug}/skills`;

  const apiExample = `# Ask a question about this collection's tools
curl -X POST "${skillsUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "question": "How do I handle errors with these tools?",
    "agentName": "my-agent"
  }'`;

  const responseExample = `{
  "success": true,
  "data": {
    "answer": "To handle errors with these tools...",
    "confidence": 0.85,
    "basedOn": 3,
    "skillsIdentified": ["error-handling", "debugging"],
    "suggestedFollowups": [
      "What are the retry patterns?",
      "How do I log errors?"
    ]
  },
  "meta": {
    "cached": false,
    "questionId": "clx...",
    "processingMs": 1234
  }
}`;

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-100 rounded-lg">
            <Icon icon="star" className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Skills</h2>
            <p className="text-xs text-foreground-tertiary">
              Proven in the wild — not declared on paper
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowApiDocs(!showApiDocs)}>
            <Icon icon="terminal" className="w-4 h-4 mr-1" />
            API
          </Button>
          <Link href={`/${username}/collections/${slug}/skills`}>
            <Button variant="secondary" size="sm">
              <Icon icon="externalLink" className="w-4 h-4 mr-1" />
              Full Docs
            </Button>
          </Link>
        </div>
      </div>

      {/* API Documentation Toggle */}
      {showApiDocs && (
        <div className="p-4 bg-surface border border-border rounded-lg space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">API Endpoint</h4>
            <div className="px-3 py-2 bg-background border border-border rounded-lg font-mono text-sm text-foreground-secondary overflow-x-auto">
              POST {skillsUrl}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Example Request</h4>
            <CodeBlock language="bash" code={apiExample} />
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Example Response</h4>
            <CodeBlock language="json" code={responseExample} />
          </div>

          <div className="text-xs text-foreground-tertiary">
            <Link href="/docs/skills" className="text-primary hover:underline">
              View full API documentation
            </Link>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Stats Column */}
        <div className="md:col-span-1">
          <SkillsStats collectionId={collectionId} />
        </div>

        {/* Activity Feed Column */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-foreground-secondary">Recent Questions</h3>
          </div>
          <SkillsActivityFeed collectionId={collectionId} limit={5} />
        </div>
      </div>

      {/* CTA for empty state */}
      <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Icon icon="message" className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              Ask questions to build the skill graph
            </p>
            <p className="text-xs text-foreground-secondary">
              Every question helps improve future responses for all agents.
            </p>
          </div>
          <Button variant="default" size="sm" onClick={() => setShowApiDocs(!showApiDocs)}>
            Get Started
          </Button>
        </div>
      </div>
    </section>
  );
}
