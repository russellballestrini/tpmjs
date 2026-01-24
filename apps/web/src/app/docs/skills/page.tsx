import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tpmjs/ui/Card/Card';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'RealSkills API | TPMJS Docs',
  description:
    'A living skills endpoint that evolves through agent conversations. Skills emerge organically from question patterns.',
};

const exampleResponseJson = `{
  "success": true,
  "data": {
    "answer": "To handle errors with these tools...",
    "confidence": 0.85,
    "basedOn": 3,
    "skillsIdentified": ["error-handling", "try-catch-patterns"],
    "sessionId": "sess_abc123",
    "suggestedFollowups": [
      "What are the retry patterns?",
      "How do I log errors?"
    ]
  },
  "meta": {
    "cached": false,
    "questionId": "clx123abc456",
    "processingMs": 1234
  }
}`;

export default function SkillsPage(): React.ReactElement {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">RealSkills API</h1>
        <p className="text-foreground-secondary text-lg">
          Skills, proven in the wild — not declared on paper.
        </p>
        <p className="text-foreground-secondary mt-2">
          A living skills endpoint that evolves through agent conversations. Unlike static
          documentation, skills emerge organically from question patterns and improve over time.
        </p>
      </div>

      {/* Philosophy */}
      <Card>
        <CardHeader>
          <CardTitle>Philosophy</CardTitle>
          <CardDescription>Why living skills beats static skills.md</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            Traditional documentation is written once and becomes outdated. RealSkills takes a
            different approach:
          </p>
          <ul className="list-disc list-inside space-y-2 text-foreground-secondary">
            <li>
              <strong>Questions drive discovery</strong> — Every agent question reveals what users
              actually need
            </li>
            <li>
              <strong>Answers compound</strong> — Similar questions get better answers based on
              previous responses
            </li>
            <li>
              <strong>Skills emerge</strong> — Patterns in questions automatically create skill
              categories
            </li>
            <li>
              <strong>Quality improves</strong> — More questions = more context = better responses
            </li>
          </ul>
          <p className="text-foreground-secondary">
            Think of it as a knowledge base that learns from every interaction.
          </p>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
          <CardDescription>The question → skill inference loop</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-surface p-4 rounded-lg border border-border font-mono text-sm">
            <pre className="whitespace-pre-wrap">{`Agent POSTs question
        ↓
┌─────────────────────────────┐
│   /skills endpoint          │
│   - Embed question          │
│   - Check similarity cache  │
│   - RAG from stored Q&A     │
│   - Generate response (LLM) │
│   - Store question + answer │
│   - Update skill graph      │
└─────────────────────────────┘
        ↓
    Return skill guidance (markdown)
        ↓
    Skill graph evolves in real-time`}</pre>
          </div>

          <ol className="list-decimal list-inside space-y-3 text-foreground-secondary mt-4">
            <li>
              <strong>Question Received</strong> — Agent submits a question via POST
            </li>
            <li>
              <strong>Embedding Generated</strong> — Question is converted to a 3072-dimensional
              vector
            </li>
            <li>
              <strong>Similarity Check</strong> — If &gt;95% similar to existing question, return
              cached answer
            </li>
            <li>
              <strong>RAG Context</strong> — Find similar past questions/answers for context
            </li>
            <li>
              <strong>Response Generation</strong> — GPT-4.1-mini generates a tailored response
            </li>
            <li>
              <strong>Storage & Graph Update</strong> — Question stored, skills inferred and linked
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* API Reference */}
      <Card>
        <CardHeader>
          <CardTitle>API Reference</CardTitle>
          <CardDescription>GET and POST endpoints</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold mb-2">GET /:username/collections/:slug/skills</h4>
            <p className="text-foreground-secondary text-sm mb-3">
              Returns the skill summary as markdown. Triggers lazy seeding on first access.
            </p>
            <CodeBlock
              code={`curl https://tpmjs.com/ajaxdavis/collections/my-tools/skills`}
              language="bash"
              showCopy={true}
            />
          </div>

          <div>
            <h4 className="font-semibold mb-2">POST /:username/collections/:slug/skills</h4>
            <p className="text-foreground-secondary text-sm mb-3">
              Submit a question and receive an AI-generated response based on the collection&apos;s
              tools and previous Q&amp;A.
            </p>
            <CodeBlock
              code={`curl -X POST https://tpmjs.com/ajaxdavis/collections/my-tools/skills \\
  -H "Content-Type: application/json" \\
  -d '{
    "question": "How do I handle errors with these tools?",
    "agentName": "my-agent",
    "tags": ["error-handling"]
  }'`}
              language="bash"
              showCopy={true}
            />
          </div>
        </CardContent>
      </Card>

      {/* Request Schema */}
      <Card>
        <CardHeader>
          <CardTitle>Request Schema</CardTitle>
          <CardDescription>POST request body format</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CodeBlock
            code={`interface SkillsRequest {
  // Required: The question to ask (5-2000 characters)
  question: string;

  // Optional: Session ID for multi-turn conversations
  sessionId?: string;

  // Optional: Self-reported agent identity
  agentName?: string;

  // Optional: Additional context (max 2000 chars)
  context?: string;

  // Optional: Hint tags to guide response (max 10)
  tags?: string[];
}`}
            language="typescript"
            showCopy={true}
          />

          <div className="bg-background-secondary p-4 rounded-lg mt-4">
            <h4 className="font-semibold text-sm mb-2">Multi-Turn Conversations</h4>
            <p className="text-foreground-secondary text-sm">
              To continue a conversation, include the <code>sessionId</code> from a previous
              response. Sessions maintain context for up to 24 hours and include the last 20
              messages.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Response Schema */}
      <Card>
        <CardHeader>
          <CardTitle>Response Schema</CardTitle>
          <CardDescription>Successful response format</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CodeBlock
            code={`interface SkillsResponse {
  success: boolean;
  data: {
    // Markdown-formatted response
    answer: string;

    // Confidence score (0-1)
    confidence: number;

    // Number of similar questions used for RAG
    basedOn: number;

    // Skills this question relates to
    skillsIdentified: string[];

    // Session ID for continuing conversation
    sessionId?: string;

    // Suggested follow-up questions
    suggestedFollowups?: string[];
  };
  meta: {
    // Whether response was from cache
    cached: boolean;

    // ID of stored question
    questionId: string;

    // Processing time in milliseconds
    processingMs: number;
  };
}`}
            language="typescript"
            showCopy={true}
          />

          <h4 className="font-semibold mt-4">Example Response</h4>
          <CodeBlock
            code={exampleResponseJson}
            language="json"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* Integration Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Guide</CardTitle>
          <CardDescription>How agents should use the Skills API</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <h4 className="font-semibold">1. Initial Discovery</h4>
          <p className="text-foreground-secondary text-sm mb-3">
            When an agent first encounters a collection, fetch the skills summary:
          </p>
          <CodeBlock
            code={`const response = await fetch(\`\${baseUrl}/\${username}/collections/\${slug}/skills\`);
const skillsMarkdown = await response.text();
// Parse or display the markdown summary`}
            language="typescript"
            showCopy={true}
          />

          <h4 className="font-semibold mt-6">2. Asking Questions</h4>
          <p className="text-foreground-secondary text-sm mb-3">
            When the agent needs guidance on using the tools:
          </p>
          <CodeBlock
            code={`const response = await fetch(\`\${baseUrl}/\${username}/collections/\${slug}/skills\`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: "How do I parse JSON responses from the API?",
    agentName: "my-automation-agent",
    tags: ["json", "parsing"]
  })
});

const { data } = await response.json();
console.log(data.answer); // Use this guidance`}
            language="typescript"
            showCopy={true}
          />

          <h4 className="font-semibold mt-6">3. Multi-Turn Conversations</h4>
          <p className="text-foreground-secondary text-sm mb-3">
            For follow-up questions, use the session ID:
          </p>
          <CodeBlock
            code={`// First question
const first = await askSkills("How do I handle pagination?");
const sessionId = first.data.sessionId;

// Follow-up (maintains context)
const followUp = await askSkills(
  "Can you show me an example with async iteration?",
  { sessionId }
);`}
            language="typescript"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle>Best Practices</CardTitle>
          <CardDescription>Effective questioning patterns</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-500/10 p-4 rounded-lg">
              <h5 className="font-semibold text-green-600 dark:text-green-400 text-sm mb-2">
                Good Questions
              </h5>
              <ul className="text-foreground-secondary text-sm space-y-2">
                <li>✓ &quot;How do I handle rate limiting with the API tool?&quot;</li>
                <li>✓ &quot;What&apos;s the best way to batch multiple requests?&quot;</li>
                <li>✓ &quot;Can I use these tools with streaming responses?&quot;</li>
              </ul>
            </div>
            <div className="bg-red-500/10 p-4 rounded-lg">
              <h5 className="font-semibold text-red-600 dark:text-red-400 text-sm mb-2">
                Avoid These
              </h5>
              <ul className="text-foreground-secondary text-sm space-y-2">
                <li>✗ &quot;Tell me everything about this collection&quot;</li>
                <li>✗ Single-word questions like &quot;Help&quot;</li>
                <li>✗ Questions unrelated to the collection&apos;s tools</li>
              </ul>
            </div>
          </div>

          <div className="bg-background-secondary p-4 rounded-lg mt-4">
            <h4 className="font-semibold text-sm mb-2">Tips for Better Responses</h4>
            <ul className="text-foreground-secondary text-sm space-y-1">
              <li>• Be specific about what you&apos;re trying to accomplish</li>
              <li>• Include relevant context in the <code>context</code> field</li>
              <li>• Use tags to hint at the problem domain</li>
              <li>• Use sessions for related follow-up questions</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Confidence Scores */}
      <Card>
        <CardHeader>
          <CardTitle>Confidence Scores</CardTitle>
          <CardDescription>How confidence is calculated</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            Each response includes a confidence score (0-1) based on:
          </p>

          <ul className="list-disc list-inside space-y-2 text-foreground-secondary">
            <li>
              <strong>Base confidence (30%)</strong> — Minimum for any generated response
            </li>
            <li>
              <strong>Similar questions (up to 40%)</strong> — More similar past Q&amp;A = higher
              confidence
            </li>
            <li>
              <strong>Skills documentation (20%)</strong> — Collection has generated skills.md
            </li>
            <li>
              <strong>Question volume (10%)</strong> — 3+ similar questions adds bonus
            </li>
          </ul>

          <div className="bg-background-secondary p-4 rounded-lg mt-4">
            <h4 className="font-semibold text-sm mb-2">Interpreting Scores</h4>
            <ul className="text-foreground-secondary text-sm space-y-1">
              <li>
                <code>&gt;0.8</code> — High confidence, well-supported by prior Q&amp;A
              </li>
              <li>
                <code>0.5-0.8</code> — Moderate confidence, some relevant context
              </li>
              <li>
                <code>&lt;0.5</code> — Lower confidence, limited prior knowledge
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Lazy Seeding */}
      <Card>
        <CardHeader>
          <CardTitle>Lazy Seeding</CardTitle>
          <CardDescription>Automatic bootstrapping on first access</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            When a collection&apos;s skills endpoint is accessed for the first time, it automatically
            seeds with synthetic questions generated from:
          </p>

          <ul className="list-disc list-inside space-y-2 text-foreground-secondary">
            <li>Existing skills.md documentation (if available)</li>
            <li>Tool descriptions and capabilities</li>
            <li>Common use case patterns for the tool category</li>
          </ul>

          <p className="text-foreground-secondary mt-4">
            This ensures the endpoint is useful immediately, even before any real agent interactions.
            Seeding typically adds 10-15 synthetic Q&amp;A pairs.
          </p>

          <div className="bg-background-secondary p-4 rounded-lg mt-4">
            <h4 className="font-semibold text-sm mb-2">Seeding Status Response</h4>
            <p className="text-foreground-secondary text-sm">
              If seeding is in progress when you make a request, you&apos;ll receive a 202 response:
            </p>
            <CodeBlock
              code={`{
  "success": true,
  "data": {
    "status": "seeding",
    "message": "Skills are being generated. Please retry in a few seconds."
  }
}`}
              language="json"
              showCopy={false}
            />
          </div>
        </CardContent>
      </Card>

      {/* Caching */}
      <Card>
        <CardHeader>
          <CardTitle>Caching Behavior</CardTitle>
          <CardDescription>How similar questions are cached</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            Questions with &gt;95% similarity to existing questions return cached answers instantly.
            This provides:
          </p>

          <ul className="list-disc list-inside space-y-2 text-foreground-secondary">
            <li>Faster response times (~50ms vs ~1-2s)</li>
            <li>Reduced API costs</li>
            <li>Consistent answers for equivalent questions</li>
          </ul>

          <p className="text-foreground-secondary mt-4">
            The <code>meta.cached</code> field indicates whether a cached response was used. Cached
            responses increment a <code>similarCount</code> counter for analytics.
          </p>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
          <CardDescription>Continue exploring TPMJS</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-3">
            <li>
              <Link href="/docs/scenarios" className="text-primary hover:underline font-medium">
                Scenarios Guide →
              </Link>
              <p className="text-foreground-secondary text-sm">
                Automated testing for tool collections
              </p>
            </li>
            <li>
              <Link href="/docs/api/collections" className="text-primary hover:underline font-medium">
                Collections API →
              </Link>
              <p className="text-foreground-secondary text-sm">
                Create and manage tool collections
              </p>
            </li>
            <li>
              <Link href="/docs/agents" className="text-primary hover:underline font-medium">
                Agents Documentation →
              </Link>
              <p className="text-foreground-secondary text-sm">
                Build AI agents with your collections
              </p>
            </li>
            <li>
              <Link href="/" className="text-primary hover:underline font-medium">
                Browse Tool Registry →
              </Link>
              <p className="text-foreground-secondary text-sm">
                Discover tools to add to your collections
              </p>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
