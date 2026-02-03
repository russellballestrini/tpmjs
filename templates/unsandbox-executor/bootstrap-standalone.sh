#!/bin/bash
# TPMJS Executor Standalone Bootstrap Script for Unsandbox
# This script contains the embedded executor - no network required during bootstrap
# Protocol Version: 1.0
set -e

echo "=== TPMJS Executor for Unsandbox ==="
echo "Protocol Version: 1.0"
echo "Starting deployment..."

# Embedded executor script (v1.0 compliant)
cat > /root/executor.cjs << 'EXECUTOR_EOF'
#!/usr/bin/env node
/**
 * TPMJS Executor for Unsandbox
 * Protocol Version: 1.0
 */

const http = require('http');
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 80;
const API_KEY = process.env.EXECUTOR_API_KEY || null;
const PROTOCOL_VERSION = '1.0';
const IMPLEMENTATION_VERSION = '1.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-TPMJS-Protocol-Version',
};

function jsonResponse(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json', ...corsHeaders });
  res.end(JSON.stringify(data));
}

function checkAuth(req) {
  if (!API_KEY) return true;
  return req.headers.authorization === `Bearer ${API_KEY}`;
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch (e) { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function handleHealth(req, res) {
  jsonResponse(res, 200, {
    status: 'ok',
    protocolVersion: PROTOCOL_VERSION,
    implementationVersion: IMPLEMENTATION_VERSION,
    runtime: 'node',
    timestamp: new Date().toISOString(),
  });
}

function handleInfo(req, res) {
  jsonResponse(res, 200, {
    name: 'Unsandbox Executor',
    version: IMPLEMENTATION_VERSION,
    protocolVersion: PROTOCOL_VERSION,
    capabilities: {
      isolation: 'container',
      executionModes: ['sync'],
      maxExecutionTimeMs: 120000,
      maxRequestBodyBytes: 10485760,
      supportsStreaming: false,
      supportsCallbacks: false,
      supportsCaching: false,
    },
    runtime: { platform: process.platform, nodeVersion: process.version },
  });
}

async function handleExecuteTool(req, res) {
  const startTime = Date.now();

  if (!checkAuth(req)) {
    return jsonResponse(res, 401, {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid or missing API key' },
    });
  }

  let body;
  try { body = await parseBody(req); }
  catch (e) {
    return jsonResponse(res, 400, {
      success: false,
      error: { code: 'INVALID_REQUEST', message: 'Invalid JSON body' },
    });
  }

  const { packageName, name, version = 'latest', params = {}, env } = body;

  if (!packageName || !name) {
    return jsonResponse(res, 400, {
      success: false,
      error: { code: 'INVALID_REQUEST', message: 'Missing required fields: packageName, name' },
    });
  }

  const packageSpec = `${packageName}@${version}`;
  const workDir = `/tmp/tpmjs-exec-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  try {
    fs.mkdirSync(workDir, { recursive: true });
    fs.writeFileSync(path.join(workDir, 'package.json'), JSON.stringify({
      name: 'tpmjs-execution', private: true, type: 'commonjs',
    }));

    console.log(`[executor] Installing ${packageSpec}...`);
    try {
      execSync(`npm install --no-save --omit=dev --no-audit --no-fund ${packageSpec}`, {
        cwd: workDir, stdio: ['pipe', 'pipe', 'pipe'], timeout: 60000,
      });
    } catch (installError) {
      return jsonResponse(res, 200, {
        success: false,
        error: { code: 'PACKAGE_NOT_FOUND', message: `npm install failed: ${installError.message}` },
        executionTimeMs: Date.now() - startTime,
      });
    }

    const envSetup = env
      ? Object.entries(env).map(([k, v]) => `process.env[${JSON.stringify(k)}] = ${JSON.stringify(v)};`).join('\n')
      : '';

    const script = `
${envSetup}
(async () => {
  try {
    const pkg = require(${JSON.stringify(packageName)});
    let tool = pkg[${JSON.stringify(name)}] || pkg.default?.[${JSON.stringify(name)}] || pkg.default;
    if (!tool) throw new Error(\`Tool "${name}" not found in package "${packageName}"\`);
    if (typeof tool === 'function' && !tool.execute) {
      try { const r = tool(); if (r?.execute) tool = r; } catch {}
      if (typeof tool === 'function' && ${env ? JSON.stringify(env) : 'null'}) {
        try { const r = tool(${env ? JSON.stringify(env) : 'null'}); if (r?.execute) tool = r; } catch {}
      }
    }
    if (!tool?.execute) throw new Error(\`Tool "${name}" does not have an execute() function\`);
    const result = await tool.execute(${JSON.stringify(params)});
    process.stdout.write(JSON.stringify({ __tpmjs_result__: result }));
  } catch (err) {
    process.stderr.write(JSON.stringify({ __tpmjs_error__: err.message || String(err) }));
    process.exitCode = 1;
  }
})();
`.trim();

    fs.writeFileSync(path.join(workDir, 'execute.cjs'), script);

    const result = await new Promise((resolve) => {
      const child = spawn('node', ['execute.cjs'], {
        cwd: workDir, env: { ...process.env, ...env }, timeout: 120000,
      });
      let stdout = '', stderr = '';
      child.stdout.on('data', d => stdout += d);
      child.stderr.on('data', d => stderr += d);
      child.on('close', code => resolve({ exitCode: code, stdout, stderr }));
      child.on('error', err => resolve({ exitCode: 1, stdout: '', stderr: err.message }));
    });

    try { fs.rmSync(workDir, { recursive: true, force: true }); } catch {}

    if (result.exitCode !== 0) {
      try {
        const errorObj = JSON.parse(result.stderr);
        if (errorObj.__tpmjs_error__) {
          let code = 'TOOL_EXECUTION_ERROR';
          if (errorObj.__tpmjs_error__.includes('not found in package')) code = 'TOOL_NOT_FOUND';
          else if (errorObj.__tpmjs_error__.includes('does not have an execute()')) code = 'TOOL_INVALID';
          return jsonResponse(res, 200, {
            success: false,
            error: { code, message: errorObj.__tpmjs_error__ },
            executionTimeMs: Date.now() - startTime,
          });
        }
      } catch {}
      return jsonResponse(res, 200, {
        success: false,
        error: { code: 'TOOL_EXECUTION_ERROR', message: result.stderr || `Exit code ${result.exitCode}` },
        executionTimeMs: Date.now() - startTime,
      });
    }

    try {
      const parsed = JSON.parse(result.stdout);
      if (parsed.__tpmjs_result__ !== undefined) {
        return jsonResponse(res, 200, {
          success: true, output: parsed.__tpmjs_result__, executionTimeMs: Date.now() - startTime,
        });
      }
    } catch {}

    return jsonResponse(res, 200, {
      success: true, output: result.stdout || null, executionTimeMs: Date.now() - startTime,
    });

  } catch (error) {
    try { fs.rmSync(workDir, { recursive: true, force: true }); } catch {}
    return jsonResponse(res, 200, {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message || String(error) },
      executionTimeMs: Date.now() - startTime,
    });
  }
}

const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url, `http://localhost:${PORT}`).pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    return res.end();
  }

  if ((pathname === '/health' || pathname === '/api/health') && req.method === 'GET') return handleHealth(req, res);
  if ((pathname === '/info' || pathname === '/api/info') && req.method === 'GET') return handleInfo(req, res);
  if ((pathname === '/execute-tool' || pathname === '/api/execute-tool') && req.method === 'POST') return handleExecuteTool(req, res);

  if (pathname === '/' && req.method === 'GET') {
    return jsonResponse(res, 200, {
      name: 'TPMJS Unsandbox Executor',
      version: IMPLEMENTATION_VERSION,
      protocolVersion: PROTOCOL_VERSION,
      endpoints: { health: 'GET /health', info: 'GET /info', execute: 'POST /execute-tool' },
    });
  }

  jsonResponse(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`TPMJS Executor v${IMPLEMENTATION_VERSION} (Protocol ${PROTOCOL_VERSION})`);
  console.log(`Listening on port ${PORT}`);
  console.log(`Authentication: ${API_KEY ? 'Required' : 'None'}`);
});
EXECUTOR_EOF

echo "Starting TPMJS Executor on port 80..."
exec node /root/executor.cjs
