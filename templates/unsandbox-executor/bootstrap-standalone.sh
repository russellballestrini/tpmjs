#!/bin/bash
# TPMJS Executor Standalone Bootstrap Script for Unsandbox
# This script contains the embedded executor - no network required during bootstrap
set -e

echo "=== TPMJS Executor for Unsandbox ==="
echo "Starting deployment..."

# Embedded executor script
cat > /root/executor.js << 'EXECUTOR_EOF'
#!/usr/bin/env node
/**
 * TPMJS Executor for Unsandbox
 * API-compatible with the Vercel executor.
 */

const http = require('http');
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 80;
const API_KEY = process.env.EXECUTOR_API_KEY || null;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function jsonResponse(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    ...corsHeaders,
  });
  res.end(JSON.stringify(data));
}

function checkAuth(req) {
  if (!API_KEY) return true;
  const authHeader = req.headers.authorization;
  return authHeader === `Bearer ${API_KEY}`;
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function handleHealth(req, res) {
  jsonResponse(res, 200, {
    status: 'ok',
    version: '1.0.0',
    info: {
      runtime: 'unsandbox',
      timestamp: new Date().toISOString(),
    },
  });
}

async function handleExecuteTool(req, res) {
  const startTime = Date.now();

  if (!checkAuth(req)) {
    return jsonResponse(res, 401, {
      success: false,
      error: 'Unauthorized',
      executionTimeMs: Date.now() - startTime,
    });
  }

  let body;
  try {
    body = await parseBody(req);
  } catch (e) {
    return jsonResponse(res, 400, {
      success: false,
      error: 'Invalid JSON body',
      executionTimeMs: Date.now() - startTime,
    });
  }

  const { packageName, name, version = 'latest', params = {}, env } = body;

  if (!packageName || !name) {
    return jsonResponse(res, 400, {
      success: false,
      error: 'Missing required fields: packageName, name',
      executionTimeMs: Date.now() - startTime,
    });
  }

  const packageSpec = `${packageName}@${version}`;
  const workDir = `/tmp/tpmjs-exec-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  try {
    fs.mkdirSync(workDir, { recursive: true });

    fs.writeFileSync(path.join(workDir, 'package.json'), JSON.stringify({
      name: 'tpmjs-execution',
      private: true,
      type: 'commonjs',
    }));

    console.log(`[executor] Installing ${packageSpec}...`);
    const installStart = Date.now();

    try {
      execSync(`npm install --no-save --omit=dev --no-audit --no-fund ${packageSpec}`, {
        cwd: workDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 60000,
      });
    } catch (installError) {
      console.error(`[executor] npm install failed:`, installError.message);
      return jsonResponse(res, 500, {
        success: false,
        error: `npm install failed: ${installError.message}`,
        stderr: installError.stderr?.toString(),
        executionTimeMs: Date.now() - startTime,
      });
    }

    console.log(`[executor] npm install completed in ${Date.now() - installStart}ms`);

    const envSetup = env
      ? Object.entries(env)
          .map(([key, value]) => `process.env[${JSON.stringify(key)}] = ${JSON.stringify(value)};`)
          .join('\n')
      : '';

    const script = `
${envSetup}

(async () => {
  try {
    const pkg = require(${JSON.stringify(packageName)});
    let tool = pkg[${JSON.stringify(name)}] || pkg.default?.[${JSON.stringify(name)}] || pkg.default;

    if (!tool) {
      throw new Error(\`Tool "${name}" not found in package "${packageName}"\`);
    }

    if (typeof tool === 'function' && !tool.execute) {
      const envVars = ${env ? JSON.stringify(env) : 'null'};
      try {
        const result = tool();
        if (result && typeof result.execute === 'function') {
          tool = result;
        }
      } catch {}
      if (typeof tool === 'function' && envVars) {
        try {
          const result = tool(envVars);
          if (result && typeof result.execute === 'function') {
            tool = result;
          }
        } catch {}
      }
    }

    if (!tool || typeof tool.execute !== 'function') {
      throw new Error(\`Tool "${name}" does not have an execute() function\`);
    }

    const result = await tool.execute(${JSON.stringify(params)});
    process.stdout.write(JSON.stringify({ __tpmjs_result__: result }));
  } catch (err) {
    process.stderr.write(JSON.stringify({ __tpmjs_error__: err.message || String(err) }));
    process.exitCode = 1;
  }
})();
`.trim();

    fs.writeFileSync(path.join(workDir, 'execute.cjs'), script);

    console.log(`[executor] Running tool ${packageName}/${name}...`);
    const runStart = Date.now();

    const result = await new Promise((resolve) => {
      const child = spawn('node', ['execute.cjs'], {
        cwd: workDir,
        env: { ...process.env, ...env },
        timeout: 120000,
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => stdout += data);
      child.stderr.on('data', (data) => stderr += data);

      child.on('close', (code) => {
        resolve({ exitCode: code, stdout, stderr });
      });

      child.on('error', (err) => {
        resolve({ exitCode: 1, stdout: '', stderr: err.message });
      });
    });

    console.log(`[executor] Tool execution completed in ${Date.now() - runStart}ms (exit: ${result.exitCode})`);

    try {
      fs.rmSync(workDir, { recursive: true, force: true });
    } catch {}

    if (result.exitCode !== 0) {
      try {
        const errorObj = JSON.parse(result.stderr);
        if (errorObj.__tpmjs_error__) {
          return jsonResponse(res, 200, {
            success: false,
            error: errorObj.__tpmjs_error__,
            executionTimeMs: Date.now() - startTime,
          });
        }
      } catch {}

      return jsonResponse(res, 200, {
        success: false,
        error: result.stderr || `Script exited with code ${result.exitCode}`,
        executionTimeMs: Date.now() - startTime,
      });
    }

    try {
      const parsed = JSON.parse(result.stdout);
      if (parsed.__tpmjs_result__ !== undefined) {
        return jsonResponse(res, 200, {
          success: true,
          output: parsed.__tpmjs_result__,
          executionTimeMs: Date.now() - startTime,
        });
      }
    } catch {}

    return jsonResponse(res, 200, {
      success: true,
      output: result.stdout || null,
      stderr: result.stderr || undefined,
      executionTimeMs: Date.now() - startTime,
    });

  } catch (error) {
    try {
      fs.rmSync(workDir, { recursive: true, force: true });
    } catch {}

    return jsonResponse(res, 500, {
      success: false,
      error: error.message || String(error),
      executionTimeMs: Date.now() - startTime,
    });
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    return res.end();
  }

  if ((pathname === '/api/health' || pathname === '/health') && req.method === 'GET') {
    return handleHealth(req, res);
  }

  if ((pathname === '/api/execute-tool' || pathname === '/execute-tool') && req.method === 'POST') {
    return handleExecuteTool(req, res);
  }

  jsonResponse(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`TPMJS Executor running on port ${PORT}`);
  if (API_KEY) {
    console.log(`Authentication: Required`);
  }
});
EXECUTOR_EOF

echo "Starting TPMJS Executor on port 80..."
exec node /root/executor.js
