import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tpmjs/ui/Card/Card';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import type { Metadata } from 'next';
import Link from 'next/link';

import { AppFooter } from '~/components/AppFooter';
import { AppHeader } from '~/components/AppHeader';

export const metadata: Metadata = {
  title: 'Developers Guide | TPMJS Docs',
  description:
    'Understand Scenarios for developers - AI-powered testing, evaluation, and continuous integration for tool collections',
};

export default function DevelopersGuidePage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
          {/* Introduction */}
          <div>
            <h1 className="text-3xl font-bold mb-4">Developers Guide: Scenarios</h1>
            <p className="text-foreground-secondary text-lg">
              Scenarios are TPMJS&apos;s AI-powered testing and evaluation system for tool
              collections. They provide automated testing, quality tracking, and regression
              prevention for your tools.
            </p>
          </div>

          {/* What are Scenarios? */}
          <Card>
            <CardHeader>
              <CardTitle>What Are Scenarios?</CardTitle>
              <CardDescription>
                Automated test cases for tool collections with LLM evaluation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground-secondary">
                A Scenario is a test case that simulates how a real user would interact with your
                tool collection. Unlike traditional unit tests that verify individual functions,
                scenarios exercise your tools end-to-end with realistic prompts and assertions.
              </p>

              <div className="bg-background-secondary p-4 rounded-lg space-y-3">
                <h4 className="font-semibold mb-2">Key Components:</h4>
                <ul className="space-y-2 text-foreground-secondary">
                  <li>
                    <strong>AI Agent Execution:</strong> An ephemeral agent is created with your
                    collection&apos;s tools
                  </li>
                  <li>
                    <strong>Realistic Prompt:</strong> The agent executes your scenario&apos;s
                    prompt against the tools
                  </li>
                  <li>
                    <strong>LLM Evaluation:</strong> An LLM analyzes whether the task was completed
                    successfully
                  </li>
                  <li>
                    <strong>Result Recording:</strong> All results are stored for quality tracking
                    and historical analysis
                  </li>
                </ul>
              </div>

              <p className="text-foreground-secondary">
                Think of scenarios as integration tests with AI intelligence—instead of hard-coded
                assertions, scenarios use natural language evaluation to verify your tools work as
                intended.
              </p>
            </CardContent>
          </Card>

          {/* Why Use Scenarios? */}
          <Card>
            <CardHeader>
              <CardTitle>Why Use Scenarios?</CardTitle>
              <CardDescription>Benefits over traditional testing approaches</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-background-secondary p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">🧪 Continuous Testing</h4>
                  <p className="text-foreground-secondary text-sm">
                    Run scenarios automatically on every code change to catch regressions early.
                  </p>
                </div>
                <div className="bg-background-secondary p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">🎯 AI-Powered Validation</h4>
                  <p className="text-foreground-secondary text-sm">
                    Use LLM evaluation to verify your tools actually solve real problems, not just
                    pass code tests.
                  </p>
                </div>
                <div className="bg-background-secondary p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">📊 Quality Metrics</h4>
                  <p className="text-foreground-secondary text-sm">
                    Track quality scores over time to identify reliable scenarios and areas for
                    improvement.
                  </p>
                </div>
                <div className="bg-background-secondary p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">🔄 CI/CD Ready</h4>
                  <p className="text-foreground-secondary text-sm">
                    Integrate seamlessly into your pipeline with JSON output and exit codes.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-semibold mb-3">When to Use Scenarios</h4>
                <ul className="space-y-2 text-foreground-secondary">
                  <li>
                    <strong>Multi-Tool Integration:</strong> Testing how multiple tools work
                    together in complex workflows
                  </li>
                  <li>
                    <strong>API-First Tools:</strong> Validating tools that make HTTP requests or
                    parse unstructured data
                  </li>
                  <li>
                    <strong>Quality-Critical Collections:</strong> When tool reliability impacts
                    user experience
                  </li>
                  <li>
                    <strong>Regression Prevention:</strong> Before deploying changes that might
                    break existing functionality
                  </li>
                  <li>
                    <strong>Documentation-Driven Testing:</strong> Ensuring tools work as described
                    in their public documentation
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* How Scenarios Work */}
          <Card>
            <CardHeader>
              <CardTitle>How Scenarios Work</CardTitle>
              <CardDescription>Technical implementation and execution flow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">1. Scenario Definition</h4>
                <p className="text-foreground-secondary mb-2">
                  Scenarios are defined as test cases with a prompt, expected outputs, and optional
                  assertions. They can be created manually or AI-generated.
                </p>
                <CodeBlock
                  code={`{
  "name": "Extract user emails from JSON",
  "prompt": "Parse the following JSON and extract all email addresses...",
  "expectedOutput": {
    "type": "array",
    "contains": "email addresses"
  },
  "assertions": [
    {
      "type": "contains",
      "description": "Output should contain email addresses"
    }
  ]
}`}
                  language="json"
                  showCopy={false}
                />
              </div>

              <div>
                <h4 className="font-semibold mb-3">2. Agent Execution</h4>
                <p className="text-foreground-secondary mb-2">
                  When a scenario runs, an ephemeral AI agent is created with your tool collection.
                  The agent executes the scenario prompt using only the tools in that collection—no
                  external access, no additional context.
                </p>
                <CodeBlock
                  code={`Scenario: "Extract user emails"
Collection: ["json-parser", "data-validator"]

→ Create ephemeral agent with collection tools
→ Agent executes scenario prompt: "Parse the following JSON..."
→ Tool calls: json_parser.parse(), data_validator.validate()
→ Agent collects results for LLM evaluation`}
                  language="text"
                  showCopy={false}
                />
              </div>

              <div>
                <h4 className="font-semibold mb-3">3. LLM Evaluation</h4>
                <p className="text-foreground-secondary mb-2">
                  After execution, a powerful LLM evaluates the results. This isn&apos;t just
                  checking for errors—it uses natural language understanding to verify the task was
                  completed correctly.
                </p>
                <CodeBlock
                  code={`EVALUATION PROMPT:
"Analyze the following agent execution results:
1. Did the agent successfully extract all email addresses?
2. Is the output in the expected format?
3. Are there any email addresses that look suspicious (test emails, etc)?

Agent Output: ["user@example.com", "admin@company.org", ...]
→ VERDICT: PASS
→ REASON: "Successfully extracted 5 valid email addresses with no test patterns detected"

Quality Score: 85%
Execution Time: 2.3s`}
                  language="text"
                  showCopy={false}
                />
              </div>

              <div>
                <h4 className="font-semibold mb-3">4. Quality Scoring</h4>
                <p className="text-foreground-secondary mb-2">
                  Quality scores (0-100%) track scenario reliability over time using a streak-based
                  system:
                </p>
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div className="bg-green-500/10 p-4 rounded-lg">
                    <h5 className="font-semibold text-green-600 dark:text-green-400 mb-2">
                      🎉 On Pass
                    </h5>
                    <ul className="space-y-1 text-foreground-secondary text-sm">
                      <li>+50% base score</li>
                      <li>+5% bonus per consecutive pass</li>
                      <li>Maximum: 100%</li>
                    </ul>
                  </div>
                  <div className="bg-red-500/10 p-4 rounded-lg">
                    <h5 className="font-semibold text-red-600 dark:text-red-400 mb-2">
                      ⚠️ On Failure
                    </h5>
                    <ul className="space-y-1 text-foreground-secondary text-sm">
                      <li>-20% base penalty</li>
                      <li>-5% penalty per consecutive fail</li>
                      <li>Minimum: 0%</li>
                    </ul>
                  </div>
                </div>
                <p className="text-foreground-secondary text-sm mt-4">
                  <strong>Example:</strong> A scenario that passes 5 times consecutively earns 25%
                  bonus (50% + 5×5) for a total score of ~75%. High-quality scenarios (75%+) are
                  featured on the TPMJS homepage showcase.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-3">5. Conversation History</h4>
                <p className="text-foreground-secondary mb-2">
                  Every scenario execution captures the full conversation history between the agent,
                  your tools, and any outputs. This enables:
                </p>
                <ul className="space-y-2 text-foreground-secondary ml-4">
                  <li>
                    <strong>Full Transparency:</strong> See exactly what the agent asked and how
                    each tool responded
                  </li>
                  <li>
                    <strong>Debugging:</strong> Inspect tool inputs, outputs, and errors in detail
                  </li>
                  <li>
                    <strong>Raw JSON Export:</strong> Copy the entire conversation for analysis or
                    automation
                  </li>
                  <li>
                    <strong>Usage Metrics:</strong> Track token usage, execution time, and costs per
                    scenario run
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Developer Use Cases */}
          <Card>
            <CardHeader>
              <CardTitle>Developer Use Cases</CardTitle>
              <CardDescription>
                Practical scenarios for integrating scenario testing into your workflow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-l-4 border-border pl-4">
                <h4 className="font-semibold mb-2">🚀 CI/CD Integration</h4>
                <p className="text-foreground-secondary text-sm mb-3">
                  Automate scenario testing in your deployment pipeline to catch regressions before
                  they reach production.
                </p>
                <CodeBlock
                  code={`name: Run Scenarios in CI
on: [push]
jobs:
  test-scenarios:
    runs-on: ubuntu-latest
    steps:
      - name: Install TPMJS CLI
        run: npm install -g @tpmjs/cli

      - name: Authenticate
        run: |
          echo '$' + "{ '{' + "} secrets.TPMJS_API_KEY" + "'" + '}" + "'" + "' > ~/.config/tpmjs/config.json

      - name: Run All Scenarios
        run: tpm scenario run my-collection --json

      - name: Verify Results
        run: |
          FAILED=$(jq '.failed' results.json)
          if [ "$FAILED" -gt 0 ]; then
            echo "❌ Scenario testing failed"
            exit 1
          fi
          echo "✅ All scenarios passed"}`}
                  language="yaml"
                  showCopy={true}
                />
                <p className="text-foreground-secondary text-sm mt-2">
                  <strong>Benefits:</strong> Block deploys on failures, generate test reports, and
                  track quality metrics over time.
                </p>
              </div>

              <div className="border-l-4 border-border pl-4">
                <h4 className="font-semibold mb-2">🔍 Local Development Testing</h4>
                <p className="text-foreground-secondary text-sm mb-3">
                  Test scenarios locally during development to verify tool behavior without
                  consuming quota.
                </p>
                <CodeBlock
                  code={`# Generate scenarios for your tool collection
tpm scenario generate my-collection --count 5

# Test a specific scenario
tpm scenario test clu123abc456

# Run all scenarios
tpm scenario run my-collection

# View detailed conversation history
tpm scenario info clu123abc456 --runs 10

# Export for analysis
tpm scenario info clu123abc456 --json > analysis.json`}
                  language="bash"
                  showCopy={true}
                />
                <p className="text-foreground-secondary text-sm mt-2">
                  <strong>Benefits:</strong> Fast feedback loop, no quota consumption, and detailed
                  execution traces for debugging.
                </p>
              </div>

              <div className="border-l-4 border-border pl-4">
                <h4 className="font-semibold mb-2">📊 Quality Monitoring Dashboard</h4>
                <p className="text-foreground-secondary text-sm mb-3">
                  Use scenario results to build dashboards showing tool reliability, success rates,
                  and performance trends.
                </p>
                <CodeBlock
                  code={`# Export scenario results as JSON
tpm scenario list my-collection --json > metrics.json

# Analyze with scripts
node analyze-metrics.js \\
  --input metrics.json \\
  --output report.html \\
  --chart-type=timeline

# Integrate with external monitoring
curl -X POST https://your-monitoring.com/webhook \\
  -H "Content-Type: application/json" \\
  -d @metrics.json`}
                  language="bash"
                  showCopy={true}
                />
                <p className="text-foreground-secondary text-sm mt-2">
                  <strong>Benefits:</strong> Track improvements over time, identify flaky tools, and
                  demonstrate reliability to users.
                </p>
              </div>

              <div className="border-l-4 border-border pl-4">
                <h4 className="font-semibold mb-2">🎓 Tool Library Development</h4>
                <p className="text-foreground-secondary text-sm mb-3">
                  Ensure your tools work correctly with scenarios before publishing them.
                  High-quality scenarios increase tool visibility on the TPMJS homepage.
                </p>
                <CodeBlock
                  code={`# Create comprehensive scenario suite
1. Define basic scenarios (happy path, error cases, edge cases)
2. Generate diverse scenarios for different tool types
3. Test with various inputs and edge cases
4. Analyze conversation history to identify issues
5. Iterate on prompts to improve quality scores

# Publish tools with high scenario quality
Tools with quality score >75% get featured in homepage showcase
Quality metrics attract more users and increase adoption.`}
                  language="bash"
                  showCopy={false}
                />
              </div>
            </CardContent>
          </Card>

          {/* Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle>Testing Approaches Comparison</CardTitle>
              <CardDescription>Scenarios vs Traditional Testing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Feature</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">
                        Unit Tests
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">
                        Integration Tests
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-primary">Scenarios</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="py-3 px-4 text-foreground-secondary">
                        <strong>Execution Model</strong>
                      </td>
                      <td className="py-3 px-4 text-foreground-secondary">
                        Code runs individual functions
                      </td>
                      <td className="py-3 px-4 text-foreground-secondary">
                        Full system with external services
                      </td>
                      <td className="py-3 px-4 text-foreground">AI agent + your tools</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-foreground-secondary">
                        <strong>Assertions</strong>
                      </td>
                      <td className="py-3 px-4 text-foreground-secondary">
                        Hard-coded conditions (a === b)
                      </td>
                      <td className="py-3 px-4 text-foreground-secondary">
                        Integration with test database
                      </td>
                      <td className="py-3 px-4 text-foreground">LLM natural language evaluation</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-foreground-secondary">
                        <strong>Coverage</strong>
                      </td>
                      <td className="py-3 px-4 text-foreground-secondary">
                        Function-level code coverage
                      </td>
                      <td className="py-3 px-4 text-foreground-secondary">
                        End-to-end workflow coverage
                      </td>
                      <td className="py-3 px-4 text-foreground">Realistic user prompt coverage</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-foreground-secondary">
                        <strong>Maintenance</strong>
                      </td>
                      <td className="py-3 px-4 text-foreground-secondary">
                        Brittle with implementation changes
                      </td>
                      <td className="py-3 px-4 text-foreground-secondary">
                        Better with refactoring
                      </td>
                      <td className="py-3 px-4 text-foreground">Self-healing with AI prompts</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-foreground-secondary">
                        <strong>Debugging</strong>
                      </td>
                      <td className="py-3 px-4 text-foreground-secondary">
                        Stack traces, breakpoints
                      </td>
                      <td className="py-3 px-4 text-foreground-secondary">
                        Network logs, service logs
                      </td>
                      <td className="py-3 px-4 text-foreground">
                        Full conversation history with tool I/O
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-foreground-secondary">
                        <strong>Best For</strong>
                      </td>
                      <td className="py-3 px-4 text-foreground-secondary">
                        Pure algorithms, mathematical functions
                      </td>
                      <td className="py-3 px-4 text-foreground-secondary">
                        Business logic, workflows, APIs
                      </td>
                      <td className="py-3 px-4 text-foreground">
                        AI tools, LLM interaction, realistic prompts
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Future of Scenarios */}
          <Card>
            <CardHeader>
              <CardTitle>The Future of Scenarios</CardTitle>
              <CardDescription>Roadmap and upcoming capabilities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">🤖 Self-Healing Scenarios</h4>
                <p className="text-foreground-secondary text-sm">
                  Scenarios that analyze their own failures and automatically improve their prompts.
                  Failed scenarios can generate fixes or suggest alternative approaches.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">🔄 Continuous Improvement Loop</h4>
                <p className="text-foreground-secondary text-sm">
                  Each scenario run contributes to quality metrics, creating a feedback loop that
                  continuously improves tool quality and scenario design over time.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">🚀 CI/CD Integration</h4>
                <p className="text-foreground-secondary text-sm mb-3">
                  Automate scenario testing in your deployment pipeline to catch regressions before
                  they reach production.
                </p>
                <CodeBlock
                  code={`# Simple CI/CD example
npm install -g @tpmjs/cli
tpm auth login
tpm scenario run my-collection --json
echo "All scenarios ran"`}
                  language="bash"
                  showCopy={true}
                />
                <p className="text-foreground-secondary text-sm mt-2">
                  <strong>Benefits:</strong> Block deploys on failures, generate test reports, and
                  track quality metrics over time.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">📈 Advanced Evaluation Metrics</h4>
                <p className="text-foreground-secondary text-sm">
                  Beyond simple pass/fail, future scenarios will measure token efficiency, response
                  quality, semantic correctness, and hallucination rates.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">🔌 Scenario Marketplace</h4>
                <p className="text-foreground-secondary text-sm">
                  Share high-quality scenarios across organizations, enabling collaborative testing
                  and faster scenario coverage for popular tools.
                </p>
              </div>

              <div className="mt-6 p-4 bg-background-secondary rounded-lg">
                <h4 className="font-semibold mb-3">Vision</h4>
                <p className="text-foreground-secondary text-sm">
                  Scenarios will become the de facto standard for tool quality assurance on TPMJS.
                  Before users install a tool, they&apos;ll see its scenario history, quality
                  scores, and real-world performance metrics.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Getting Started */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Start</CardTitle>
              <CardDescription>Get started with scenarios in 5 minutes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">1. Install TPMJS CLI</h4>
                <CodeBlock code="npm install -g @tpmjs/cli" language="bash" showCopy={true} />
              </div>

              <div>
                <h4 className="font-semibold mb-2">2. Authenticate</h4>
                <p className="text-foreground-secondary text-sm mb-2">
                  Get a TPMJS API key from your{' '}
                  <Link
                    href="/dashboard/settings/tpmjs-api-keys"
                    className="text-primary hover:underline"
                  >
                    dashboard settings
                  </Link>
                </p>
                <CodeBlock code="tpm auth login" language="bash" showCopy={true} />
              </div>

              <div>
                <h4 className="font-semibold mb-2">3. Create a Collection</h4>
                <p className="text-foreground-secondary text-sm mb-2">
                  Add tools to a collection if you don&apos;t have one yet.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">4. Generate Your First Scenario</h4>
                <CodeBlock
                  code={`# Generate a single scenario (AI creates prompt automatically)
tpm scenario generate my-collection

# Generate multiple scenarios
tpm scenario generate my-collection --count 5

# List all scenarios
tpm scenario list my-collection
`}
                  language="bash"
                  showCopy={true}
                />
              </div>

              <div>
                <h4 className="font-semibold mb-2">5. Run Your Scenarios</h4>
                <CodeBlock
                  code={`# Test a single scenario
tpm scenario test clu123abc456

# Run all scenarios in a collection
tpm scenario run my-collection

# View detailed results with conversation history
tpm scenario info clu123abc456
`}
                  language="bash"
                  showCopy={true}
                />
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
              <CardDescription>Continue your journey</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/docs/api/scenarios"
                    className="text-primary hover:underline font-medium"
                  >
                    Scenarios API Reference →
                  </Link>
                  <p className="text-foreground-secondary text-sm">
                    REST API endpoints for programmatic scenario management
                  </p>
                </li>
                <li>
                  <Link href="/docs/scenarios" className="text-primary hover:underline font-medium">
                    Scenarios CLI Guide →
                  </Link>
                  <p className="text-foreground-secondary text-sm">
                    Complete CLI commands for scenario generation and execution
                  </p>
                </li>
                <li>
                  <Link href="/docs/agents" className="text-primary hover:underline font-medium">
                    Agents Documentation →
                  </Link>
                  <p className="text-foreground-secondary text-sm">
                    Learn how scenarios use agents internally for execution
                  </p>
                </li>
                <li>
                  <Link
                    href="/dashboard/collections"
                    className="text-primary hover:underline font-medium"
                  >
                    My Collections →
                  </Link>
                  <p className="text-foreground-secondary text-sm">
                    Create and manage collections with your tools
                  </p>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
