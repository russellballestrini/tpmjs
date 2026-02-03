import { Button } from '@tpmjs/ui/Button/Button';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import type { Metadata } from 'next';
import Link from 'next/link';

import { AppFooter } from '~/components/AppFooter';
import { AppHeader } from '~/components/AppHeader';

export const metadata: Metadata = {
  title: 'Deploy to Vercel - Custom Executors - TPMJS',
  description:
    'Deploy a TPMJS executor to Vercel with one click. VM-level isolation using Vercel Sandbox.',
};

const healthCheck = `curl https://your-executor.vercel.app/api/health`;

const healthResponse = `{
  "status": "ok",
  "version": "1.0.0",
  "info": {
    "runtime": "vercel-sandbox",
    "region": "iad1",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}`;

const executeExample = `curl -X POST https://your-executor.vercel.app/api/execute-tool \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer your-api-key" \\
  -d '{
    "packageName": "@tpmjs/hello",
    "name": "helloWorld",
    "version": "latest",
    "params": { "name": "World" }
  }'`;

const localDev = `# Clone and install
git clone https://github.com/tpmjs/tpmjs.git
cd tpmjs/templates/vercel-executor
npm install

# Login to Vercel (required for sandbox)
vercel login
vercel link

# Pull environment variables
vercel env pull

# Run development server
npm run dev

# Test health endpoint
curl http://localhost:3000/api/health`;

export default function VercelExecutorPage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-foreground-secondary mb-8">
            <Link href="/docs/executors" className="hover:text-foreground transition-colors">
              Executors
            </Link>
            <Icon icon="chevronRight" className="w-4 h-4" />
            <span className="text-foreground">Vercel</span>
          </nav>

          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  viewBox="0 0 76 65"
                  fill="currentColor"
                  aria-label="Vercel logo"
                >
                  <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Deploy to Vercel</h1>
                <p className="text-foreground-secondary">
                  One-click deploy with VM-level isolation
                </p>
              </div>
            </div>
          </div>

          {/* Why Vercel */}
          <section className="mb-12">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-surface border border-border rounded-lg">
                <div className="text-2xl mb-2">1-click</div>
                <div className="text-sm text-foreground-secondary">Deploy instantly</div>
              </div>
              <div className="p-4 bg-surface border border-border rounded-lg">
                <div className="text-2xl mb-2">VM</div>
                <div className="text-sm text-foreground-secondary">Sandbox isolation</div>
              </div>
              <div className="p-4 bg-surface border border-border rounded-lg">
                <div className="text-2xl mb-2">Free</div>
                <div className="text-sm text-foreground-secondary">Hobby tier available</div>
              </div>
            </div>
          </section>

          {/* One-Click Deploy */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">One-Click Deploy</h2>
            <p className="text-foreground-secondary mb-6">
              Deploy the TPMJS executor template to your Vercel account:
            </p>
            <a
              href="https://vercel.com/new/clone?repository-url=https://github.com/tpmjs/tpmjs/tree/main/templates/vercel-executor&project-name=tpmjs-executor&repository-name=tpmjs-executor"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg">
                <svg
                  className="w-4 h-4 mr-2"
                  viewBox="0 0 76 65"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
                </svg>
                Deploy with Vercel
              </Button>
            </a>
            <p className="text-sm text-foreground-tertiary mt-4">
              After deployment, your executor will be available at{' '}
              <code className="px-1.5 py-0.5 bg-surface rounded">
                https://tpmjs-executor.vercel.app
              </code>
            </p>
          </section>

          {/* Test Your Deployment */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Test Your Deployment</h2>
            <p className="text-foreground-secondary mb-4">Verify your executor is running:</p>
            <CodeBlock language="bash" code={healthCheck} />
            <p className="text-sm text-foreground-secondary mt-4 mb-2">Expected response:</p>
            <CodeBlock language="json" code={healthResponse} />
          </section>

          {/* Authentication */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Add Authentication</h2>
            <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg mb-4">
              <p className="text-sm text-warning">
                <strong>Important:</strong> Without an API key, anyone can execute tools on your
                executor. Always set{' '}
                <code className="px-1 bg-warning/20 rounded">EXECUTOR_API_KEY</code> in production.
              </p>
            </div>
            <ol className="text-foreground-secondary space-y-3">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-surface-secondary text-foreground-secondary text-sm flex items-center justify-center">
                  1
                </span>
                <span>Go to your Vercel project settings</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-surface-secondary text-foreground-secondary text-sm flex items-center justify-center">
                  2
                </span>
                <span>Navigate to Environment Variables</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-surface-secondary text-foreground-secondary text-sm flex items-center justify-center">
                  3
                </span>
                <span>
                  Add <code className="px-1 bg-surface rounded">EXECUTOR_API_KEY</code> with a
                  secure random value
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-surface-secondary text-foreground-secondary text-sm flex items-center justify-center">
                  4
                </span>
                <span>Redeploy your project to apply the changes</span>
              </li>
            </ol>
          </section>

          {/* Environment Variables */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Environment Variables</h2>
            <p className="text-foreground-secondary mb-4">
              Add custom environment variables for your tools in Vercel project settings:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 pr-4 font-medium text-foreground">Variable</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Required</th>
                    <th className="text-left py-3 pl-4 font-medium text-foreground">Description</th>
                  </tr>
                </thead>
                <tbody className="text-foreground-secondary">
                  <tr className="border-b border-border/50">
                    <td className="py-3 pr-4">
                      <code className="px-1 bg-surface rounded">EXECUTOR_API_KEY</code>
                    </td>
                    <td className="py-3 px-4">No*</td>
                    <td className="py-3 pl-4">
                      API key for authentication. Required for production.
                    </td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 pr-4">
                      <code className="px-1 bg-surface rounded">OPENAI_API_KEY</code>
                    </td>
                    <td className="py-3 px-4">No</td>
                    <td className="py-3 pl-4">Example: Pass through to tools that need OpenAI</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4">
                      <code className="px-1 bg-surface rounded">DATABASE_URL</code>
                    </td>
                    <td className="py-3 px-4">No</td>
                    <td className="py-3 pl-4">Example: Pass through to tools that need database</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-foreground-tertiary mt-4">
              * Strongly recommended for production deployments
            </p>
          </section>

          {/* Execute a Tool */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Execute a Tool</h2>
            <p className="text-foreground-secondary mb-4">
              Test tool execution with a curl request:
            </p>
            <CodeBlock language="bash" code={executeExample} />
          </section>

          {/* Local Development */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Local Development</h2>
            <p className="text-foreground-secondary mb-4">
              Run the executor locally for testing. Note: Vercel Sandbox requires authentication
              even in development.
            </p>
            <CodeBlock language="bash" code={localDev} />
            <div className="p-4 bg-surface border border-border rounded-lg mt-4">
              <p className="text-sm text-foreground-secondary">
                <strong>Note:</strong> You must run{' '}
                <code className="px-1 bg-surface-secondary rounded">vercel login</code> and{' '}
                <code className="px-1 bg-surface-secondary rounded">vercel link</code> before local
                development. Vercel Sandbox requires authentication to create VMs.
              </p>
            </div>
          </section>

          {/* How It Works */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">How It Works</h2>
            <p className="text-foreground-secondary mb-4">
              The Vercel executor uses{' '}
              <a
                href="https://vercel.com/docs/vercel-sandbox"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Vercel Sandbox
              </a>{' '}
              for isolated execution:
            </p>
            <ol className="text-foreground-secondary space-y-3">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center">
                  1
                </span>
                <span>Creates an isolated VM for each tool execution</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center">
                  2
                </span>
                <span>Installs the npm package in the sandbox</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center">
                  3
                </span>
                <span>Executes the tool with your parameters</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center">
                  4
                </span>
                <span>Returns the result and destroys the sandbox</span>
              </li>
            </ol>
            <p className="text-foreground-secondary text-sm mt-4">
              This provides VM-level isolation without the limitations of Node.js serverless
              functions.
            </p>
          </section>

          {/* Security */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Security</h2>
            <ul className="text-foreground-secondary space-y-2">
              <li className="flex items-start gap-2">
                <Icon icon="check" className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <span>
                  Set <code className="px-1 bg-surface rounded">EXECUTOR_API_KEY</code> to require
                  authentication
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Icon icon="check" className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <span>Tools run in isolated VMs with no access to your Vercel project</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon icon="check" className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <span>Each execution gets a fresh sandbox instance</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon icon="check" className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <span>Sandboxes are destroyed after execution completes</span>
              </li>
            </ul>
          </section>

          {/* Pricing & Limits */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Pricing & Limits</h2>
            <p className="text-foreground-secondary mb-4">
              Vercel Sandbox usage is billed based on compute time. See{' '}
              <a
                href="https://vercel.com/docs/vercel-sandbox/pricing"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Vercel Sandbox Pricing
              </a>{' '}
              for current rates.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 pr-4 font-medium text-foreground">Plan</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Max Runtime</th>
                    <th className="text-left py-3 pl-4 font-medium text-foreground">Notes</th>
                  </tr>
                </thead>
                <tbody className="text-foreground-secondary">
                  <tr className="border-b border-border/50">
                    <td className="py-3 pr-4">Hobby</td>
                    <td className="py-3 px-4">45 minutes</td>
                    <td className="py-3 pl-4">Free tier</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4">Pro</td>
                    <td className="py-3 px-4">5 hours</td>
                    <td className="py-3 pl-4">For longer-running tools</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-surface border border-border rounded-lg mt-4">
              <p className="text-sm text-foreground-secondary">
                <strong>Region:</strong> Vercel Sandbox is currently only available in{' '}
                <code className="px-1 bg-surface-secondary rounded">iad1</code> (US East).
              </p>
            </div>
          </section>

          {/* Connect to TPMJS */}
          <section className="mb-12 p-6 bg-primary/5 border border-primary/20 rounded-lg">
            <h2 className="text-lg font-semibold text-foreground mb-4">Connect to TPMJS</h2>
            <ol className="text-foreground-secondary space-y-2">
              <li>1. Go to your collection or agent settings on TPMJS</li>
              <li>2. Select &quot;Custom Executor&quot; in Executor Configuration</li>
              <li>
                3. Enter URL:{' '}
                <code className="px-1.5 py-0.5 bg-surface rounded">
                  https://tpmjs-executor.vercel.app
                </code>
              </li>
              <li>4. Enter your API key (if configured)</li>
              <li>5. Click &quot;Verify Connection&quot;</li>
            </ol>
          </section>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-8 border-t border-border">
            <Link
              href="/docs/executors/unsandbox"
              className="flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors"
            >
              <Icon icon="chevronLeft" className="w-4 h-4" />
              <span>Unsandbox Guide</span>
            </Link>
            <Link
              href="/docs/executors"
              className="flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors"
            >
              <span>Back to Executors</span>
              <Icon icon="chevronRight" className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
