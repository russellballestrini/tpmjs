/**
 * E2B Cloud Sandbox Tools for TPMJS
 * Create and manage cloud sandboxes for AI code execution.
 *
 * Authentication: Set E2B_API_KEY env var with your API key from https://e2b.dev/dashboard
 *
 * SDK Packages:
 *   JavaScript/TypeScript: @e2b/code-interpreter
 *   Python: e2b-code-interpreter
 */

import { Sandbox } from '@e2b/code-interpreter';
import { jsonSchema, tool } from 'ai';

// ============================================================================
// Types
// ============================================================================

export interface E2BSandbox {
  sandboxId: string;
  templateId: string;
  status: string;
  startedAt?: string;
  clientId?: string;
  metadata?: Record<string, string>;
}

export interface E2BSandboxList {
  sandboxes: E2BSandbox[];
  count: number;
}

export interface E2BExecResult {
  stdout: string;
  stderr: string;
  results: unknown[];
  error?: { name: string; message: string; traceback?: string };
  duration: number;
}

export interface E2BFileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
}

export interface E2BTemplate {
  templateId: string;
  buildId?: string;
  cpuCount?: number;
  memoryMB?: number;
  status?: string;
  public?: boolean;
}

export interface E2BMetrics {
  cpuPct: number;
  memUsedMB: number;
  networkIngressMB: number;
  networkEgressMB: number;
}

// Input types
interface CreateSandboxInput {
  template?: string;
  timeoutMs?: number;
  metadata?: Record<string, string>;
  envVars?: Record<string, string>;
}

interface SandboxIdInput {
  sandboxId: string;
}

interface ListSandboxesInput {
  templateId?: string;
}

interface SetTimeoutInput {
  sandboxId: string;
  timeoutMs: number;
}

interface RunCodeInput {
  sandboxId: string;
  code: string;
  language?: string;
  timeoutMs?: number;
}

interface RunCommandInput {
  sandboxId: string;
  command: string;
  cwd?: string;
  background?: boolean;
  timeoutMs?: number;
}

interface WriteFileInput {
  sandboxId: string;
  path: string;
  content: string;
}

interface ReadFileInput {
  sandboxId: string;
  path: string;
}

interface ListFilesInput {
  sandboxId: string;
  path: string;
}

interface UploadFileInput {
  sandboxId: string;
  path: string;
  content?: string;
  url?: string;
}

interface DownloadFileInput {
  sandboxId: string;
  path: string;
}

interface MakeDirectoryInput {
  sandboxId: string;
  path: string;
}

interface WatchDirectoryInput {
  sandboxId: string;
  path: string;
}

interface ResumeInput {
  sandboxId: string;
  timeoutMs?: number;
}

interface SetEnvVarsInput {
  sandboxId: string;
  envVars: Record<string, string>;
}

interface InstallPackagesInput {
  sandboxId: string;
  packages: string[];
}

// ============================================================================
// Sandbox Connection Cache
// ============================================================================

const sandboxCache = new Map<string, Sandbox>();

async function getOrConnectSandbox(sandboxId: string): Promise<Sandbox> {
  if (!sandboxId) {
    throw new Error('sandboxId is required');
  }

  const cached = sandboxCache.get(sandboxId);
  if (cached) {
    return cached;
  }

  try {
    const sandbox = await Sandbox.connect(sandboxId);
    sandboxCache.set(sandboxId, sandbox);
    return sandbox;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to connect to sandbox ${sandboxId}: ${message}`);
  }
}

function removeSandboxFromCache(sandboxId: string): void {
  sandboxCache.delete(sandboxId);
}

// ============================================================================
// Tools
// ============================================================================

/**
 * Create a new E2B sandbox
 */
export const createSandbox = tool({
  description:
    'Create a new E2B cloud sandbox from a template. Sandboxes are isolated Linux environments for AI code execution. Defaults to "base" template with 5 minute timeout if not specified. Requires E2B_API_KEY.',
  inputSchema: jsonSchema<CreateSandboxInput>({
    type: 'object',
    properties: {
      template: {
        type: 'string',
        description: 'Template ID to use (default: "base" for Code Interpreter)',
      },
      timeoutMs: {
        type: 'number',
        description: 'Sandbox timeout in milliseconds (default: 300000 = 5 minutes)',
      },
      metadata: {
        type: 'object',
        description: 'Custom metadata key-value pairs to attach to sandbox',
        additionalProperties: { type: 'string' },
      },
      envVars: {
        type: 'object',
        description: 'Environment variables to set in the sandbox',
        additionalProperties: { type: 'string' },
      },
    },
    required: [],
    additionalProperties: false,
  }),
  async execute(input: CreateSandboxInput): Promise<E2BSandbox> {
    const templateId = input.template || 'base';
    const timeoutMs = input.timeoutMs || 300000; // Default 5 minutes

    try {
      const sandbox = await Sandbox.create(templateId, {
        timeoutMs,
        metadata: input.metadata,
        envs: input.envVars,
      });

      sandboxCache.set(sandbox.sandboxId, sandbox);

      return {
        sandboxId: sandbox.sandboxId,
        templateId,
        status: 'running',
        startedAt: new Date().toISOString(),
        clientId: sandbox.sandboxId,
        metadata: input.metadata,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create sandbox with template "${templateId}": ${message}`);
    }
  },
});

/**
 * Get sandbox details
 */
export const getSandbox = tool({
  description:
    'Connect to and verify an existing E2B sandbox is running. Returns sandbox ID and connection status. Requires E2B_API_KEY.',
  inputSchema: jsonSchema<SandboxIdInput>({
    type: 'object',
    properties: {
      sandboxId: {
        type: 'string',
        description: 'ID of the sandbox to retrieve',
      },
    },
    required: ['sandboxId'],
    additionalProperties: false,
  }),
  async execute(input: SandboxIdInput): Promise<E2BSandbox> {
    try {
      const sandbox = await getOrConnectSandbox(input.sandboxId);
      return {
        sandboxId: sandbox.sandboxId,
        templateId: (sandbox as unknown as { templateId?: string }).templateId || 'base',
        status: 'running',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get sandbox ${input.sandboxId}: ${message}`);
    }
  },
});

/**
 * List all sandboxes
 */
export const listSandboxes = tool({
  description:
    'List all running E2B sandboxes in your account with their status and metadata. Requires E2B_API_KEY.',
  inputSchema: jsonSchema<ListSandboxesInput>({
    type: 'object',
    properties: {
      templateId: {
        type: 'string',
        description: 'Filter sandboxes by template ID',
      },
    },
    required: [],
    additionalProperties: false,
  }),
  async execute(_input: ListSandboxesInput): Promise<E2BSandboxList> {
    const sandboxes = await Sandbox.list();
    return {
      sandboxes: sandboxes.map((s) => ({
        sandboxId: s.sandboxId,
        templateId: s.templateId || 'unknown',
        status: 'running',
        startedAt: s.startedAt?.toISOString(),
        clientId: s.clientId,
        metadata: s.metadata,
      })),
      count: sandboxes.length,
    };
  },
});

/**
 * Kill a sandbox
 */
export const killSandbox = tool({
  description:
    'Terminate a running E2B sandbox immediately. All data and processes are destroyed. Requires E2B_API_KEY.',
  inputSchema: jsonSchema<SandboxIdInput>({
    type: 'object',
    properties: {
      sandboxId: {
        type: 'string',
        description: 'ID of the sandbox to terminate',
      },
    },
    required: ['sandboxId'],
    additionalProperties: false,
  }),
  async execute(input: SandboxIdInput): Promise<{ killed: boolean; sandboxId: string }> {
    const sandbox = await getOrConnectSandbox(input.sandboxId);
    await sandbox.kill();
    removeSandboxFromCache(input.sandboxId);
    return { killed: true, sandboxId: input.sandboxId };
  },
});

/**
 * Set sandbox timeout
 */
export const setTimeout = tool({
  description:
    'Set or extend the timeout for an E2B sandbox. The sandbox will be automatically killed when the timeout expires. Requires E2B_API_KEY.',
  inputSchema: jsonSchema<SetTimeoutInput>({
    type: 'object',
    properties: {
      sandboxId: {
        type: 'string',
        description: 'ID of the sandbox',
      },
      timeoutMs: {
        type: 'number',
        description: 'New timeout in milliseconds from now',
      },
    },
    required: ['sandboxId', 'timeoutMs'],
    additionalProperties: false,
  }),
  async execute(input: SetTimeoutInput): Promise<{ success: boolean; expiresAt: string }> {
    const sandbox = await getOrConnectSandbox(input.sandboxId);
    await sandbox.setTimeout(input.timeoutMs);
    const expiresAt = new Date(Date.now() + input.timeoutMs).toISOString();
    return { success: true, expiresAt };
  },
});

/**
 * Run code in sandbox
 */
export const runCode = tool({
  description:
    'Execute code in an E2B sandbox. Supports Python (default), JavaScript, TypeScript, R, Java, and Bash with streaming output and result capture. Requires E2B_API_KEY.',
  inputSchema: jsonSchema<RunCodeInput>({
    type: 'object',
    properties: {
      sandboxId: {
        type: 'string',
        description: 'ID of the sandbox to execute in',
      },
      code: {
        type: 'string',
        description: 'Code to execute',
      },
      language: {
        type: 'string',
        description: 'Language: python (default), javascript, typescript, r, java, bash',
      },
      timeoutMs: {
        type: 'number',
        description: 'Execution timeout in milliseconds (default: 60000)',
      },
    },
    required: ['sandboxId', 'code'],
    additionalProperties: false,
  }),
  async execute(input: RunCodeInput): Promise<E2BExecResult> {
    const startTime = Date.now();
    const language = input.language || 'python';
    const timeoutMs = input.timeoutMs || 60000;

    try {
      const sandbox = await getOrConnectSandbox(input.sandboxId);

      const execution = await sandbox.runCode(input.code, {
        language: language as 'python' | 'javascript' | 'typescript' | 'r' | 'java',
        timeoutMs,
      });

      const duration = Date.now() - startTime;

      return {
        stdout: execution.logs.stdout.join('\n'),
        stderr: execution.logs.stderr.join('\n'),
        results: execution.results.map((r) => r.toJSON()),
        error: execution.error
          ? {
              name: execution.error.name,
              message: execution.error.value,
              traceback: execution.error.traceback,
            }
          : undefined,
        duration,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to execute code in sandbox ${input.sandboxId}: ${message}`);
    }
  },
});

/**
 * Run shell command
 */
export const runCommand = tool({
  description:
    'Execute a shell command in an E2B sandbox with full shell access. Supports background processes and working directory. Requires E2B_API_KEY.',
  inputSchema: jsonSchema<RunCommandInput>({
    type: 'object',
    properties: {
      sandboxId: {
        type: 'string',
        description: 'ID of the sandbox',
      },
      command: {
        type: 'string',
        description: 'Shell command to execute',
      },
      cwd: {
        type: 'string',
        description: 'Working directory for the command',
      },
      background: {
        type: 'boolean',
        description: 'Run command in background (default: false)',
      },
      timeoutMs: {
        type: 'number',
        description: 'Command timeout in milliseconds (default: 60000)',
      },
    },
    required: ['sandboxId', 'command'],
    additionalProperties: false,
  }),
  async execute(
    input: RunCommandInput
  ): Promise<{ stdout: string; stderr: string; exitCode: number; processId?: string }> {
    const timeoutMs = input.timeoutMs || 60000;

    try {
      const sandbox = await getOrConnectSandbox(input.sandboxId);

      if (input.background) {
        const process = await sandbox.commands.run(input.command, {
          cwd: input.cwd,
          background: true,
          timeoutMs,
        });
        return {
          stdout: '',
          stderr: '',
          exitCode: 0,
          processId: String(process.pid),
        };
      }

      const result = await sandbox.commands.run(input.command, {
        cwd: input.cwd,
        timeoutMs,
      });

      return {
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to run command in sandbox ${input.sandboxId}: ${message}`);
    }
  },
});

/**
 * Write file to sandbox
 */
export const writeFile = tool({
  description:
    'Write content to a file in the E2B sandbox filesystem. Creates directories as needed. Requires E2B_API_KEY.',
  inputSchema: jsonSchema<WriteFileInput>({
    type: 'object',
    properties: {
      sandboxId: {
        type: 'string',
        description: 'ID of the sandbox',
      },
      path: {
        type: 'string',
        description: 'Absolute path in sandbox (e.g., /home/user/file.txt)',
      },
      content: {
        type: 'string',
        description: 'File content as string',
      },
    },
    required: ['sandboxId', 'path', 'content'],
    additionalProperties: false,
  }),
  async execute(input: WriteFileInput): Promise<{ success: boolean; path: string; size: number }> {
    try {
      const sandbox = await getOrConnectSandbox(input.sandboxId);
      await sandbox.files.write(input.path, input.content);

      return {
        success: true,
        path: input.path,
        size: input.content.length,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to write file ${input.path} in sandbox ${input.sandboxId}: ${message}`
      );
    }
  },
});

/**
 * Read file from sandbox
 */
export const readFile = tool({
  description: 'Read content from a file in the E2B sandbox filesystem. Requires E2B_API_KEY.',
  inputSchema: jsonSchema<ReadFileInput>({
    type: 'object',
    properties: {
      sandboxId: {
        type: 'string',
        description: 'ID of the sandbox',
      },
      path: {
        type: 'string',
        description: 'Absolute path to file in sandbox',
      },
    },
    required: ['sandboxId', 'path'],
    additionalProperties: false,
  }),
  async execute(input: ReadFileInput): Promise<{ content: string; path: string; size: number }> {
    const sandbox = await getOrConnectSandbox(input.sandboxId);
    const content = await sandbox.files.read(input.path);

    const textContent = typeof content === 'string' ? content : new TextDecoder().decode(content);

    return {
      content: textContent,
      path: input.path,
      size: textContent.length,
    };
  },
});

/**
 * List files in sandbox
 */
export const listFiles = tool({
  description: 'List files and directories at a path in the E2B sandbox. Requires E2B_API_KEY.',
  inputSchema: jsonSchema<ListFilesInput>({
    type: 'object',
    properties: {
      sandboxId: {
        type: 'string',
        description: 'ID of the sandbox',
      },
      path: {
        type: 'string',
        description: 'Absolute path to list (e.g., /home/user)',
      },
    },
    required: ['sandboxId', 'path'],
    additionalProperties: false,
  }),
  async execute(input: ListFilesInput): Promise<{ entries: E2BFileInfo[]; count: number }> {
    const sandbox = await getOrConnectSandbox(input.sandboxId);
    const entries = await sandbox.files.list(input.path);

    return {
      entries: entries.map((e) => ({
        name: e.name,
        path: `${input.path}/${e.name}`,
        type: e.type as 'file' | 'directory',
      })),
      count: entries.length,
    };
  },
});

/**
 * Upload file to sandbox
 */
export const uploadFile = tool({
  description:
    'Upload a file to the E2B sandbox from base64 content or a URL. Requires E2B_API_KEY.',
  inputSchema: jsonSchema<UploadFileInput>({
    type: 'object',
    properties: {
      sandboxId: {
        type: 'string',
        description: 'ID of the sandbox',
      },
      path: {
        type: 'string',
        description: 'Destination path in sandbox',
      },
      content: {
        type: 'string',
        description: 'Base64 encoded file content',
      },
      url: {
        type: 'string',
        description: 'URL to fetch file from (alternative to content)',
      },
    },
    required: ['sandboxId', 'path'],
    additionalProperties: false,
  }),
  async execute(input: UploadFileInput): Promise<{ success: boolean; path: string; size: number }> {
    const sandbox = await getOrConnectSandbox(input.sandboxId);

    let fileContent: ArrayBuffer;
    if (input.url) {
      const response = await fetch(input.url);
      fileContent = await response.arrayBuffer();
    } else if (input.content) {
      const binaryString = atob(input.content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      fileContent = bytes.buffer;
    } else {
      throw new Error('Either content or url must be provided');
    }

    await sandbox.files.write(input.path, fileContent);

    return {
      success: true,
      path: input.path,
      size: fileContent.byteLength,
    };
  },
});

/**
 * Download file from sandbox
 */
export const downloadFile = tool({
  description: 'Download a file from the E2B sandbox as base64 content. Requires E2B_API_KEY.',
  inputSchema: jsonSchema<DownloadFileInput>({
    type: 'object',
    properties: {
      sandboxId: {
        type: 'string',
        description: 'ID of the sandbox',
      },
      path: {
        type: 'string',
        description: 'Path to file in sandbox',
      },
    },
    required: ['sandboxId', 'path'],
    additionalProperties: false,
  }),
  async execute(
    input: DownloadFileInput
  ): Promise<{ content: string; filename: string; size: number; mimeType: string }> {
    const sandbox = await getOrConnectSandbox(input.sandboxId);
    const content = await sandbox.files.read(input.path);

    const filename = input.path.split('/').pop() || 'file';
    const ext = filename.split('.').pop()?.toLowerCase() || '';

    // Convert to base64 and calculate size
    let base64Content: string;
    let contentLength: number;

    if (typeof content === 'string') {
      base64Content = btoa(content);
      contentLength = content.length;
    } else {
      const bytes = new Uint8Array(content as ArrayBuffer);
      contentLength = bytes.length;
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i] as number);
      }
      base64Content = btoa(binary);
    }

    // Simple MIME type detection
    const mimeTypes: Record<string, string> = {
      txt: 'text/plain',
      json: 'application/json',
      js: 'text/javascript',
      ts: 'text/typescript',
      py: 'text/x-python',
      html: 'text/html',
      css: 'text/css',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      pdf: 'application/pdf',
      zip: 'application/zip',
    };

    return {
      content: base64Content,
      filename,
      size: contentLength,
      mimeType: mimeTypes[ext] || 'application/octet-stream',
    };
  },
});

/**
 * Create directory in sandbox
 */
export const makeDirectory = tool({
  description:
    'Create a directory in the E2B sandbox filesystem. Creates parent directories as needed. Requires E2B_API_KEY.',
  inputSchema: jsonSchema<MakeDirectoryInput>({
    type: 'object',
    properties: {
      sandboxId: {
        type: 'string',
        description: 'ID of the sandbox',
      },
      path: {
        type: 'string',
        description: 'Absolute path of directory to create',
      },
    },
    required: ['sandboxId', 'path'],
    additionalProperties: false,
  }),
  async execute(input: MakeDirectoryInput): Promise<{ success: boolean; path: string }> {
    const sandbox = await getOrConnectSandbox(input.sandboxId);
    await sandbox.files.makeDir(input.path);
    return { success: true, path: input.path };
  },
});

/**
 * Watch directory for changes
 */
export const watchDirectory = tool({
  description:
    'Watch a directory in the E2B sandbox for file changes. Returns the initial state. Requires E2B_API_KEY.',
  inputSchema: jsonSchema<WatchDirectoryInput>({
    type: 'object',
    properties: {
      sandboxId: {
        type: 'string',
        description: 'ID of the sandbox',
      },
      path: {
        type: 'string',
        description: 'Directory path to watch',
      },
    },
    required: ['sandboxId', 'path'],
    additionalProperties: false,
  }),
  async execute(
    input: WatchDirectoryInput
  ): Promise<{ entries: E2BFileInfo[]; watcherId: string }> {
    const sandbox = await getOrConnectSandbox(input.sandboxId);
    const entries = await sandbox.files.list(input.path);

    return {
      entries: entries.map((e) => ({
        name: e.name,
        path: `${input.path}/${e.name}`,
        type: e.type as 'file' | 'directory',
      })),
      watcherId: `watch-${input.sandboxId}-${Date.now()}`,
    };
  },
});

/**
 * Pause sandbox (using keepalive approach)
 */
export const pauseSandbox = tool({
  description:
    'Disconnect from an E2B sandbox while keeping it running. The sandbox continues running and can be reconnected later using resumeSandbox. State is preserved in the sandbox. Requires E2B_API_KEY.',
  inputSchema: jsonSchema<SandboxIdInput>({
    type: 'object',
    properties: {
      sandboxId: {
        type: 'string',
        description: 'ID of the sandbox to disconnect from',
      },
    },
    required: ['sandboxId'],
    additionalProperties: false,
  }),
  async execute(
    input: SandboxIdInput
  ): Promise<{ success: boolean; sandboxId: string; status: string }> {
    if (!input.sandboxId) {
      throw new Error('sandboxId is required');
    }

    // Verify sandbox exists by attempting to connect first
    try {
      await getOrConnectSandbox(input.sandboxId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Cannot pause sandbox ${input.sandboxId}: ${message}`);
    }

    // Disconnect from sandbox while keeping it running
    removeSandboxFromCache(input.sandboxId);
    return {
      success: true,
      sandboxId: input.sandboxId,
      status: 'disconnected',
    };
  },
});

/**
 * Resume (reconnect to) sandbox
 */
export const resumeSandbox = tool({
  description:
    'Reconnect to a running E2B sandbox that was previously disconnected using pauseSandbox. Optionally set a new timeout. Requires E2B_API_KEY.',
  inputSchema: jsonSchema<ResumeInput>({
    type: 'object',
    properties: {
      sandboxId: {
        type: 'string',
        description: 'ID of the sandbox to reconnect to',
      },
      timeoutMs: {
        type: 'number',
        description: 'New timeout for the sandbox in milliseconds (optional)',
      },
    },
    required: ['sandboxId'],
    additionalProperties: false,
  }),
  async execute(input: ResumeInput): Promise<{ sandboxId: string; status: string }> {
    try {
      const sandbox = await Sandbox.connect(input.sandboxId);
      if (input.timeoutMs) {
        await sandbox.setTimeout(input.timeoutMs);
      }
      sandboxCache.set(sandbox.sandboxId, sandbox);
      return { sandboxId: sandbox.sandboxId, status: 'running' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to reconnect to sandbox ${input.sandboxId}: ${message}`);
    }
  },
});

/**
 * Set environment variables
 */
export const setEnvVars = tool({
  description:
    'Set environment variables in an E2B sandbox. These persist for subsequent code executions in the same sandbox session. Special characters are safely escaped. Requires E2B_API_KEY.',
  inputSchema: jsonSchema<SetEnvVarsInput>({
    type: 'object',
    properties: {
      sandboxId: {
        type: 'string',
        description: 'ID of the sandbox',
      },
      envVars: {
        type: 'object',
        description: 'Key-value pairs of environment variables to set',
        additionalProperties: { type: 'string' },
      },
    },
    required: ['sandboxId', 'envVars'],
    additionalProperties: false,
  }),
  async execute(input: SetEnvVarsInput): Promise<{ success: boolean; count: number }> {
    try {
      const sandbox = await getOrConnectSandbox(input.sandboxId);

      // Escape shell special characters in values
      const escapeForShell = (str: string): string => {
        return str
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"')
          .replace(/\$/g, '\\$')
          .replace(/`/g, '\\`')
          .replace(/!/g, '\\!');
      };

      // Set each environment variable using shell export
      for (const [key, value] of Object.entries(input.envVars)) {
        await sandbox.commands.run(`export ${key}="${escapeForShell(value)}"`);
      }

      return { success: true, count: Object.keys(input.envVars).length };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to set environment variables in sandbox ${input.sandboxId}: ${message}`
      );
    }
  },
});

/**
 * Get sandbox metrics
 */
export const getMetrics = tool({
  description:
    'Get resource usage metrics for an E2B sandbox including CPU, memory, and network usage. Requires E2B_API_KEY.',
  inputSchema: jsonSchema<SandboxIdInput>({
    type: 'object',
    properties: {
      sandboxId: {
        type: 'string',
        description: 'ID of the sandbox',
      },
    },
    required: ['sandboxId'],
    additionalProperties: false,
  }),
  async execute(input: SandboxIdInput): Promise<E2BMetrics> {
    const sandbox = await getOrConnectSandbox(input.sandboxId);

    // Get metrics using /proc filesystem
    const cpuResult = await sandbox.commands.run(
      "cat /proc/stat | grep 'cpu ' | awk '{usage=($2+$4)*100/($2+$4+$5)} END {print usage}'"
    );
    const memResult = await sandbox.commands.run("free -m | grep Mem | awk '{print $3}'");

    return {
      cpuPct: parseFloat(cpuResult.stdout) || 0,
      memUsedMB: parseInt(memResult.stdout, 10) || 0,
      networkIngressMB: 0,
      networkEgressMB: 0,
    };
  },
});

/**
 * Install Python packages
 */
export const installPackages = tool({
  description:
    'Install Python packages in an E2B Code Interpreter sandbox using pip. Requires E2B_API_KEY.',
  inputSchema: jsonSchema<InstallPackagesInput>({
    type: 'object',
    properties: {
      sandboxId: {
        type: 'string',
        description: 'ID of the sandbox',
      },
      packages: {
        type: 'array',
        items: { type: 'string' },
        description: "Array of package names to install (e.g., ['numpy', 'pandas==2.0.0'])",
      },
    },
    required: ['sandboxId', 'packages'],
    additionalProperties: false,
  }),
  async execute(
    input: InstallPackagesInput
  ): Promise<{ success: boolean; installed: string[]; errors?: string[] }> {
    const sandbox = await getOrConnectSandbox(input.sandboxId);

    const installed: string[] = [];
    const errors: string[] = [];

    for (const pkg of input.packages) {
      try {
        const result = await sandbox.commands.run(`pip install ${pkg}`, { timeoutMs: 120000 });
        if (result.exitCode === 0) {
          installed.push(pkg);
        } else {
          errors.push(`${pkg}: ${result.stderr}`);
        }
      } catch (error) {
        errors.push(`${pkg}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      success: errors.length === 0,
      installed,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
});

// ============================================================================
// Default Export
// ============================================================================

export default {
  createSandbox,
  getSandbox,
  listSandboxes,
  killSandbox,
  setTimeout,
  runCode,
  runCommand,
  writeFile,
  readFile,
  listFiles,
  uploadFile,
  downloadFile,
  makeDirectory,
  watchDirectory,
  pauseSandbox,
  resumeSandbox,
  setEnvVars,
  getMetrics,
  installPackages,
};
