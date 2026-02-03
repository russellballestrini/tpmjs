import type { InfoResponse, TestResult, TestSuite } from '../types.js';

async function testInfoReturns200(baseUrl: string, _apiKey?: string): Promise<TestResult> {
  const start = Date.now();
  const name = 'GET /info returns 200';

  try {
    const response = await fetch(`${baseUrl}/info`, {
      method: 'GET',
      headers: {
        'X-TPMJS-Protocol-Version': '1.0',
      },
    });

    const durationMs = Date.now() - start;

    if (response.status === 200) {
      return { name, passed: true, durationMs };
    }

    if (response.status === 404) {
      return {
        name,
        passed: false,
        message: '/info endpoint not implemented (optional for Level 1)',
        durationMs,
      };
    }

    return {
      name,
      passed: false,
      message: `Expected status 200, got ${response.status}`,
      durationMs,
    };
  } catch (error) {
    return {
      name,
      passed: false,
      message: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      durationMs: Date.now() - start,
    };
  }
}

async function testInfoIncludesCapabilities(
  baseUrl: string,
  _apiKey?: string
): Promise<TestResult> {
  const start = Date.now();
  const name = 'GET /info includes capabilities';

  try {
    const response = await fetch(`${baseUrl}/info`, {
      method: 'GET',
      headers: {
        'X-TPMJS-Protocol-Version': '1.0',
      },
    });

    const durationMs = Date.now() - start;

    if (response.status === 404) {
      return {
        name,
        passed: false,
        message: '/info endpoint not implemented',
        durationMs,
      };
    }

    const data = (await response.json()) as InfoResponse;

    if (!data.capabilities) {
      return {
        name,
        passed: false,
        message: 'Response missing "capabilities" field',
        durationMs,
      };
    }

    const required = ['isolation', 'executionModes', 'maxExecutionTimeMs', 'maxRequestBodyBytes'];
    const missing = required.filter(
      (key) => data.capabilities[key as keyof typeof data.capabilities] === undefined
    );

    if (missing.length > 0) {
      return {
        name,
        passed: false,
        message: `Missing capability fields: ${missing.join(', ')}`,
        durationMs,
      };
    }

    return { name, passed: true, durationMs };
  } catch (error) {
    return {
      name,
      passed: false,
      message: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      durationMs: Date.now() - start,
    };
  }
}

async function testInfoIncludesProtocolVersion(
  baseUrl: string,
  _apiKey?: string
): Promise<TestResult> {
  const start = Date.now();
  const name = 'GET /info includes protocolVersion';

  try {
    const response = await fetch(`${baseUrl}/info`, {
      method: 'GET',
      headers: {
        'X-TPMJS-Protocol-Version': '1.0',
      },
    });

    const durationMs = Date.now() - start;

    if (response.status === 404) {
      return {
        name,
        passed: false,
        message: '/info endpoint not implemented',
        durationMs,
      };
    }

    const data = (await response.json()) as InfoResponse;

    if (data.protocolVersion) {
      return { name, passed: true, durationMs };
    }

    return {
      name,
      passed: false,
      message: 'Response missing "protocolVersion" field',
      durationMs,
    };
  } catch (error) {
    return {
      name,
      passed: false,
      message: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      durationMs: Date.now() - start,
    };
  }
}

async function testInfoIsolationLevel(baseUrl: string, _apiKey?: string): Promise<TestResult> {
  const start = Date.now();
  const name = 'capabilities.isolation is valid';

  try {
    const response = await fetch(`${baseUrl}/info`, {
      method: 'GET',
      headers: {
        'X-TPMJS-Protocol-Version': '1.0',
      },
    });

    const durationMs = Date.now() - start;

    if (response.status === 404) {
      return {
        name,
        passed: false,
        message: '/info endpoint not implemented',
        durationMs,
      };
    }

    const data = (await response.json()) as InfoResponse;
    const validLevels = ['none', 'process', 'container', 'vm'];

    if (validLevels.includes(data.capabilities?.isolation)) {
      return { name, passed: true, durationMs };
    }

    return {
      name,
      passed: false,
      message: `Invalid isolation level: ${data.capabilities?.isolation}. Expected one of: ${validLevels.join(', ')}`,
      durationMs,
    };
  } catch (error) {
    return {
      name,
      passed: false,
      message: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      durationMs: Date.now() - start,
    };
  }
}

async function testAuthenticationEnforced(baseUrl: string, apiKey?: string): Promise<TestResult> {
  const start = Date.now();
  const name = 'Authentication enforced when configured';

  try {
    // First, make a request without auth to see if it's required
    const noAuthResponse = await fetch(`${baseUrl}/execute-tool`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-TPMJS-Protocol-Version': '1.0',
      },
      body: JSON.stringify({
        packageName: '@anthropic-ai/sdk',
        name: 'default',
        params: {},
      }),
    });

    const durationMs = Date.now() - start;

    // If no auth is required, that's fine
    if (noAuthResponse.status !== 401) {
      return {
        name,
        passed: true,
        message: 'No authentication required',
        durationMs,
      };
    }

    // If 401 without auth, verify it works with auth
    if (!apiKey) {
      return {
        name,
        passed: true,
        message: 'Authentication required (provide --api-key to fully test)',
        durationMs,
      };
    }

    // Try with auth
    const authResponse = await fetch(`${baseUrl}/execute-tool`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-TPMJS-Protocol-Version': '1.0',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        packageName: '@anthropic-ai/sdk',
        name: 'default',
        params: {},
      }),
    });

    if (authResponse.status === 200) {
      return { name, passed: true, durationMs: Date.now() - start };
    }

    return {
      name,
      passed: false,
      message: `Request with API key still failed: ${authResponse.status}`,
      durationMs: Date.now() - start,
    };
  } catch (error) {
    return {
      name,
      passed: false,
      message: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      durationMs: Date.now() - start,
    };
  }
}

async function testExecutionTimeoutEnforced(
  baseUrl: string,
  _apiKey?: string
): Promise<TestResult> {
  const start = Date.now();
  const name = 'Execution timeout enforcement';

  // This test just verifies the capability is advertised
  // Actual timeout testing would require a tool that hangs
  try {
    const response = await fetch(`${baseUrl}/info`, {
      method: 'GET',
      headers: {
        'X-TPMJS-Protocol-Version': '1.0',
      },
    });

    const durationMs = Date.now() - start;

    if (response.status === 404) {
      return {
        name,
        passed: false,
        message: '/info endpoint not implemented (cannot verify timeout)',
        durationMs,
      };
    }

    const data = (await response.json()) as InfoResponse;

    if (data.capabilities?.maxExecutionTimeMs && data.capabilities.maxExecutionTimeMs >= 60000) {
      return {
        name,
        passed: true,
        message: `maxExecutionTimeMs: ${data.capabilities.maxExecutionTimeMs}ms`,
        durationMs,
      };
    }

    return {
      name,
      passed: false,
      message: `maxExecutionTimeMs should be at least 60000ms, got: ${data.capabilities?.maxExecutionTimeMs}`,
      durationMs,
    };
  } catch (error) {
    return {
      name,
      passed: false,
      message: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      durationMs: Date.now() - start,
    };
  }
}

async function testStructuredErrorCodes(baseUrl: string, apiKey?: string): Promise<TestResult> {
  const start = Date.now();
  const name = 'Structured error codes';

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-TPMJS-Protocol-Version': '1.0',
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(`${baseUrl}/execute-tool`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        packageName: '@tpmjs/nonexistent-package-xyz-12345',
        name: 'nonexistentTool',
        params: {},
      }),
    });

    const durationMs = Date.now() - start;

    // Skip if auth required
    if (response.status === 401 && !apiKey) {
      return {
        name,
        passed: true,
        message: 'Skipped: Authentication required',
        durationMs,
      };
    }

    const data = (await response.json()) as {
      success: boolean;
      error?: { code: string; message: string };
    };

    if (!data.error?.code) {
      return {
        name,
        passed: false,
        message: 'Error response missing "code" field',
        durationMs,
      };
    }

    const validCodes = [
      'PACKAGE_NOT_FOUND',
      'TOOL_NOT_FOUND',
      'TOOL_INVALID',
      'TOOL_EXECUTION_ERROR',
      'EXECUTION_TIMEOUT',
      'INTERNAL_ERROR',
    ];

    if (validCodes.includes(data.error.code)) {
      return {
        name,
        passed: true,
        message: `Error code: ${data.error.code}`,
        durationMs,
      };
    }

    return {
      name,
      passed: false,
      message: `Non-standard error code: ${data.error.code}`,
      durationMs,
    };
  } catch (error) {
    return {
      name,
      passed: false,
      message: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      durationMs: Date.now() - start,
    };
  }
}

export async function runStandardTests(baseUrl: string, apiKey?: string): Promise<TestSuite> {
  const results: TestResult[] = [];

  // Run tests sequentially
  results.push(await testInfoReturns200(baseUrl, apiKey));
  results.push(await testInfoIncludesCapabilities(baseUrl, apiKey));
  results.push(await testInfoIncludesProtocolVersion(baseUrl, apiKey));
  results.push(await testInfoIsolationLevel(baseUrl, apiKey));
  results.push(await testAuthenticationEnforced(baseUrl, apiKey));
  results.push(await testExecutionTimeoutEnforced(baseUrl, apiKey));
  results.push(await testStructuredErrorCodes(baseUrl, apiKey));

  return {
    name: 'Standard Requirements',
    level: 'standard',
    results,
  };
}
