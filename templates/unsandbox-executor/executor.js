#!/usr/bin/env node
/**
 * TPMJS Executor for Unsandbox
 *
 * A lightweight HTTP server that executes TPMJS tools in isolated Unsandbox containers.
 * Since Unsandbox IS the sandbox, we don't need an additional isolation layer.
 *
 * API-compatible with the Vercel executor.
 */

const http = require('http');
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 80;
const API_KEY = process.env.EXECUTOR_API_KEY || null;

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Send JSON response with proper headers
 */
function jsonResponse(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    ...corsHeaders,
  });
  res.end(JSON.stringify(data));
}

/**
 * Validate API key if configured
 */
function checkAuth(req) {
  if (!API_KEY) return true;
  const authHeader = req.headers.authorization;
  return authHeader === `Bearer ${API_KEY}`;
}

/**
 * Parse JSON request body
 */
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
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

/**
 * GET /api/health - Health check endpoint
 */
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

/**
 * POST /api/execute-tool - Execute a TPMJS tool
 *
 * Request body:
 * {
 *   packageName: string,  // npm package name (e.g., "@tpmjs/hello")
 *   name: string,         // tool export name (e.g., "helloWorldTool")
 *   version?: string,     // package version (default: "latest")
 *   params: object,       // parameters to pass to tool.execute()
 *   env?: object          // environment variables for the tool
 * }
 */
async function handleExecuteTool(req, res) {
  const startTime = Date.now();

  // Check authorization
  if (!checkAuth(req)) {
    return jsonResponse(res, 401, {
      success: false,
      error: 'Unauthorized',
      executionTimeMs: Date.now() - startTime,
    });
  }

  // Parse request body
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

  // Validate required fields
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
    // Create isolated work directory
    fs.mkdirSync(workDir, { recursive: true });

    // Initialize package.json
    fs.writeFileSync(
      path.join(workDir, 'package.json'),
      JSON.stringify({
        name: 'tpmjs-execution',
        private: true,
        type: 'commonjs',
      })
    );

    // Install the npm package
    console.log(`[executor] Installing ${packageSpec}...`);
    const installStart = Date.now();

    try {
      execSync(`npm install --no-save --omit=dev --no-audit --no-fund ${packageSpec}`, {
        cwd: workDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 60000, // 60s timeout for install
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

    // Build environment variable setup code
    const envSetup = env
      ? Object.entries(env)
          .map(([key, value]) => `process.env[${JSON.stringify(key)}] = ${JSON.stringify(value)};`)
          .join('\n')
      : '';

    // Generate the execution script
    // This script loads the tool and calls tool.execute(params)
    const script = `
${envSetup}

(async () => {
  try {
    const pkg = require(${JSON.stringify(packageName)});

    // Find the tool export - check named export, default.name, or default
    let tool = pkg[${JSON.stringify(name)}] || pkg.default?.[${JSON.stringify(name)}] || pkg.default;

    if (!tool) {
      throw new Error(\`Tool "${name}" not found in package "${packageName}"\`);
    }

    // Handle factory functions (tools that need to be instantiated)
    if (typeof tool === 'function' && !tool.execute) {
      const envVars = ${env ? JSON.stringify(env) : 'null'};

      // Try no-arg call first
      try {
        const result = tool();
        if (result && typeof result.execute === 'function') {
          tool = result;
        }
      } catch {}

      // Try with env config if still a function
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

    // Execute the tool
    const result = await tool.execute(${JSON.stringify(params)});
    process.stdout.write(JSON.stringify({ __tpmjs_result__: result }));
  } catch (err) {
    process.stderr.write(JSON.stringify({ __tpmjs_error__: err.message || String(err) }));
    process.exitCode = 1;
  }
})();
`.trim();

    fs.writeFileSync(path.join(workDir, 'execute.cjs'), script);

    // Run the execution script
    console.log(`[executor] Running tool ${packageName}/${name}...`);
    const runStart = Date.now();

    const result = await new Promise((resolve) => {
      const child = spawn('node', ['execute.cjs'], {
        cwd: workDir,
        env: { ...process.env, ...env },
        timeout: 120000, // 2 minute timeout
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => (stdout += data));
      child.stderr.on('data', (data) => (stderr += data));

      child.on('close', (code) => {
        resolve({ exitCode: code, stdout, stderr });
      });

      child.on('error', (err) => {
        resolve({ exitCode: 1, stdout: '', stderr: err.message });
      });
    });

    console.log(
      `[executor] Tool execution completed in ${Date.now() - runStart}ms (exit: ${result.exitCode})`
    );

    // Cleanup work directory
    try {
      fs.rmSync(workDir, { recursive: true, force: true });
    } catch {}

    // Handle execution failure
    if (result.exitCode !== 0) {
      // Try to parse structured error from stderr
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

    // Parse the result
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

    // If we couldn't parse structured output, return raw
    return jsonResponse(res, 200, {
      success: true,
      output: result.stdout || null,
      stderr: result.stderr || undefined,
      executionTimeMs: Date.now() - startTime,
    });
  } catch (error) {
    // Cleanup on error
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

/**
 * Main HTTP server
 */
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    return res.end();
  }

  // Route requests (support both /api/path and /path)
  if ((pathname === '/api/health' || pathname === '/health') && req.method === 'GET') {
    return handleHealth(req, res);
  }

  if ((pathname === '/api/execute-tool' || pathname === '/execute-tool') && req.method === 'POST') {
    return handleExecuteTool(req, res);
  }

  // 404 for unknown routes
  jsonResponse(res, 404, { error: 'Not found' });
});

// Start server
server.listen(PORT, () => {
  console.log(`TPMJS Executor running on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
  console.log(`Execute: POST http://localhost:${PORT}/api/execute-tool`);
  if (API_KEY) {
    console.log(`Authentication: Required (EXECUTOR_API_KEY is set)`);
  } else {
    console.log(`Authentication: None (set EXECUTOR_API_KEY to enable)`);
  }
});
