/**
 * Postmark Email API Tools for TPMJS
 * Full access to the Postmark transactional email API: send emails, manage templates,
 * bounces, domains, webhooks, message streams, analytics, and more.
 *
 * @requires POSTMARK_SERVER_TOKEN environment variable (server-level operations)
 * @requires POSTMARK_ACCOUNT_TOKEN environment variable (account-level operations: servers, domains, senders, data removals, template push)
 */

import { jsonSchema, tool } from 'ai';

const BASE_URL = 'https://api.postmarkapp.com';

/**
 * Get the server-level API token
 */
function getServerToken(): string {
  const token = process.env.POSTMARK_SERVER_TOKEN;
  if (!token) {
    throw new Error(
      'POSTMARK_SERVER_TOKEN environment variable is required. Get your server token from https://account.postmarkapp.com/servers'
    );
  }
  return token;
}

/**
 * Get the account-level API token
 */
function getAccountToken(): string {
  const token = process.env.POSTMARK_ACCOUNT_TOKEN;
  if (!token) {
    throw new Error(
      'POSTMARK_ACCOUNT_TOKEN environment variable is required. Get your account token from https://account.postmarkapp.com/account/edit'
    );
  }
  return token;
}

/**
 * Make an authenticated request to the Postmark API using the server token
 */
async function apiRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown
): Promise<T> {
  const token = getServerToken();

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Postmark-Server-Token': token,
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    handleApiError(response.status, errorText);
  }

  return response.json() as Promise<T>;
}

/**
 * Make an authenticated request to the Postmark API using the account token
 */
async function accountApiRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown
): Promise<T> {
  const token = getAccountToken();

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Postmark-Account-Token': token,
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    handleApiError(response.status, errorText);
  }

  return response.json() as Promise<T>;
}

/**
 * Handle API errors with specific messages for common HTTP status codes
 */
function handleApiError(status: number, errorText: string): never {
  switch (status) {
    case 400:
      throw new Error(`Bad request: ${errorText}`);
    case 401:
      throw new Error(
        'Authentication failed: Invalid Postmark token. Check POSTMARK_SERVER_TOKEN or POSTMARK_ACCOUNT_TOKEN.'
      );
    case 403:
      throw new Error(`Access forbidden: ${errorText}`);
    case 404:
      throw new Error(`Resource not found: ${errorText}`);
    case 422:
      throw new Error(`Validation error: ${errorText}`);
    case 429:
      throw new Error(`Rate limit exceeded: ${errorText}`);
    case 500:
    case 502:
    case 503:
      throw new Error(`Postmark service error (${status}): ${errorText}`);
    default:
      throw new Error(`Postmark API error: HTTP ${status} - ${errorText}`);
  }
}

// ============================================================================
// Email Sending
// ============================================================================

export interface SendEmailInput {
  From: string;
  To: string;
  Cc?: string;
  Bcc?: string;
  Subject?: string;
  Tag?: string;
  HtmlBody?: string;
  TextBody?: string;
  ReplyTo?: string;
  Metadata?: Record<string, string>;
  Headers?: Array<{ Name: string; Value: string }>;
  Attachments?: Array<{ Name: string; Content: string; ContentType: string; ContentID?: string }>;
  TrackOpens?: boolean;
  TrackLinks?: 'None' | 'HtmlAndText' | 'HtmlOnly' | 'TextOnly';
  MessageStream?: string;
}

export interface SendEmailResult {
  To: string;
  SubmittedAt: string;
  MessageID: string;
  ErrorCode: number;
  Message: string;
}

export const sendEmail = tool({
  description:
    'Send a single transactional email via Postmark. Requires From, To, and either HtmlBody, TextBody, or both.',
  inputSchema: jsonSchema<SendEmailInput>({
    type: 'object',
    properties: {
      From: { type: 'string', description: 'Sender email address.' },
      To: { type: 'string', description: 'Recipient email address(es), comma-separated.' },
      Cc: { type: 'string', description: 'CC recipients, comma-separated.' },
      Bcc: { type: 'string', description: 'BCC recipients, comma-separated.' },
      Subject: { type: 'string', description: 'Email subject line.' },
      Tag: { type: 'string', description: 'Tag for categorizing the email.' },
      HtmlBody: { type: 'string', description: 'HTML body of the email.' },
      TextBody: { type: 'string', description: 'Plain text body of the email.' },
      ReplyTo: { type: 'string', description: 'Reply-to email address.' },
      Metadata: {
        type: 'object',
        description: 'Key-value metadata pairs.',
        additionalProperties: { type: 'string' },
      },
      Headers: {
        type: 'array',
        description: 'Custom email headers.',
        items: {
          type: 'object',
          properties: {
            Name: { type: 'string' },
            Value: { type: 'string' },
          },
          required: ['Name', 'Value'],
        },
      },
      Attachments: {
        type: 'array',
        description: 'File attachments (base64-encoded content).',
        items: {
          type: 'object',
          properties: {
            Name: { type: 'string', description: 'Filename.' },
            Content: { type: 'string', description: 'Base64-encoded file content.' },
            ContentType: { type: 'string', description: 'MIME type.' },
            ContentID: { type: 'string', description: 'Content ID for inline images.' },
          },
          required: ['Name', 'Content', 'ContentType'],
        },
      },
      TrackOpens: { type: 'boolean', description: 'Enable open tracking.' },
      TrackLinks: {
        type: 'string',
        enum: ['None', 'HtmlAndText', 'HtmlOnly', 'TextOnly'],
        description: 'Link tracking mode.',
      },
      MessageStream: { type: 'string', description: 'Message stream ID. Default: outbound.' },
    },
    required: ['From', 'To'],
    additionalProperties: false,
  }),
  async execute(input: SendEmailInput): Promise<SendEmailResult> {
    return apiRequest<SendEmailResult>('POST', '/email', input);
  },
});

export interface SendBatchEmailsInput {
  Messages: SendEmailInput[];
}

export const sendBatchEmails = tool({
  description: 'Send a batch of up to 500 emails in a single API call.',
  inputSchema: jsonSchema<SendBatchEmailsInput>({
    type: 'object',
    properties: {
      Messages: {
        type: 'array',
        description: 'Array of email messages (max 500).',
        items: {
          type: 'object',
          properties: {
            From: { type: 'string' },
            To: { type: 'string' },
            Cc: { type: 'string' },
            Bcc: { type: 'string' },
            Subject: { type: 'string' },
            Tag: { type: 'string' },
            HtmlBody: { type: 'string' },
            TextBody: { type: 'string' },
            ReplyTo: { type: 'string' },
            TrackOpens: { type: 'boolean' },
            TrackLinks: { type: 'string' },
            MessageStream: { type: 'string' },
          },
          required: ['From', 'To'],
        },
      },
    },
    required: ['Messages'],
    additionalProperties: false,
  }),
  async execute(input: SendBatchEmailsInput): Promise<SendEmailResult[]> {
    return apiRequest<SendEmailResult[]>('POST', '/email/batch', input.Messages);
  },
});

export interface SendEmailWithTemplateInput {
  TemplateId?: number;
  TemplateAlias?: string;
  TemplateModel: Record<string, unknown>;
  From: string;
  To: string;
  Cc?: string;
  Bcc?: string;
  Tag?: string;
  ReplyTo?: string;
  Metadata?: Record<string, string>;
  Headers?: Array<{ Name: string; Value: string }>;
  Attachments?: Array<{ Name: string; Content: string; ContentType: string; ContentID?: string }>;
  TrackOpens?: boolean;
  TrackLinks?: 'None' | 'HtmlAndText' | 'HtmlOnly' | 'TextOnly';
  MessageStream?: string;
  InlineCss?: boolean;
}

export const sendEmailWithTemplate = tool({
  description:
    'Send an email using a Postmark template. Provide either TemplateId or TemplateAlias.',
  inputSchema: jsonSchema<SendEmailWithTemplateInput>({
    type: 'object',
    properties: {
      TemplateId: { type: 'number', description: 'Numeric template ID.' },
      TemplateAlias: { type: 'string', description: 'Template alias string.' },
      TemplateModel: {
        type: 'object',
        description: 'Template variable values.',
        additionalProperties: true,
      },
      From: { type: 'string', description: 'Sender email address.' },
      To: { type: 'string', description: 'Recipient email address(es).' },
      Cc: { type: 'string', description: 'CC recipients.' },
      Bcc: { type: 'string', description: 'BCC recipients.' },
      Tag: { type: 'string', description: 'Tag for categorizing.' },
      ReplyTo: { type: 'string', description: 'Reply-to address.' },
      Metadata: {
        type: 'object',
        description: 'Metadata key-value pairs.',
        additionalProperties: { type: 'string' },
      },
      Headers: {
        type: 'array',
        items: {
          type: 'object',
          properties: { Name: { type: 'string' }, Value: { type: 'string' } },
          required: ['Name', 'Value'],
        },
      },
      Attachments: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            Name: { type: 'string' },
            Content: { type: 'string' },
            ContentType: { type: 'string' },
            ContentID: { type: 'string' },
          },
          required: ['Name', 'Content', 'ContentType'],
        },
      },
      TrackOpens: { type: 'boolean' },
      TrackLinks: { type: 'string', enum: ['None', 'HtmlAndText', 'HtmlOnly', 'TextOnly'] },
      MessageStream: { type: 'string' },
      InlineCss: { type: 'boolean', description: 'Inline CSS in the HTML body.' },
    },
    required: ['TemplateModel', 'From', 'To'],
    additionalProperties: false,
  }),
  async execute(input: SendEmailWithTemplateInput): Promise<SendEmailResult> {
    return apiRequest<SendEmailResult>('POST', '/email/withTemplate', input);
  },
});

export interface SendBatchWithTemplatesInput {
  Messages: SendEmailWithTemplateInput[];
}

export const sendBatchWithTemplates = tool({
  description: 'Send a batch of templated emails in a single API call (max 500).',
  inputSchema: jsonSchema<SendBatchWithTemplatesInput>({
    type: 'object',
    properties: {
      Messages: {
        type: 'array',
        description: 'Array of templated email messages.',
        items: {
          type: 'object',
          properties: {
            TemplateId: { type: 'number' },
            TemplateAlias: { type: 'string' },
            TemplateModel: { type: 'object', additionalProperties: true },
            From: { type: 'string' },
            To: { type: 'string' },
            Cc: { type: 'string' },
            Bcc: { type: 'string' },
            Tag: { type: 'string' },
            ReplyTo: { type: 'string' },
            TrackOpens: { type: 'boolean' },
            TrackLinks: { type: 'string' },
            MessageStream: { type: 'string' },
          },
          required: ['TemplateModel', 'From', 'To'],
        },
      },
    },
    required: ['Messages'],
    additionalProperties: false,
  }),
  async execute(input: SendBatchWithTemplatesInput): Promise<SendEmailResult[]> {
    return apiRequest<SendEmailResult[]>('POST', '/email/batchWithTemplates', {
      Messages: input.Messages,
    });
  },
});

// ============================================================================
// Bulk Email
// ============================================================================

export interface SendBulkEmailInput {
  From: string;
  To: string;
  Cc?: string;
  Bcc?: string;
  Subject?: string;
  Tag?: string;
  HtmlBody?: string;
  TextBody?: string;
  ReplyTo?: string;
  TrackOpens?: boolean;
  TrackLinks?: 'None' | 'HtmlAndText' | 'HtmlOnly' | 'TextOnly';
  MessageStream?: string;
}

export interface BulkEmailJobResult {
  JobId: string;
  SubmittedAt: string;
  ErrorCode: number;
  Message: string;
}

export const sendBulkEmail = tool({
  description: 'Submit a bulk email job for large-scale sending.',
  inputSchema: jsonSchema<SendBulkEmailInput>({
    type: 'object',
    properties: {
      From: { type: 'string', description: 'Sender email address.' },
      To: { type: 'string', description: 'Recipient email address(es).' },
      Cc: { type: 'string' },
      Bcc: { type: 'string' },
      Subject: { type: 'string' },
      Tag: { type: 'string' },
      HtmlBody: { type: 'string' },
      TextBody: { type: 'string' },
      ReplyTo: { type: 'string' },
      TrackOpens: { type: 'boolean' },
      TrackLinks: { type: 'string', enum: ['None', 'HtmlAndText', 'HtmlOnly', 'TextOnly'] },
      MessageStream: { type: 'string' },
    },
    required: ['From', 'To'],
    additionalProperties: false,
  }),
  async execute(input: SendBulkEmailInput): Promise<BulkEmailJobResult> {
    return apiRequest<BulkEmailJobResult>('POST', '/email/bulk', input);
  },
});

export const getBulkEmailStatus = tool({
  description: 'Get the status of a bulk email job.',
  inputSchema: jsonSchema<{ id: string }>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Bulk email job ID.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: { id: string }): Promise<unknown> {
    return apiRequest<unknown>('GET', `/email/bulk/${encodeURIComponent(input.id)}`);
  },
});

// ============================================================================
// Bounces
// ============================================================================

export const getDeliveryStats = tool({
  description: 'Get delivery statistics including bounce counts by type.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute(): Promise<unknown> {
    return apiRequest<unknown>('GET', '/deliverystats');
  },
});

export interface SearchBouncesInput {
  count: number;
  offset: number;
  type?: string;
  inactive?: boolean;
  emailFilter?: string;
  tag?: string;
  messageID?: string;
  fromdate?: string;
  todate?: string;
  messagestream?: string;
}

export const searchBounces = tool({
  description: 'Search bounces with optional filters like type, date range, and email.',
  inputSchema: jsonSchema<SearchBouncesInput>({
    type: 'object',
    properties: {
      count: { type: 'number', description: 'Number of bounces to return (max 500).' },
      offset: { type: 'number', description: 'Number of bounces to skip.' },
      type: {
        type: 'string',
        description: 'Bounce type filter (e.g., HardBounce, SoftBounce, SpamNotification).',
      },
      inactive: { type: 'boolean', description: 'Filter by inactive status.' },
      emailFilter: { type: 'string', description: 'Filter by email address.' },
      tag: { type: 'string', description: 'Filter by tag.' },
      messageID: { type: 'string', description: 'Filter by message ID.' },
      fromdate: { type: 'string', description: 'Start date (YYYY-MM-DD).' },
      todate: { type: 'string', description: 'End date (YYYY-MM-DD).' },
      messagestream: { type: 'string', description: 'Message stream ID.' },
    },
    required: ['count', 'offset'],
    additionalProperties: false,
  }),
  async execute(input: SearchBouncesInput): Promise<unknown> {
    const params = new URLSearchParams();
    params.set('count', input.count.toString());
    params.set('offset', input.offset.toString());
    if (input.type) params.set('type', input.type);
    if (input.inactive !== undefined) params.set('inactive', input.inactive.toString());
    if (input.emailFilter) params.set('emailFilter', input.emailFilter);
    if (input.tag) params.set('tag', input.tag);
    if (input.messageID) params.set('messageID', input.messageID);
    if (input.fromdate) params.set('fromdate', input.fromdate);
    if (input.todate) params.set('todate', input.todate);
    if (input.messagestream) params.set('messagestream', input.messagestream);
    return apiRequest<unknown>('GET', `/bounces?${params.toString()}`);
  },
});

export const getBounce = tool({
  description: 'Get details of a specific bounce by ID.',
  inputSchema: jsonSchema<{ id: number }>({
    type: 'object',
    properties: {
      id: { type: 'number', description: 'Bounce ID.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: { id: number }): Promise<unknown> {
    return apiRequest<unknown>('GET', `/bounces/${encodeURIComponent(input.id)}`);
  },
});

export const getBounceDump = tool({
  description: 'Get the raw SMTP dump for a specific bounce.',
  inputSchema: jsonSchema<{ id: number }>({
    type: 'object',
    properties: {
      id: { type: 'number', description: 'Bounce ID.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: { id: number }): Promise<unknown> {
    return apiRequest<unknown>('GET', `/bounces/${encodeURIComponent(input.id)}/dump`);
  },
});

export const activateBounce = tool({
  description: 'Activate a bounced email address to allow sending again.',
  inputSchema: jsonSchema<{ id: number }>({
    type: 'object',
    properties: {
      id: { type: 'number', description: 'Bounce ID to activate.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: { id: number }): Promise<unknown> {
    return apiRequest<unknown>('PUT', `/bounces/${encodeURIComponent(input.id)}/activate`);
  },
});

// ============================================================================
// Templates
// ============================================================================

export interface ListTemplatesInput {
  Count: number;
  Offset: number;
  TemplateType?: 'Standard' | 'Layout';
  LayoutTemplate?: string;
}

export const listTemplates = tool({
  description: 'List email templates with optional filtering by type.',
  inputSchema: jsonSchema<ListTemplatesInput>({
    type: 'object',
    properties: {
      Count: { type: 'number', description: 'Number of templates to return.' },
      Offset: { type: 'number', description: 'Number of templates to skip.' },
      TemplateType: {
        type: 'string',
        enum: ['Standard', 'Layout'],
        description: 'Filter by template type.',
      },
      LayoutTemplate: { type: 'string', description: 'Filter by layout template alias.' },
    },
    required: ['Count', 'Offset'],
    additionalProperties: false,
  }),
  async execute(input: ListTemplatesInput): Promise<unknown> {
    const params = new URLSearchParams();
    params.set('Count', input.Count.toString());
    params.set('Offset', input.Offset.toString());
    if (input.TemplateType) params.set('TemplateType', input.TemplateType);
    if (input.LayoutTemplate) params.set('LayoutTemplate', input.LayoutTemplate);
    return apiRequest<unknown>('GET', `/templates?${params.toString()}`);
  },
});

export const getTemplate = tool({
  description: 'Get details of a specific template by ID or alias.',
  inputSchema: jsonSchema<{ templateIdOrAlias: string }>({
    type: 'object',
    properties: {
      templateIdOrAlias: { type: 'string', description: 'Template ID (numeric) or alias.' },
    },
    required: ['templateIdOrAlias'],
    additionalProperties: false,
  }),
  async execute(input: { templateIdOrAlias: string }): Promise<unknown> {
    return apiRequest<unknown>('GET', `/templates/${encodeURIComponent(input.templateIdOrAlias)}`);
  },
});

export interface CreateTemplateInput {
  Name: string;
  Subject?: string;
  HtmlBody?: string;
  TextBody?: string;
  Alias?: string;
  TemplateType?: 'Standard' | 'Layout';
  LayoutTemplate?: string;
}

export const createTemplate = tool({
  description: 'Create a new email template.',
  inputSchema: jsonSchema<CreateTemplateInput>({
    type: 'object',
    properties: {
      Name: { type: 'string', description: 'Template name.' },
      Subject: { type: 'string', description: 'Default subject line (supports Mustachio).' },
      HtmlBody: { type: 'string', description: 'HTML body (supports Mustachio).' },
      TextBody: { type: 'string', description: 'Text body (supports Mustachio).' },
      Alias: { type: 'string', description: 'Optional alias for easy reference.' },
      TemplateType: { type: 'string', enum: ['Standard', 'Layout'], description: 'Template type.' },
      LayoutTemplate: { type: 'string', description: 'Layout template alias to use.' },
    },
    required: ['Name'],
    additionalProperties: false,
  }),
  async execute(input: CreateTemplateInput): Promise<unknown> {
    return apiRequest<unknown>('POST', '/templates', input);
  },
});

export interface UpdateTemplateInput {
  templateIdOrAlias: string;
  Name?: string;
  Subject?: string;
  HtmlBody?: string;
  TextBody?: string;
  Alias?: string;
  LayoutTemplate?: string;
}

export const updateTemplate = tool({
  description: 'Update an existing email template.',
  inputSchema: jsonSchema<UpdateTemplateInput>({
    type: 'object',
    properties: {
      templateIdOrAlias: { type: 'string', description: 'Template ID or alias.' },
      Name: { type: 'string', description: 'Template name.' },
      Subject: { type: 'string', description: 'Subject line.' },
      HtmlBody: { type: 'string', description: 'HTML body.' },
      TextBody: { type: 'string', description: 'Text body.' },
      Alias: { type: 'string', description: 'Template alias.' },
      LayoutTemplate: { type: 'string', description: 'Layout template alias.' },
    },
    required: ['templateIdOrAlias'],
    additionalProperties: false,
  }),
  async execute(input: UpdateTemplateInput): Promise<unknown> {
    const { templateIdOrAlias, ...body } = input;
    return apiRequest<unknown>('PUT', `/templates/${encodeURIComponent(templateIdOrAlias)}`, body);
  },
});

export const deleteTemplate = tool({
  description: 'Delete an email template.',
  inputSchema: jsonSchema<{ templateIdOrAlias: string }>({
    type: 'object',
    properties: {
      templateIdOrAlias: { type: 'string', description: 'Template ID or alias to delete.' },
    },
    required: ['templateIdOrAlias'],
    additionalProperties: false,
  }),
  async execute(input: { templateIdOrAlias: string }): Promise<unknown> {
    return apiRequest<unknown>(
      'DELETE',
      `/templates/${encodeURIComponent(input.templateIdOrAlias)}`
    );
  },
});

export interface ValidateTemplateInput {
  Subject?: string;
  HtmlBody?: string;
  TextBody?: string;
  TestRenderModel?: Record<string, unknown>;
  InlineCssForHtmlTestRender?: boolean;
  TemplateType?: 'Standard' | 'Layout';
  LayoutTemplate?: string;
}

export const validateTemplate = tool({
  description: 'Validate template content and test render with a model.',
  inputSchema: jsonSchema<ValidateTemplateInput>({
    type: 'object',
    properties: {
      Subject: { type: 'string', description: 'Subject line to validate.' },
      HtmlBody: { type: 'string', description: 'HTML body to validate.' },
      TextBody: { type: 'string', description: 'Text body to validate.' },
      TestRenderModel: {
        type: 'object',
        description: 'Model data for test rendering.',
        additionalProperties: true,
      },
      InlineCssForHtmlTestRender: { type: 'boolean', description: 'Inline CSS in test render.' },
      TemplateType: { type: 'string', enum: ['Standard', 'Layout'] },
      LayoutTemplate: { type: 'string' },
    },
    additionalProperties: false,
  }),
  async execute(input: ValidateTemplateInput): Promise<unknown> {
    return apiRequest<unknown>('POST', '/templates/validate', input);
  },
});

export interface PushTemplatesInput {
  SourceServerID: number;
  DestinationServerID: number;
  PerformChanges: boolean;
}

export const pushTemplates = tool({
  description: 'Push templates from one server to another. Uses account token.',
  inputSchema: jsonSchema<PushTemplatesInput>({
    type: 'object',
    properties: {
      SourceServerID: { type: 'number', description: 'Source server ID.' },
      DestinationServerID: { type: 'number', description: 'Destination server ID.' },
      PerformChanges: {
        type: 'boolean',
        description: 'Set to true to apply changes, false for dry-run preview.',
      },
    },
    required: ['SourceServerID', 'DestinationServerID', 'PerformChanges'],
    additionalProperties: false,
  }),
  async execute(input: PushTemplatesInput): Promise<unknown> {
    return accountApiRequest<unknown>('PUT', '/templates/push', input);
  },
});

// ============================================================================
// Server Configuration (current server)
// ============================================================================

export const getServer = tool({
  description: 'Get the current server configuration.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute(): Promise<unknown> {
    return apiRequest<unknown>('GET', '/server');
  },
});

export interface UpdateServerInput {
  Name?: string;
  Color?: string;
  SmtpApiActivated?: boolean;
  RawEmailEnabled?: boolean;
  InboundHookUrl?: string;
  BounceHookUrl?: string;
  OpenHookUrl?: string;
  PostFirstOpenOnly?: boolean;
  TrackOpens?: boolean;
  TrackLinks?: 'None' | 'HtmlAndText' | 'HtmlOnly' | 'TextOnly';
  InboundDomain?: string;
  InboundSpamThreshold?: number;
  ClickHookUrl?: string;
  DeliveryHookUrl?: string;
}

export const updateServer = tool({
  description: 'Update the current server configuration.',
  inputSchema: jsonSchema<UpdateServerInput>({
    type: 'object',
    properties: {
      Name: { type: 'string', description: 'Server name.' },
      Color: {
        type: 'string',
        description:
          'Server color (e.g., purple, blue, turquoise, green, red, yellow, grey, orange).',
      },
      SmtpApiActivated: { type: 'boolean', description: 'Enable SMTP API.' },
      RawEmailEnabled: { type: 'boolean', description: 'Enable raw email access.' },
      InboundHookUrl: { type: 'string', description: 'Inbound webhook URL.' },
      BounceHookUrl: { type: 'string', description: 'Bounce webhook URL.' },
      OpenHookUrl: { type: 'string', description: 'Open tracking webhook URL.' },
      PostFirstOpenOnly: { type: 'boolean', description: 'Only post first open.' },
      TrackOpens: { type: 'boolean', description: 'Enable open tracking.' },
      TrackLinks: { type: 'string', enum: ['None', 'HtmlAndText', 'HtmlOnly', 'TextOnly'] },
      InboundDomain: { type: 'string', description: 'Inbound processing domain.' },
      InboundSpamThreshold: { type: 'number', description: 'Spam threshold (0-25).' },
      ClickHookUrl: { type: 'string', description: 'Click tracking webhook URL.' },
      DeliveryHookUrl: { type: 'string', description: 'Delivery webhook URL.' },
    },
    additionalProperties: false,
  }),
  async execute(input: UpdateServerInput): Promise<unknown> {
    return apiRequest<unknown>('PUT', '/server', input);
  },
});

// ============================================================================
// Servers Management (account token)
// ============================================================================

export interface ListServersInput {
  count: number;
  offset: number;
  name?: string;
}

export const listServers = tool({
  description: 'List all servers in the account. Uses account token.',
  inputSchema: jsonSchema<ListServersInput>({
    type: 'object',
    properties: {
      count: { type: 'number', description: 'Number of servers to return.' },
      offset: { type: 'number', description: 'Number of servers to skip.' },
      name: { type: 'string', description: 'Filter by server name.' },
    },
    required: ['count', 'offset'],
    additionalProperties: false,
  }),
  async execute(input: ListServersInput): Promise<unknown> {
    const params = new URLSearchParams();
    params.set('count', input.count.toString());
    params.set('offset', input.offset.toString());
    if (input.name) params.set('name', input.name);
    return accountApiRequest<unknown>('GET', `/servers?${params.toString()}`);
  },
});

export const getServerById = tool({
  description: 'Get a specific server by ID. Uses account token.',
  inputSchema: jsonSchema<{ id: number }>({
    type: 'object',
    properties: {
      id: { type: 'number', description: 'Server ID.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: { id: number }): Promise<unknown> {
    return accountApiRequest<unknown>('GET', `/servers/${encodeURIComponent(input.id)}`);
  },
});

export interface CreateServerInput {
  Name: string;
  Color?: string;
  SmtpApiActivated?: boolean;
  RawEmailEnabled?: boolean;
  InboundHookUrl?: string;
  BounceHookUrl?: string;
  OpenHookUrl?: string;
  PostFirstOpenOnly?: boolean;
  TrackOpens?: boolean;
  TrackLinks?: 'None' | 'HtmlAndText' | 'HtmlOnly' | 'TextOnly';
  InboundDomain?: string;
  InboundSpamThreshold?: number;
  ClickHookUrl?: string;
  DeliveryHookUrl?: string;
}

export const createServer = tool({
  description: 'Create a new server in the account. Uses account token.',
  inputSchema: jsonSchema<CreateServerInput>({
    type: 'object',
    properties: {
      Name: { type: 'string', description: 'Server name.' },
      Color: { type: 'string', description: 'Server color.' },
      SmtpApiActivated: { type: 'boolean' },
      RawEmailEnabled: { type: 'boolean' },
      InboundHookUrl: { type: 'string' },
      BounceHookUrl: { type: 'string' },
      OpenHookUrl: { type: 'string' },
      PostFirstOpenOnly: { type: 'boolean' },
      TrackOpens: { type: 'boolean' },
      TrackLinks: { type: 'string', enum: ['None', 'HtmlAndText', 'HtmlOnly', 'TextOnly'] },
      InboundDomain: { type: 'string' },
      InboundSpamThreshold: { type: 'number' },
      ClickHookUrl: { type: 'string' },
      DeliveryHookUrl: { type: 'string' },
    },
    required: ['Name'],
    additionalProperties: false,
  }),
  async execute(input: CreateServerInput): Promise<unknown> {
    return accountApiRequest<unknown>('POST', '/servers', input);
  },
});

export interface UpdateServerByIdInput {
  id: number;
  Name?: string;
  Color?: string;
  SmtpApiActivated?: boolean;
  RawEmailEnabled?: boolean;
  InboundHookUrl?: string;
  BounceHookUrl?: string;
  OpenHookUrl?: string;
  PostFirstOpenOnly?: boolean;
  TrackOpens?: boolean;
  TrackLinks?: 'None' | 'HtmlAndText' | 'HtmlOnly' | 'TextOnly';
  InboundDomain?: string;
  InboundSpamThreshold?: number;
  ClickHookUrl?: string;
  DeliveryHookUrl?: string;
}

export const updateServerById = tool({
  description: 'Update a specific server by ID. Uses account token.',
  inputSchema: jsonSchema<UpdateServerByIdInput>({
    type: 'object',
    properties: {
      id: { type: 'number', description: 'Server ID.' },
      Name: { type: 'string' },
      Color: { type: 'string' },
      SmtpApiActivated: { type: 'boolean' },
      RawEmailEnabled: { type: 'boolean' },
      InboundHookUrl: { type: 'string' },
      BounceHookUrl: { type: 'string' },
      OpenHookUrl: { type: 'string' },
      PostFirstOpenOnly: { type: 'boolean' },
      TrackOpens: { type: 'boolean' },
      TrackLinks: { type: 'string', enum: ['None', 'HtmlAndText', 'HtmlOnly', 'TextOnly'] },
      InboundDomain: { type: 'string' },
      InboundSpamThreshold: { type: 'number' },
      ClickHookUrl: { type: 'string' },
      DeliveryHookUrl: { type: 'string' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: UpdateServerByIdInput): Promise<unknown> {
    const { id, ...body } = input;
    return accountApiRequest<unknown>('PUT', `/servers/${encodeURIComponent(id)}`, body);
  },
});

export const deleteServer = tool({
  description: 'Delete a server from the account. Uses account token.',
  inputSchema: jsonSchema<{ id: number }>({
    type: 'object',
    properties: {
      id: { type: 'number', description: 'Server ID to delete.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: { id: number }): Promise<unknown> {
    return accountApiRequest<unknown>('DELETE', `/servers/${encodeURIComponent(input.id)}`);
  },
});

// ============================================================================
// Message Streams
// ============================================================================

export const listMessageStreams = tool({
  description: 'List all message streams for the server.',
  inputSchema: jsonSchema<{
    MessageStreamType?: 'Transactional' | 'Inbound' | 'Broadcasts';
    IncludeArchivedStreams?: boolean;
  }>({
    type: 'object',
    properties: {
      MessageStreamType: {
        type: 'string',
        enum: ['Transactional', 'Inbound', 'Broadcasts'],
        description: 'Filter by stream type.',
      },
      IncludeArchivedStreams: { type: 'boolean', description: 'Include archived streams.' },
    },
    additionalProperties: false,
  }),
  async execute(input: {
    MessageStreamType?: string;
    IncludeArchivedStreams?: boolean;
  }): Promise<unknown> {
    const params = new URLSearchParams();
    if (input.MessageStreamType) params.set('MessageStreamType', input.MessageStreamType);
    if (input.IncludeArchivedStreams !== undefined)
      params.set('IncludeArchivedStreams', input.IncludeArchivedStreams.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<unknown>('GET', `/message-streams${query}`);
  },
});

export const getMessageStream = tool({
  description: 'Get details of a specific message stream.',
  inputSchema: jsonSchema<{ id: string }>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Message stream ID.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: { id: string }): Promise<unknown> {
    return apiRequest<unknown>('GET', `/message-streams/${encodeURIComponent(input.id)}`);
  },
});

export interface CreateMessageStreamInput {
  ID: string;
  Name: string;
  MessageStreamType: 'Transactional' | 'Broadcasts';
  Description?: string;
}

export const createMessageStream = tool({
  description: 'Create a new message stream.',
  inputSchema: jsonSchema<CreateMessageStreamInput>({
    type: 'object',
    properties: {
      ID: { type: 'string', description: 'Unique stream ID (lowercase, alphanumeric, hyphens).' },
      Name: { type: 'string', description: 'Display name.' },
      MessageStreamType: {
        type: 'string',
        enum: ['Transactional', 'Broadcasts'],
        description: 'Stream type.',
      },
      Description: { type: 'string', description: 'Optional description.' },
    },
    required: ['ID', 'Name', 'MessageStreamType'],
    additionalProperties: false,
  }),
  async execute(input: CreateMessageStreamInput): Promise<unknown> {
    return apiRequest<unknown>('POST', '/message-streams', input);
  },
});

export interface UpdateMessageStreamInput {
  id: string;
  Name?: string;
  Description?: string;
}

export const updateMessageStream = tool({
  description: "Update a message stream's name or description.",
  inputSchema: jsonSchema<UpdateMessageStreamInput>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Message stream ID.' },
      Name: { type: 'string', description: 'New display name.' },
      Description: { type: 'string', description: 'New description.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: UpdateMessageStreamInput): Promise<unknown> {
    const { id, ...body } = input;
    return apiRequest<unknown>('PATCH', `/message-streams/${encodeURIComponent(id)}`, body);
  },
});

export const archiveMessageStream = tool({
  description: 'Archive a message stream. Archived streams stop accepting messages.',
  inputSchema: jsonSchema<{ id: string }>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Message stream ID to archive.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: { id: string }): Promise<unknown> {
    return apiRequest<unknown>('POST', `/message-streams/${encodeURIComponent(input.id)}/archive`);
  },
});

export const unarchiveMessageStream = tool({
  description: 'Unarchive a previously archived message stream.',
  inputSchema: jsonSchema<{ id: string }>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Message stream ID to unarchive.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: { id: string }): Promise<unknown> {
    return apiRequest<unknown>(
      'POST',
      `/message-streams/${encodeURIComponent(input.id)}/unarchive`
    );
  },
});

// ============================================================================
// Messages — Outbound
// ============================================================================

export interface SearchOutboundMessagesInput {
  count: number;
  offset: number;
  recipient?: string;
  fromemail?: string;
  tag?: string;
  status?: string;
  fromdate?: string;
  todate?: string;
  subject?: string;
  metadata_?: string;
  messagestream?: string;
}

export const searchOutboundMessages = tool({
  description: 'Search outbound messages with optional filters.',
  inputSchema: jsonSchema<SearchOutboundMessagesInput>({
    type: 'object',
    properties: {
      count: { type: 'number', description: 'Number of messages to return (max 500).' },
      offset: { type: 'number', description: 'Number of messages to skip.' },
      recipient: { type: 'string', description: 'Filter by recipient email.' },
      fromemail: { type: 'string', description: 'Filter by sender email.' },
      tag: { type: 'string', description: 'Filter by tag.' },
      status: { type: 'string', description: 'Filter by status (queued, sent, processed).' },
      fromdate: { type: 'string', description: 'Start date (YYYY-MM-DD).' },
      todate: { type: 'string', description: 'End date (YYYY-MM-DD).' },
      subject: { type: 'string', description: 'Filter by subject.' },
      metadata_: { type: 'string', description: 'Filter by metadata (key_value format).' },
      messagestream: { type: 'string', description: 'Message stream ID.' },
    },
    required: ['count', 'offset'],
    additionalProperties: false,
  }),
  async execute(input: SearchOutboundMessagesInput): Promise<unknown> {
    const params = new URLSearchParams();
    params.set('count', input.count.toString());
    params.set('offset', input.offset.toString());
    if (input.recipient) params.set('recipient', input.recipient);
    if (input.fromemail) params.set('fromemail', input.fromemail);
    if (input.tag) params.set('tag', input.tag);
    if (input.status) params.set('status', input.status);
    if (input.fromdate) params.set('fromdate', input.fromdate);
    if (input.todate) params.set('todate', input.todate);
    if (input.subject) params.set('subject', input.subject);
    if (input.metadata_) params.set('metadata_', input.metadata_);
    if (input.messagestream) params.set('messagestream', input.messagestream);
    return apiRequest<unknown>('GET', `/messages/outbound?${params.toString()}`);
  },
});

export const getOutboundMessageDetails = tool({
  description: 'Get full details of a specific outbound message.',
  inputSchema: jsonSchema<{ id: string }>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Message ID.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: { id: string }): Promise<unknown> {
    return apiRequest<unknown>('GET', `/messages/outbound/${encodeURIComponent(input.id)}/details`);
  },
});

export const getOutboundMessageDump = tool({
  description: 'Get the raw SMTP dump of an outbound message.',
  inputSchema: jsonSchema<{ id: string }>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Message ID.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: { id: string }): Promise<unknown> {
    return apiRequest<unknown>('GET', `/messages/outbound/${encodeURIComponent(input.id)}/dump`);
  },
});

export const getOutboundMessageOpens = tool({
  description: 'Get open events for a specific outbound message.',
  inputSchema: jsonSchema<{ id: string; count?: number; offset?: number }>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Message ID.' },
      count: { type: 'number', description: 'Number of results.' },
      offset: { type: 'number', description: 'Number to skip.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: { id: string; count?: number; offset?: number }): Promise<unknown> {
    const params = new URLSearchParams();
    if (input.count) params.set('count', input.count.toString());
    if (input.offset) params.set('offset', input.offset.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<unknown>(
      'GET',
      `/messages/outbound/opens/${encodeURIComponent(input.id)}${query}`
    );
  },
});

export const getOutboundMessageClicks = tool({
  description: 'Get click events for a specific outbound message.',
  inputSchema: jsonSchema<{ id: string; count?: number; offset?: number }>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Message ID.' },
      count: { type: 'number', description: 'Number of results.' },
      offset: { type: 'number', description: 'Number to skip.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: { id: string; count?: number; offset?: number }): Promise<unknown> {
    const params = new URLSearchParams();
    if (input.count) params.set('count', input.count.toString());
    if (input.offset) params.set('offset', input.offset.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<unknown>(
      'GET',
      `/messages/outbound/clicks/${encodeURIComponent(input.id)}${query}`
    );
  },
});

// ============================================================================
// Messages — Inbound
// ============================================================================

export interface SearchInboundMessagesInput {
  count: number;
  offset: number;
  recipient?: string;
  fromemail?: string;
  tag?: string;
  status?: string;
  fromdate?: string;
  todate?: string;
  subject?: string;
  mailboxhash?: string;
}

export const searchInboundMessages = tool({
  description: 'Search inbound messages with optional filters.',
  inputSchema: jsonSchema<SearchInboundMessagesInput>({
    type: 'object',
    properties: {
      count: { type: 'number', description: 'Number of messages to return (max 500).' },
      offset: { type: 'number', description: 'Number of messages to skip.' },
      recipient: { type: 'string', description: 'Filter by recipient email.' },
      fromemail: { type: 'string', description: 'Filter by sender email.' },
      tag: { type: 'string', description: 'Filter by tag.' },
      status: {
        type: 'string',
        description: 'Filter by status (blocked, processed, queued, failed, scheduled).',
      },
      fromdate: { type: 'string', description: 'Start date (YYYY-MM-DD).' },
      todate: { type: 'string', description: 'End date (YYYY-MM-DD).' },
      subject: { type: 'string', description: 'Filter by subject.' },
      mailboxhash: { type: 'string', description: 'Filter by mailbox hash.' },
    },
    required: ['count', 'offset'],
    additionalProperties: false,
  }),
  async execute(input: SearchInboundMessagesInput): Promise<unknown> {
    const params = new URLSearchParams();
    params.set('count', input.count.toString());
    params.set('offset', input.offset.toString());
    if (input.recipient) params.set('recipient', input.recipient);
    if (input.fromemail) params.set('fromemail', input.fromemail);
    if (input.tag) params.set('tag', input.tag);
    if (input.status) params.set('status', input.status);
    if (input.fromdate) params.set('fromdate', input.fromdate);
    if (input.todate) params.set('todate', input.todate);
    if (input.subject) params.set('subject', input.subject);
    if (input.mailboxhash) params.set('mailboxhash', input.mailboxhash);
    return apiRequest<unknown>('GET', `/messages/inbound?${params.toString()}`);
  },
});

export const getInboundMessageDetails = tool({
  description: 'Get full details of a specific inbound message.',
  inputSchema: jsonSchema<{ id: string }>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Inbound message ID.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: { id: string }): Promise<unknown> {
    return apiRequest<unknown>('GET', `/messages/inbound/${encodeURIComponent(input.id)}/details`);
  },
});

export const bypassInboundRules = tool({
  description: 'Bypass inbound rules for a specific message, reprocessing it.',
  inputSchema: jsonSchema<{ id: string }>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Inbound message ID.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: { id: string }): Promise<unknown> {
    return apiRequest<unknown>('PUT', `/messages/inbound/${encodeURIComponent(input.id)}/bypass`);
  },
});

export const retryInboundMessage = tool({
  description: 'Retry processing of an inbound message.',
  inputSchema: jsonSchema<{ id: string }>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Inbound message ID.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: { id: string }): Promise<unknown> {
    return apiRequest<unknown>('PUT', `/messages/inbound/${encodeURIComponent(input.id)}/retry`);
  },
});

// ============================================================================
// Messages — Search Opens/Clicks
// ============================================================================

export interface SearchMessageOpensInput {
  count: number;
  offset: number;
  recipient?: string;
  tag?: string;
  client_name?: string;
  client_company?: string;
  client_family?: string;
  os_name?: string;
  os_family?: string;
  os_company?: string;
  platform?: string;
  region?: string;
  city?: string;
  messagestream?: string;
}

export const searchMessageOpens = tool({
  description: 'Search message open events across all outbound messages.',
  inputSchema: jsonSchema<SearchMessageOpensInput>({
    type: 'object',
    properties: {
      count: { type: 'number', description: 'Number of results (max 500).' },
      offset: { type: 'number', description: 'Number to skip.' },
      recipient: { type: 'string', description: 'Filter by recipient.' },
      tag: { type: 'string', description: 'Filter by tag.' },
      client_name: { type: 'string', description: 'Filter by email client name.' },
      client_company: { type: 'string', description: 'Filter by email client company.' },
      client_family: { type: 'string', description: 'Filter by email client family.' },
      os_name: { type: 'string', description: 'Filter by OS name.' },
      os_family: { type: 'string', description: 'Filter by OS family.' },
      os_company: { type: 'string', description: 'Filter by OS company.' },
      platform: { type: 'string', description: 'Filter by platform.' },
      region: { type: 'string', description: 'Filter by region.' },
      city: { type: 'string', description: 'Filter by city.' },
      messagestream: { type: 'string', description: 'Message stream ID.' },
    },
    required: ['count', 'offset'],
    additionalProperties: false,
  }),
  async execute(input: SearchMessageOpensInput): Promise<unknown> {
    const params = new URLSearchParams();
    params.set('count', input.count.toString());
    params.set('offset', input.offset.toString());
    if (input.recipient) params.set('recipient', input.recipient);
    if (input.tag) params.set('tag', input.tag);
    if (input.client_name) params.set('client_name', input.client_name);
    if (input.client_company) params.set('client_company', input.client_company);
    if (input.client_family) params.set('client_family', input.client_family);
    if (input.os_name) params.set('os_name', input.os_name);
    if (input.os_family) params.set('os_family', input.os_family);
    if (input.os_company) params.set('os_company', input.os_company);
    if (input.platform) params.set('platform', input.platform);
    if (input.region) params.set('region', input.region);
    if (input.city) params.set('city', input.city);
    if (input.messagestream) params.set('messagestream', input.messagestream);
    return apiRequest<unknown>('GET', `/messages/outbound/opens?${params.toString()}`);
  },
});

export interface SearchMessageClicksInput {
  count: number;
  offset: number;
  recipient?: string;
  tag?: string;
  client_name?: string;
  client_company?: string;
  client_family?: string;
  os_name?: string;
  os_family?: string;
  os_company?: string;
  platform?: string;
  region?: string;
  city?: string;
  messagestream?: string;
}

export const searchMessageClicks = tool({
  description: 'Search message click events across all outbound messages.',
  inputSchema: jsonSchema<SearchMessageClicksInput>({
    type: 'object',
    properties: {
      count: { type: 'number', description: 'Number of results (max 500).' },
      offset: { type: 'number', description: 'Number to skip.' },
      recipient: { type: 'string', description: 'Filter by recipient.' },
      tag: { type: 'string', description: 'Filter by tag.' },
      client_name: { type: 'string', description: 'Filter by browser name.' },
      client_company: { type: 'string', description: 'Filter by browser company.' },
      client_family: { type: 'string', description: 'Filter by browser family.' },
      os_name: { type: 'string', description: 'Filter by OS name.' },
      os_family: { type: 'string', description: 'Filter by OS family.' },
      os_company: { type: 'string', description: 'Filter by OS company.' },
      platform: { type: 'string', description: 'Filter by platform.' },
      region: { type: 'string', description: 'Filter by region.' },
      city: { type: 'string', description: 'Filter by city.' },
      messagestream: { type: 'string', description: 'Message stream ID.' },
    },
    required: ['count', 'offset'],
    additionalProperties: false,
  }),
  async execute(input: SearchMessageClicksInput): Promise<unknown> {
    const params = new URLSearchParams();
    params.set('count', input.count.toString());
    params.set('offset', input.offset.toString());
    if (input.recipient) params.set('recipient', input.recipient);
    if (input.tag) params.set('tag', input.tag);
    if (input.client_name) params.set('client_name', input.client_name);
    if (input.client_company) params.set('client_company', input.client_company);
    if (input.client_family) params.set('client_family', input.client_family);
    if (input.os_name) params.set('os_name', input.os_name);
    if (input.os_family) params.set('os_family', input.os_family);
    if (input.os_company) params.set('os_company', input.os_company);
    if (input.platform) params.set('platform', input.platform);
    if (input.region) params.set('region', input.region);
    if (input.city) params.set('city', input.city);
    if (input.messagestream) params.set('messagestream', input.messagestream);
    return apiRequest<unknown>('GET', `/messages/outbound/clicks?${params.toString()}`);
  },
});

// ============================================================================
// Stats
// ============================================================================

export interface StatsQueryInput {
  tag?: string;
  fromdate?: string;
  todate?: string;
  messagestream?: string;
}

/**
 * Helper to build stats query params
 */
function buildStatsQuery(input: StatsQueryInput): string {
  const params = new URLSearchParams();
  if (input.tag) params.set('tag', input.tag);
  if (input.fromdate) params.set('fromdate', input.fromdate);
  if (input.todate) params.set('todate', input.todate);
  if (input.messagestream) params.set('messagestream', input.messagestream);
  const query = params.toString();
  return query ? `?${query}` : '';
}

const statsInputSchema = jsonSchema<StatsQueryInput>({
  type: 'object',
  properties: {
    tag: { type: 'string', description: 'Filter by tag.' },
    fromdate: { type: 'string', description: 'Start date (YYYY-MM-DD).' },
    todate: { type: 'string', description: 'End date (YYYY-MM-DD).' },
    messagestream: { type: 'string', description: 'Message stream ID.' },
  },
  additionalProperties: false,
});

export const getStatsOverview = tool({
  description: 'Get an overview of outbound email statistics.',
  inputSchema: statsInputSchema,
  async execute(input: StatsQueryInput): Promise<unknown> {
    return apiRequest<unknown>('GET', `/stats/outbound${buildStatsQuery(input)}`);
  },
});

export const getStatsSends = tool({
  description: 'Get send count statistics over time.',
  inputSchema: statsInputSchema,
  async execute(input: StatsQueryInput): Promise<unknown> {
    return apiRequest<unknown>('GET', `/stats/outbound/sends${buildStatsQuery(input)}`);
  },
});

export const getStatsBounces = tool({
  description: 'Get bounce statistics over time.',
  inputSchema: statsInputSchema,
  async execute(input: StatsQueryInput): Promise<unknown> {
    return apiRequest<unknown>('GET', `/stats/outbound/bounces${buildStatsQuery(input)}`);
  },
});

export const getStatsSpamComplaints = tool({
  description: 'Get spam complaint statistics over time.',
  inputSchema: statsInputSchema,
  async execute(input: StatsQueryInput): Promise<unknown> {
    return apiRequest<unknown>('GET', `/stats/outbound/spam${buildStatsQuery(input)}`);
  },
});

export const getStatsTracked = tool({
  description: 'Get tracked email statistics over time.',
  inputSchema: statsInputSchema,
  async execute(input: StatsQueryInput): Promise<unknown> {
    return apiRequest<unknown>('GET', `/stats/outbound/tracked${buildStatsQuery(input)}`);
  },
});

export const getStatsOpens = tool({
  description: 'Get email open statistics over time.',
  inputSchema: statsInputSchema,
  async execute(input: StatsQueryInput): Promise<unknown> {
    return apiRequest<unknown>('GET', `/stats/outbound/opens${buildStatsQuery(input)}`);
  },
});

export const getStatsOpensByPlatform = tool({
  description: 'Get email open statistics grouped by platform.',
  inputSchema: statsInputSchema,
  async execute(input: StatsQueryInput): Promise<unknown> {
    return apiRequest<unknown>('GET', `/stats/outbound/opens/platforms${buildStatsQuery(input)}`);
  },
});

export const getStatsOpensByClient = tool({
  description: 'Get email open statistics grouped by email client.',
  inputSchema: statsInputSchema,
  async execute(input: StatsQueryInput): Promise<unknown> {
    return apiRequest<unknown>(
      'GET',
      `/stats/outbound/opens/emailclients${buildStatsQuery(input)}`
    );
  },
});

export const getStatsClicks = tool({
  description: 'Get link click statistics over time.',
  inputSchema: statsInputSchema,
  async execute(input: StatsQueryInput): Promise<unknown> {
    return apiRequest<unknown>('GET', `/stats/outbound/clicks${buildStatsQuery(input)}`);
  },
});

export const getStatsClicksByBrowser = tool({
  description: 'Get link click statistics grouped by browser family.',
  inputSchema: statsInputSchema,
  async execute(input: StatsQueryInput): Promise<unknown> {
    return apiRequest<unknown>(
      'GET',
      `/stats/outbound/clicks/browserfamilies${buildStatsQuery(input)}`
    );
  },
});

export const getStatsClicksByPlatform = tool({
  description: 'Get link click statistics grouped by platform.',
  inputSchema: statsInputSchema,
  async execute(input: StatsQueryInput): Promise<unknown> {
    return apiRequest<unknown>('GET', `/stats/outbound/clicks/platforms${buildStatsQuery(input)}`);
  },
});

export const getStatsClicksByLocation = tool({
  description: 'Get link click statistics grouped by geographic location.',
  inputSchema: statsInputSchema,
  async execute(input: StatsQueryInput): Promise<unknown> {
    return apiRequest<unknown>('GET', `/stats/outbound/clicks/location${buildStatsQuery(input)}`);
  },
});

// ============================================================================
// Domains (account token)
// ============================================================================

export interface ListDomainsInput {
  count: number;
  offset: number;
}

export const listDomains = tool({
  description: 'List all domains in the account. Uses account token.',
  inputSchema: jsonSchema<ListDomainsInput>({
    type: 'object',
    properties: {
      count: { type: 'number', description: 'Number of domains to return.' },
      offset: { type: 'number', description: 'Number of domains to skip.' },
    },
    required: ['count', 'offset'],
    additionalProperties: false,
  }),
  async execute(input: ListDomainsInput): Promise<unknown> {
    const params = new URLSearchParams();
    params.set('count', input.count.toString());
    params.set('offset', input.offset.toString());
    return accountApiRequest<unknown>('GET', `/domains?${params.toString()}`);
  },
});

export const getDomain = tool({
  description: 'Get details of a specific domain. Uses account token.',
  inputSchema: jsonSchema<{ id: number }>({
    type: 'object',
    properties: {
      id: { type: 'number', description: 'Domain ID.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: { id: number }): Promise<unknown> {
    return accountApiRequest<unknown>('GET', `/domains/${encodeURIComponent(input.id)}`);
  },
});

export interface CreateDomainInput {
  Name: string;
  ReturnPathDomain?: string;
}

export const createDomain = tool({
  description: 'Create a new sending domain. Uses account token.',
  inputSchema: jsonSchema<CreateDomainInput>({
    type: 'object',
    properties: {
      Name: { type: 'string', description: 'Domain name (e.g., example.com).' },
      ReturnPathDomain: { type: 'string', description: 'Custom return-path domain.' },
    },
    required: ['Name'],
    additionalProperties: false,
  }),
  async execute(input: CreateDomainInput): Promise<unknown> {
    return accountApiRequest<unknown>('POST', '/domains', input);
  },
});

export interface UpdateDomainInput {
  id: number;
  ReturnPathDomain?: string;
}

export const updateDomain = tool({
  description: "Update a domain's return-path. Uses account token.",
  inputSchema: jsonSchema<UpdateDomainInput>({
    type: 'object',
    properties: {
      id: { type: 'number', description: 'Domain ID.' },
      ReturnPathDomain: { type: 'string', description: 'New return-path domain.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: UpdateDomainInput): Promise<unknown> {
    const { id, ...body } = input;
    return accountApiRequest<unknown>('PUT', `/domains/${encodeURIComponent(id)}`, body);
  },
});

export const deleteDomain = tool({
  description: 'Delete a domain from the account. Uses account token.',
  inputSchema: jsonSchema<{ id: number }>({
    type: 'object',
    properties: {
      id: { type: 'number', description: 'Domain ID to delete.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: { id: number }): Promise<unknown> {
    return accountApiRequest<unknown>('DELETE', `/domains/${encodeURIComponent(input.id)}`);
  },
});

export const verifyDomainDkim = tool({
  description: 'Trigger DKIM verification for a domain. Uses account token.',
  inputSchema: jsonSchema<{ id: number }>({
    type: 'object',
    properties: {
      id: { type: 'number', description: 'Domain ID.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: { id: number }): Promise<unknown> {
    return accountApiRequest<unknown>('PUT', `/domains/${encodeURIComponent(input.id)}/verifyDkim`);
  },
});

export const verifyDomainReturnPath = tool({
  description: 'Trigger return-path verification for a domain. Uses account token.',
  inputSchema: jsonSchema<{ id: number }>({
    type: 'object',
    properties: {
      id: { type: 'number', description: 'Domain ID.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: { id: number }): Promise<unknown> {
    return accountApiRequest<unknown>(
      'PUT',
      `/domains/${encodeURIComponent(input.id)}/verifyReturnPath`
    );
  },
});

export const verifyDomainSpf = tool({
  description: 'Trigger SPF verification for a domain. Uses account token.',
  inputSchema: jsonSchema<{ id: number }>({
    type: 'object',
    properties: {
      id: { type: 'number', description: 'Domain ID.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: { id: number }): Promise<unknown> {
    return accountApiRequest<unknown>('POST', `/domains/${encodeURIComponent(input.id)}/verifyspf`);
  },
});

export const rotateDomainDkim = tool({
  description: 'Rotate DKIM keys for a domain. Uses account token.',
  inputSchema: jsonSchema<{ id: number }>({
    type: 'object',
    properties: {
      id: { type: 'number', description: 'Domain ID.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: { id: number }): Promise<unknown> {
    return accountApiRequest<unknown>(
      'POST',
      `/domains/${encodeURIComponent(input.id)}/rotatedkim`
    );
  },
});

// ============================================================================
// Sender Signatures (account token)
// ============================================================================

export interface ListSenderSignaturesInput {
  count: number;
  offset: number;
}

export const listSenderSignatures = tool({
  description: 'List all sender signatures in the account. Uses account token.',
  inputSchema: jsonSchema<ListSenderSignaturesInput>({
    type: 'object',
    properties: {
      count: { type: 'number', description: 'Number of signatures to return.' },
      offset: { type: 'number', description: 'Number of signatures to skip.' },
    },
    required: ['count', 'offset'],
    additionalProperties: false,
  }),
  async execute(input: ListSenderSignaturesInput): Promise<unknown> {
    const params = new URLSearchParams();
    params.set('count', input.count.toString());
    params.set('offset', input.offset.toString());
    return accountApiRequest<unknown>('GET', `/senders?${params.toString()}`);
  },
});

export const getSenderSignature = tool({
  description: 'Get details of a specific sender signature. Uses account token.',
  inputSchema: jsonSchema<{ id: number }>({
    type: 'object',
    properties: {
      id: { type: 'number', description: 'Sender signature ID.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: { id: number }): Promise<unknown> {
    return accountApiRequest<unknown>('GET', `/senders/${encodeURIComponent(input.id)}`);
  },
});

export interface CreateSenderSignatureInput {
  FromEmail: string;
  Name: string;
  ReplyToEmail?: string;
  ReturnPathDomain?: string;
}

export const createSenderSignature = tool({
  description: 'Create a new sender signature. Uses account token.',
  inputSchema: jsonSchema<CreateSenderSignatureInput>({
    type: 'object',
    properties: {
      FromEmail: { type: 'string', description: 'Sender email address.' },
      Name: { type: 'string', description: 'Sender display name.' },
      ReplyToEmail: { type: 'string', description: 'Reply-to email address.' },
      ReturnPathDomain: { type: 'string', description: 'Custom return-path domain.' },
    },
    required: ['FromEmail', 'Name'],
    additionalProperties: false,
  }),
  async execute(input: CreateSenderSignatureInput): Promise<unknown> {
    return accountApiRequest<unknown>('POST', '/senders', input);
  },
});

export interface UpdateSenderSignatureInput {
  id: number;
  Name?: string;
  ReplyToEmail?: string;
  ReturnPathDomain?: string;
}

export const updateSenderSignature = tool({
  description: 'Update an existing sender signature. Uses account token.',
  inputSchema: jsonSchema<UpdateSenderSignatureInput>({
    type: 'object',
    properties: {
      id: { type: 'number', description: 'Sender signature ID.' },
      Name: { type: 'string', description: 'Sender display name.' },
      ReplyToEmail: { type: 'string', description: 'Reply-to email address.' },
      ReturnPathDomain: { type: 'string', description: 'Custom return-path domain.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: UpdateSenderSignatureInput): Promise<unknown> {
    const { id, ...body } = input;
    return accountApiRequest<unknown>('PUT', `/senders/${encodeURIComponent(id)}`, body);
  },
});

export const deleteSenderSignature = tool({
  description: 'Delete a sender signature. Uses account token.',
  inputSchema: jsonSchema<{ id: number }>({
    type: 'object',
    properties: {
      id: { type: 'number', description: 'Sender signature ID to delete.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: { id: number }): Promise<unknown> {
    return accountApiRequest<unknown>('DELETE', `/senders/${encodeURIComponent(input.id)}`);
  },
});

export const resendSenderConfirmation = tool({
  description: 'Resend the confirmation email for a sender signature. Uses account token.',
  inputSchema: jsonSchema<{ id: number }>({
    type: 'object',
    properties: {
      id: { type: 'number', description: 'Sender signature ID.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: { id: number }): Promise<unknown> {
    return accountApiRequest<unknown>('POST', `/senders/${encodeURIComponent(input.id)}/resend`);
  },
});

// ============================================================================
// Webhooks
// ============================================================================

export const listWebhooks = tool({
  description: 'List all webhooks for the server.',
  inputSchema: jsonSchema<{ MessageStream?: string }>({
    type: 'object',
    properties: {
      MessageStream: { type: 'string', description: 'Filter by message stream ID.' },
    },
    additionalProperties: false,
  }),
  async execute(input: { MessageStream?: string }): Promise<unknown> {
    const params = new URLSearchParams();
    if (input.MessageStream) params.set('MessageStream', input.MessageStream);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<unknown>('GET', `/webhooks${query}`);
  },
});

export const getWebhook = tool({
  description: 'Get details of a specific webhook.',
  inputSchema: jsonSchema<{ id: number }>({
    type: 'object',
    properties: {
      id: { type: 'number', description: 'Webhook ID.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: { id: number }): Promise<unknown> {
    return apiRequest<unknown>('GET', `/webhooks/${encodeURIComponent(input.id)}`);
  },
});

export interface CreateWebhookInput {
  Url: string;
  MessageStream?: string;
  HttpAuth?: { Username: string; Password: string };
  HttpHeaders?: Array<{ Name: string; Value: string }>;
  Triggers?: {
    Open?: { Enabled: boolean; PostFirstOpenOnly?: boolean };
    Click?: { Enabled: boolean };
    Delivery?: { Enabled: boolean };
    Bounce?: { Enabled: boolean; IncludeContent?: boolean };
    SpamComplaint?: { Enabled: boolean; IncludeContent?: boolean };
    SubscriptionChange?: { Enabled: boolean };
  };
}

export const createWebhook = tool({
  description: 'Create a new webhook.',
  inputSchema: jsonSchema<CreateWebhookInput>({
    type: 'object',
    properties: {
      Url: { type: 'string', description: 'Webhook endpoint URL.' },
      MessageStream: { type: 'string', description: 'Message stream to listen on.' },
      HttpAuth: {
        type: 'object',
        description: 'HTTP basic auth credentials.',
        properties: {
          Username: { type: 'string' },
          Password: { type: 'string' },
        },
        required: ['Username', 'Password'],
      },
      HttpHeaders: {
        type: 'array',
        description: 'Custom HTTP headers sent with webhook.',
        items: {
          type: 'object',
          properties: {
            Name: { type: 'string' },
            Value: { type: 'string' },
          },
          required: ['Name', 'Value'],
        },
      },
      Triggers: {
        type: 'object',
        description: 'Event triggers to enable.',
        properties: {
          Open: {
            type: 'object',
            properties: {
              Enabled: { type: 'boolean' },
              PostFirstOpenOnly: { type: 'boolean' },
            },
            required: ['Enabled'],
          },
          Click: {
            type: 'object',
            properties: { Enabled: { type: 'boolean' } },
            required: ['Enabled'],
          },
          Delivery: {
            type: 'object',
            properties: { Enabled: { type: 'boolean' } },
            required: ['Enabled'],
          },
          Bounce: {
            type: 'object',
            properties: {
              Enabled: { type: 'boolean' },
              IncludeContent: { type: 'boolean' },
            },
            required: ['Enabled'],
          },
          SpamComplaint: {
            type: 'object',
            properties: {
              Enabled: { type: 'boolean' },
              IncludeContent: { type: 'boolean' },
            },
            required: ['Enabled'],
          },
          SubscriptionChange: {
            type: 'object',
            properties: { Enabled: { type: 'boolean' } },
            required: ['Enabled'],
          },
        },
      },
    },
    required: ['Url'],
    additionalProperties: false,
  }),
  async execute(input: CreateWebhookInput): Promise<unknown> {
    return apiRequest<unknown>('POST', '/webhooks', input);
  },
});

export interface UpdateWebhookInput {
  id: number;
  Url?: string;
  HttpAuth?: { Username: string; Password: string };
  HttpHeaders?: Array<{ Name: string; Value: string }>;
  Triggers?: {
    Open?: { Enabled: boolean; PostFirstOpenOnly?: boolean };
    Click?: { Enabled: boolean };
    Delivery?: { Enabled: boolean };
    Bounce?: { Enabled: boolean; IncludeContent?: boolean };
    SpamComplaint?: { Enabled: boolean; IncludeContent?: boolean };
    SubscriptionChange?: { Enabled: boolean };
  };
}

export const updateWebhook = tool({
  description: 'Update an existing webhook.',
  inputSchema: jsonSchema<UpdateWebhookInput>({
    type: 'object',
    properties: {
      id: { type: 'number', description: 'Webhook ID.' },
      Url: { type: 'string', description: 'Webhook endpoint URL.' },
      HttpAuth: {
        type: 'object',
        properties: {
          Username: { type: 'string' },
          Password: { type: 'string' },
        },
        required: ['Username', 'Password'],
      },
      HttpHeaders: {
        type: 'array',
        items: {
          type: 'object',
          properties: { Name: { type: 'string' }, Value: { type: 'string' } },
          required: ['Name', 'Value'],
        },
      },
      Triggers: {
        type: 'object',
        properties: {
          Open: {
            type: 'object',
            properties: { Enabled: { type: 'boolean' }, PostFirstOpenOnly: { type: 'boolean' } },
            required: ['Enabled'],
          },
          Click: {
            type: 'object',
            properties: { Enabled: { type: 'boolean' } },
            required: ['Enabled'],
          },
          Delivery: {
            type: 'object',
            properties: { Enabled: { type: 'boolean' } },
            required: ['Enabled'],
          },
          Bounce: {
            type: 'object',
            properties: { Enabled: { type: 'boolean' }, IncludeContent: { type: 'boolean' } },
            required: ['Enabled'],
          },
          SpamComplaint: {
            type: 'object',
            properties: { Enabled: { type: 'boolean' }, IncludeContent: { type: 'boolean' } },
            required: ['Enabled'],
          },
          SubscriptionChange: {
            type: 'object',
            properties: { Enabled: { type: 'boolean' } },
            required: ['Enabled'],
          },
        },
      },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: UpdateWebhookInput): Promise<unknown> {
    const { id, ...body } = input;
    return apiRequest<unknown>('PUT', `/webhooks/${encodeURIComponent(id)}`, body);
  },
});

export const deleteWebhook = tool({
  description: 'Delete a webhook.',
  inputSchema: jsonSchema<{ id: number }>({
    type: 'object',
    properties: {
      id: { type: 'number', description: 'Webhook ID to delete.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: { id: number }): Promise<unknown> {
    return apiRequest<unknown>('DELETE', `/webhooks/${encodeURIComponent(input.id)}`);
  },
});

// ============================================================================
// Suppressions
// ============================================================================

export interface ListSuppressionsInput {
  streamId: string;
  SuppressionReason?: 'ManualSuppression' | 'HardBounce' | 'SpamComplaint';
  Origin?: 'Recipient' | 'Customer' | 'Admin';
  EmailAddress?: string;
}

export const listSuppressions = tool({
  description: 'List suppressed email addresses for a message stream.',
  inputSchema: jsonSchema<ListSuppressionsInput>({
    type: 'object',
    properties: {
      streamId: { type: 'string', description: 'Message stream ID.' },
      SuppressionReason: {
        type: 'string',
        enum: ['ManualSuppression', 'HardBounce', 'SpamComplaint'],
        description: 'Filter by suppression reason.',
      },
      Origin: {
        type: 'string',
        enum: ['Recipient', 'Customer', 'Admin'],
        description: 'Filter by origin.',
      },
      EmailAddress: { type: 'string', description: 'Filter by email address.' },
    },
    required: ['streamId'],
    additionalProperties: false,
  }),
  async execute(input: ListSuppressionsInput): Promise<unknown> {
    const { streamId, ...queryParams } = input;
    const params = new URLSearchParams();
    if (queryParams.SuppressionReason)
      params.set('SuppressionReason', queryParams.SuppressionReason);
    if (queryParams.Origin) params.set('Origin', queryParams.Origin);
    if (queryParams.EmailAddress) params.set('EmailAddress', queryParams.EmailAddress);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<unknown>(
      'GET',
      `/message-streams/${encodeURIComponent(streamId)}/suppressions/dump${query}`
    );
  },
});

export interface CreateSuppressionsInput {
  streamId: string;
  Suppressions: Array<{ EmailAddress: string }>;
}

export const createSuppressions = tool({
  description: 'Add email addresses to the suppression list for a message stream.',
  inputSchema: jsonSchema<CreateSuppressionsInput>({
    type: 'object',
    properties: {
      streamId: { type: 'string', description: 'Message stream ID.' },
      Suppressions: {
        type: 'array',
        description: 'Email addresses to suppress.',
        items: {
          type: 'object',
          properties: {
            EmailAddress: { type: 'string', description: 'Email address to suppress.' },
          },
          required: ['EmailAddress'],
        },
      },
    },
    required: ['streamId', 'Suppressions'],
    additionalProperties: false,
  }),
  async execute(input: CreateSuppressionsInput): Promise<unknown> {
    return apiRequest<unknown>(
      'POST',
      `/message-streams/${encodeURIComponent(input.streamId)}/suppressions`,
      { Suppressions: input.Suppressions }
    );
  },
});

export interface DeleteSuppressionsInput {
  streamId: string;
  Suppressions: Array<{ EmailAddress: string }>;
}

export const deleteSuppressions = tool({
  description: 'Remove email addresses from the suppression list.',
  inputSchema: jsonSchema<DeleteSuppressionsInput>({
    type: 'object',
    properties: {
      streamId: { type: 'string', description: 'Message stream ID.' },
      Suppressions: {
        type: 'array',
        description: 'Email addresses to unsuppress.',
        items: {
          type: 'object',
          properties: {
            EmailAddress: { type: 'string', description: 'Email address to remove.' },
          },
          required: ['EmailAddress'],
        },
      },
    },
    required: ['streamId', 'Suppressions'],
    additionalProperties: false,
  }),
  async execute(input: DeleteSuppressionsInput): Promise<unknown> {
    return apiRequest<unknown>(
      'POST',
      `/message-streams/${encodeURIComponent(input.streamId)}/suppressions/delete`,
      { Suppressions: input.Suppressions }
    );
  },
});

// ============================================================================
// Inbound Rules
// ============================================================================

export const listInboundRules = tool({
  description: 'List all inbound processing rules.',
  inputSchema: jsonSchema<{ count: number; offset: number }>({
    type: 'object',
    properties: {
      count: { type: 'number', description: 'Number of rules to return.' },
      offset: { type: 'number', description: 'Number of rules to skip.' },
    },
    required: ['count', 'offset'],
    additionalProperties: false,
  }),
  async execute(input: { count: number; offset: number }): Promise<unknown> {
    const params = new URLSearchParams();
    params.set('count', input.count.toString());
    params.set('offset', input.offset.toString());
    return apiRequest<unknown>('GET', `/triggers/inboundrules?${params.toString()}`);
  },
});

export const createInboundRule = tool({
  description: 'Create a new inbound processing rule to block emails matching a pattern.',
  inputSchema: jsonSchema<{ Rule: string }>({
    type: 'object',
    properties: {
      Rule: {
        type: 'string',
        description:
          'Email address or domain pattern to block (e.g., test@example.com or @example.com).',
      },
    },
    required: ['Rule'],
    additionalProperties: false,
  }),
  async execute(input: { Rule: string }): Promise<unknown> {
    return apiRequest<unknown>('POST', '/triggers/inboundrules', input);
  },
});

export const deleteInboundRule = tool({
  description: 'Delete an inbound processing rule.',
  inputSchema: jsonSchema<{ id: number }>({
    type: 'object',
    properties: {
      id: { type: 'number', description: 'Inbound rule ID to delete.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: { id: number }): Promise<unknown> {
    return apiRequest<unknown>('DELETE', `/triggers/inboundrules/${encodeURIComponent(input.id)}`);
  },
});

// ============================================================================
// Data Removals (account token)
// ============================================================================

export interface CreateDataRemovalInput {
  RequestedBy: string;
  RequestedFor: string;
  NotifyWhenCompleted?: boolean;
}

export const createDataRemoval = tool({
  description:
    'Request removal of personal data associated with an email address. Uses account token.',
  inputSchema: jsonSchema<CreateDataRemovalInput>({
    type: 'object',
    properties: {
      RequestedBy: { type: 'string', description: 'Email of the person requesting removal.' },
      RequestedFor: {
        type: 'string',
        description: 'Email address whose data should be removed.',
      },
      NotifyWhenCompleted: { type: 'boolean', description: 'Send notification when complete.' },
    },
    required: ['RequestedBy', 'RequestedFor'],
    additionalProperties: false,
  }),
  async execute(input: CreateDataRemovalInput): Promise<unknown> {
    return accountApiRequest<unknown>('POST', '/data-removals', input);
  },
});

export const getDataRemovalStatus = tool({
  description: 'Get the status of a data removal request. Uses account token.',
  inputSchema: jsonSchema<{ id: number }>({
    type: 'object',
    properties: {
      id: { type: 'number', description: 'Data removal request ID.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: { id: number }): Promise<unknown> {
    return accountApiRequest<unknown>('GET', `/data-removals/${encodeURIComponent(input.id)}`);
  },
});

// ============================================================================
// Default Export
// ============================================================================

export default {
  // Email Sending
  sendEmail,
  sendBatchEmails,
  sendEmailWithTemplate,
  sendBatchWithTemplates,
  // Bulk Email
  sendBulkEmail,
  getBulkEmailStatus,
  // Bounces
  getDeliveryStats,
  searchBounces,
  getBounce,
  getBounceDump,
  activateBounce,
  // Templates
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  validateTemplate,
  pushTemplates,
  // Server Config
  getServer,
  updateServer,
  // Servers Management
  listServers,
  getServerById,
  createServer,
  updateServerById,
  deleteServer,
  // Message Streams
  listMessageStreams,
  getMessageStream,
  createMessageStream,
  updateMessageStream,
  archiveMessageStream,
  unarchiveMessageStream,
  // Messages — Outbound
  searchOutboundMessages,
  getOutboundMessageDetails,
  getOutboundMessageDump,
  getOutboundMessageOpens,
  getOutboundMessageClicks,
  // Messages — Inbound
  searchInboundMessages,
  getInboundMessageDetails,
  bypassInboundRules,
  retryInboundMessage,
  // Messages — Search Opens/Clicks
  searchMessageOpens,
  searchMessageClicks,
  // Stats
  getStatsOverview,
  getStatsSends,
  getStatsBounces,
  getStatsSpamComplaints,
  getStatsTracked,
  getStatsOpens,
  getStatsOpensByPlatform,
  getStatsOpensByClient,
  getStatsClicks,
  getStatsClicksByBrowser,
  getStatsClicksByPlatform,
  getStatsClicksByLocation,
  // Domains
  listDomains,
  getDomain,
  createDomain,
  updateDomain,
  deleteDomain,
  verifyDomainDkim,
  verifyDomainReturnPath,
  verifyDomainSpf,
  rotateDomainDkim,
  // Sender Signatures
  listSenderSignatures,
  getSenderSignature,
  createSenderSignature,
  updateSenderSignature,
  deleteSenderSignature,
  resendSenderConfirmation,
  // Webhooks
  listWebhooks,
  getWebhook,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  // Suppressions
  listSuppressions,
  createSuppressions,
  deleteSuppressions,
  // Inbound Rules
  listInboundRules,
  createInboundRule,
  deleteInboundRule,
  // Data Removals
  createDataRemoval,
  getDataRemovalStatus,
};
