import { Button } from '@tpmjs/ui/Button/Button';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import type { Metadata } from 'next';
import Link from 'next/link';

import { AppFooter } from '~/components/AppFooter';
import { AppHeader } from '~/components/AppHeader';

export const metadata: Metadata = {
  title: 'Deploy to Railway - Custom Executors - TPMJS',
  description:
    'Deploy a TPMJS executor to Railway with one click. Always-on, auto-scaling, with a generous free tier.',
};

const healthCheck = `curl https://your-executor.up.railway.app/health`;

const healthResponse = `{
  "status": "ok",
  "version": "1.0.0",
  "info": {
    "runtime": "railway",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "region": "us-west1"
  }
}`;

const executeExample = `curl -X POST https://your-executor.up.railway.app/execute-tool \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer your-api-key" \\
  -d '{
    "packageName": "@tpmjs/hello",
    "name": "helloWorldTool",
    "version": "latest",
    "params": { "includeTimestamp": true }
  }'`;

const cliDeploy = `# Clone the template
git clone https://github.com/tpmjs/tpmjs.git
cd tpmjs/templates/railway-executor

# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create a new project and deploy
railway init
railway up`;

const envVars = `# Set environment variables via CLI
railway variables set EXECUTOR_API_KEY=your-secure-key
railway variables set OPENAI_API_KEY=sk-xxx
railway variables set DATABASE_URL=postgres://...`;

const localDev = `# Clone the repository
git clone https://github.com/tpmjs/tpmjs.git
cd tpmjs/templates/railway-executor

# Run locally
PORT=3000 node index.js

# Test health endpoint
curl http://localhost:3000/health`;

const dockerDeploy = `# Build the image
docker build -t tpmjs-executor .

# Run locally
docker run -p 3000:3000 -e EXECUTOR_API_KEY=your-key tpmjs-executor`;

export default function RailwayExecutorPage(): React.ReactElement {
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
            <span className="text-foreground">Railway</span>
          </nav>

          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-[#0B0D0E] rounded-lg flex items-center justify-center">
                <svg
                  className="w-7 h-7"
                  viewBox="0 0 24 24"
                  fill="none"
                  role="img"
                  aria-labelledby="railway-header-logo"
                >
                  <title id="railway-header-logo">Railway logo</title>
                  <path
                    d="M.113 12.611c-.139.312-.107.633.092.917.156.222.38.35.651.357h5.523a.28.28 0 00.216-.1c.07-.078.135-.22.2-.426.224-.718.428-1.09.65-1.492l.003-.005c.247-.448.51-.924.817-1.762.26-.712.296-1.371.113-2.008-.178-.62-.627-1.213-1.406-1.823a.248.248 0 00-.23-.044c-.078.025-.14.08-.178.157l-5.46 4.67a1.017 1.017 0 00-.287.41z"
                    fill="#fff"
                  />
                  <path
                    d="M8.904 6.16a.258.258 0 00-.22.108c-.06.08-.08.178-.053.27.147.517.147 1.023 0 1.56-.114.416-.304.81-.49 1.194l-.04.083c-.214.443-.43.889-.595 1.42-.204.66-.21 1.336-.017 2.015.287 1.013.986 1.826 1.93 2.252l.014.006c.15.07.252.116.341.196.09.08.17.195.28.368l.023.035c.217.34.517.81.827 1.142a.244.244 0 00.204.091h1.694a.252.252 0 00.217-.12.234.234 0 00.006-.243 7.639 7.639 0 00-.66-1.016c-.253-.34-.523-.665-.76-.948a6.876 6.876 0 01-.507-.66c-.15-.228-.288-.53-.296-.857-.016-.679.413-1.39.85-1.994.168-.232.35-.484.52-.767.306-.51.383-1.054.227-1.62a2.568 2.568 0 00-.943-1.317 6.487 6.487 0 00-.98-.636 2.27 2.27 0 01-.516-.346.248.248 0 00-.214-.073l-.842.057z"
                    fill="#fff"
                  />
                  <path
                    d="M20.756 6.225h-6.243a.255.255 0 00-.23.146.243.243 0 00.035.266c.32.362.618.742.892 1.137.317.46.597.946.833 1.45a.243.243 0 00.218.142h5.808c.278-.005.507-.133.667-.36.203-.287.234-.62.091-.94l-.765-1.563a.264.264 0 00-.24-.152l-1.066-.126z"
                    fill="#fff"
                  />
                  <path
                    d="M15.82 11.152a.247.247 0 00-.229.158c-.243.648-.36.972-.618 1.46-.257.49-.527.84-1.058 1.468a.244.244 0 00.006.325c.235.264.496.505.78.722.425.327.883.608 1.365.837a.237.237 0 00.108.026h4.16a.255.255 0 00.229-.146.243.243 0 00-.035-.267c-.444-.502-.8-.98-1.172-1.632l-.006-.01c-.367-.642-.57-1.092-.83-1.872a.243.243 0 00-.232-.169l-2.468-.9z"
                    fill="#fff"
                  />
                  <path
                    d="M13.873 16.68a.25.25 0 00-.2.074 4.588 4.588 0 01-.637.52c-.456.314-.797.472-1.236.647a.24.24 0 00-.147.137.249.249 0 00.004.2l.463.95c.098.2.285.32.5.317h6.357c.273-.013.497-.144.653-.374.198-.29.223-.622.074-.935l-.553-1.131a.257.257 0 00-.236-.152l-5.042-.253z"
                    fill="#fff"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Deploy to Railway</h1>
                <p className="text-foreground-secondary">
                  Always-on execution with auto-scaling and a free tier
                </p>
              </div>
            </div>
          </div>

          {/* Why Railway */}
          <section className="mb-12">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-surface border border-border rounded-lg">
                <div className="text-2xl mb-2">$5</div>
                <div className="text-sm text-foreground-secondary">Free monthly credit</div>
              </div>
              <div className="p-4 bg-surface border border-border rounded-lg">
                <div className="text-2xl mb-2">0ms</div>
                <div className="text-sm text-foreground-secondary">No cold starts</div>
              </div>
              <div className="p-4 bg-surface border border-border rounded-lg">
                <div className="text-2xl mb-2">Auto</div>
                <div className="text-sm text-foreground-secondary">Scaling built-in</div>
              </div>
            </div>
          </section>

          {/* One-Click Deploy */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">One-Click Deploy</h2>
            <p className="text-foreground-secondary mb-6">
              Deploy the TPMJS executor to Railway with a single click:
            </p>
            <a
              href="https://railway.app/template/tpmjs-executor?referralCode=tpmjs"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg">
                <svg
                  className="w-4 h-4 mr-2"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M.113 12.611c-.139.312-.107.633.092.917.156.222.38.35.651.357h5.523a.28.28 0 00.216-.1c.07-.078.135-.22.2-.426.224-.718.428-1.09.65-1.492l.003-.005c.247-.448.51-.924.817-1.762.26-.712.296-1.371.113-2.008-.178-.62-.627-1.213-1.406-1.823a.248.248 0 00-.23-.044c-.078.025-.14.08-.178.157l-5.46 4.67a1.017 1.017 0 00-.287.41z" />
                </svg>
                Deploy on Railway
              </Button>
            </a>
            <p className="text-sm text-foreground-tertiary mt-4">
              After deployment, your executor will be available at{' '}
              <code className="px-1.5 py-0.5 bg-surface rounded">
                https://your-project.up.railway.app
              </code>
            </p>
          </section>

          {/* CLI Deploy */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Deploy via CLI</h2>
            <p className="text-foreground-secondary mb-4">
              Prefer the command line? Deploy with the Railway CLI:
            </p>
            <CodeBlock language="bash" code={cliDeploy} />
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
                <span>Go to your Railway project dashboard</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-surface-secondary text-foreground-secondary text-sm flex items-center justify-center">
                  2
                </span>
                <span>Click on your service, then go to &quot;Variables&quot;</span>
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
                <span>Railway will automatically redeploy with the new variable</span>
              </li>
            </ol>
          </section>

          {/* Environment Variables */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Environment Variables</h2>
            <p className="text-foreground-secondary mb-4">
              Add environment variables via the Railway dashboard or CLI:
            </p>
            <CodeBlock language="bash" code={envVars} />
            <p className="text-sm text-foreground-tertiary mt-4">
              These variables will be available during tool execution.
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
            <p className="text-foreground-secondary mb-4">Run the executor locally for testing:</p>
            <CodeBlock language="bash" code={localDev} />
          </section>

          {/* Docker */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Docker Deployment</h2>
            <p className="text-foreground-secondary mb-4">
              The template includes a Dockerfile for container deployments:
            </p>
            <CodeBlock language="bash" code={dockerDeploy} />
            <p className="text-sm text-foreground-tertiary mt-4">
              Railway will automatically detect and use the Dockerfile if present.
            </p>
          </section>

          {/* How It Works */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">How It Works</h2>
            <p className="text-foreground-secondary mb-4">
              The Railway executor runs as an always-on Node.js service:
            </p>
            <ol className="text-foreground-secondary space-y-3">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center">
                  1
                </span>
                <span>
                  Receives tool execution request via HTTP POST to{' '}
                  <code className="px-1 bg-surface rounded">/execute-tool</code>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center">
                  2
                </span>
                <span>Creates an isolated temporary directory for the execution</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center">
                  3
                </span>
                <span>
                  Installs the npm package using{' '}
                  <code className="px-1 bg-surface rounded">npm install</code>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center">
                  4
                </span>
                <span>
                  Loads the tool and calls its{' '}
                  <code className="px-1 bg-surface rounded">execute()</code> function
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center">
                  5
                </span>
                <span>Returns the result and cleans up the temporary directory</span>
              </li>
            </ol>
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
                <span>Each tool execution uses an isolated temporary directory</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon icon="check" className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <span>Environment variables stored encrypted by Railway</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon icon="check" className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <span>All traffic encrypted via HTTPS</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon icon="check" className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <span>Auto-restart on failure for high availability</span>
              </li>
            </ul>
          </section>

          {/* Pricing */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Pricing</h2>
            <p className="text-foreground-secondary mb-4">
              Railway offers usage-based pricing with a generous free tier:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 pr-4 font-medium text-foreground">Tier</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Price</th>
                    <th className="text-left py-3 pl-4 font-medium text-foreground">Includes</th>
                  </tr>
                </thead>
                <tbody className="text-foreground-secondary">
                  <tr className="border-b border-border/50">
                    <td className="py-3 pr-4">Free Tier</td>
                    <td className="py-3 px-4">$0/month</td>
                    <td className="py-3 pl-4">$5 credit, enough for light usage</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4">Usage-based</td>
                    <td className="py-3 px-4">~$0.000463/min</td>
                    <td className="py-3 pl-4">0.5 vCPU, 512MB RAM</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-foreground-tertiary mt-4">
              See{' '}
              <a
                href="https://railway.app/pricing"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Railway Pricing
              </a>{' '}
              for current rates.
            </p>
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
                  https://your-project.up.railway.app
                </code>
              </li>
              <li>4. Enter your API key (if configured)</li>
              <li>5. Click &quot;Verify Connection&quot;</li>
            </ol>
          </section>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-8 border-t border-border">
            <Link
              href="/docs/executors"
              className="flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors"
            >
              <Icon icon="chevronLeft" className="w-4 h-4" />
              <span>Back to Executors</span>
            </Link>
            <Link
              href="/docs/executors/unsandbox"
              className="flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors"
            >
              <span>Unsandbox Guide</span>
              <Icon icon="chevronRight" className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
