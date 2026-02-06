/**
 * @tpmjs/tools-resend — Resend Email API Tools for AI Agents
 *
 * Full access to the Resend email API: send emails, manage domains, contacts,
 * broadcasts, audiences, and API keys.
 *
 * @requires RESEND_API_KEY environment variable
 */

import { jsonSchema, tool } from 'ai';

const BASE_URL = 'https://api.resend.com';

// ─── Client Infrastructure ──────────────────────────────────────────────────

function getApiKey(): string {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error(
      'RESEND_API_KEY environment variable is required. Get your API key from https://resend.com/api-keys'
    );
  }
  return key;
}

async function apiRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  const key = getApiKey();

  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };

  const options: RequestInit = { method, headers };
  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);

  if (!response.ok) {
    await handleApiError(response);
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}

async function handleApiError(response: Response): Promise<never> {
  let errorMessage: string;
  try {
    const errorData = (await response.json()) as { message?: string; error?: string };
    errorMessage = errorData.message || errorData.error || `HTTP ${response.status}`;
  } catch {
    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
  }

  switch (response.status) {
    case 400:
      throw new Error(`Bad request: ${errorMessage}`);
    case 401:
      throw new Error('Authentication failed: Invalid Resend API key. Check RESEND_API_KEY.');
    case 403:
      throw new Error(`Access forbidden: ${errorMessage}`);
    case 404:
      throw new Error(`Not found: ${errorMessage}`);
    case 422:
      throw new Error(`Validation error: ${errorMessage}`);
    case 429:
      throw new Error(`Rate limit exceeded: ${errorMessage}`);
    default:
      throw new Error(`Resend API error (${response.status}): ${errorMessage}`);
  }
}

function buildQueryString(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  );
  if (entries.length === 0) return '';
  return (
    '?' +
    entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&')
  );
}

// ─── Emails ─────────────────────────────────────────────────────────────────

export interface SendEmailInput {
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  reply_to?: string | string[];
  headers?: Record<string, string>;
  attachments?: Array<{ content?: string; filename: string; path?: string; content_type?: string }>;
  tags?: Array<{ name: string; value: string }>;
  scheduled_at?: string;
  topic_id?: string;
}

export interface PaginationInput {
  limit?: number;
  after?: string;
  before?: string;
}

export const sendEmail = tool({
  description:
    'Send a single email via the Resend API. Requires from, to, and subject. Provide html and/or text body content.',
  inputSchema: jsonSchema<SendEmailInput>({
    type: 'object',
    properties: {
      from: {
        type: 'string',
        description: 'Sender email address. Supports "Name <email>" format.',
      },
      to: {
        oneOf: [
          { type: 'string', description: 'Single recipient email address.' },
          {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of recipient emails (max 50).',
          },
        ],
        description: 'Recipient email address(es).',
      },
      subject: { type: 'string', description: 'Email subject line.' },
      html: { type: 'string', description: 'HTML body content.' },
      text: { type: 'string', description: 'Plain text body content.' },
      cc: {
        oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
        description: 'CC recipient(s).',
      },
      bcc: {
        oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
        description: 'BCC recipient(s).',
      },
      reply_to: {
        oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
        description: 'Reply-to address(es).',
      },
      headers: {
        type: 'object',
        additionalProperties: { type: 'string' },
        description: 'Custom email headers as key-value pairs.',
      },
      attachments: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'Base64-encoded content.' },
            filename: { type: 'string', description: 'Attachment filename.' },
            path: { type: 'string', description: 'URL to fetch attachment from.' },
            content_type: { type: 'string', description: 'MIME type.' },
          },
          required: ['filename'],
        },
        description: 'File attachments (max 40MB total).',
      },
      tags: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Tag name.' },
            value: { type: 'string', description: 'Tag value.' },
          },
          required: ['name', 'value'],
        },
        description: 'Tags for categorizing emails.',
      },
      scheduled_at: {
        type: 'string',
        description: 'ISO 8601 datetime or natural language (e.g. "in 1 min").',
      },
      topic_id: { type: 'string', description: 'Topic ID for subscription management.' },
    },
    required: ['from', 'to', 'subject'],
    additionalProperties: false,
  }),
  async execute(input: SendEmailInput) {
    return apiRequest<{ id: string }>('POST', '/emails', input);
  },
});

export interface SendBatchInput {
  emails: SendEmailInput[];
}

export const sendBatchEmails = tool({
  description:
    'Send a batch of emails in a single API call via Resend. Each email has the same parameters as sendEmail.',
  inputSchema: jsonSchema<SendBatchInput>({
    type: 'object',
    properties: {
      emails: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            from: { type: 'string', description: 'Sender email address.' },
            to: {
              oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
              description: 'Recipient email address(es).',
            },
            subject: { type: 'string', description: 'Email subject line.' },
            html: { type: 'string', description: 'HTML body content.' },
            text: { type: 'string', description: 'Plain text body content.' },
          },
          required: ['from', 'to', 'subject'],
        },
        description: 'Array of email objects to send.',
      },
    },
    required: ['emails'],
    additionalProperties: false,
  }),
  async execute(input: SendBatchInput) {
    return apiRequest<{ data: Array<{ id: string }> }>('POST', '/emails/batch', input.emails);
  },
});

export interface IdInput {
  id: string;
}

export const getEmail = tool({
  description:
    'Retrieve details of a specific sent email by its ID, including status, recipients, and content.',
  inputSchema: jsonSchema<IdInput>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'The email ID to retrieve.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: IdInput) {
    return apiRequest<Record<string, unknown>>('GET', `/emails/${input.id}`);
  },
});

export interface UpdateEmailInput {
  id: string;
  scheduled_at: string;
}

export const updateEmail = tool({
  description:
    'Update a scheduled email by changing its scheduled delivery time. Only works on emails not yet sent.',
  inputSchema: jsonSchema<UpdateEmailInput>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'The email ID to update.' },
      scheduled_at: { type: 'string', description: 'New scheduled time in ISO 8601 format.' },
    },
    required: ['id', 'scheduled_at'],
    additionalProperties: false,
  }),
  async execute(input: UpdateEmailInput) {
    const { id, ...body } = input;
    return apiRequest<{ object: string; id: string }>('PATCH', `/emails/${id}`, body);
  },
});

export const cancelEmail = tool({
  description:
    'Cancel a scheduled email that has not been sent yet. Returns the cancelled email ID.',
  inputSchema: jsonSchema<IdInput>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'The email ID to cancel.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: IdInput) {
    return apiRequest<{ object: string; id: string }>('POST', `/emails/${input.id}/cancel`);
  },
});

export const listEmails = tool({
  description:
    'List sent emails with optional cursor-based pagination. Returns email summaries with status.',
  inputSchema: jsonSchema<PaginationInput>({
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Max results to return (1-100, default 20).' },
      after: { type: 'string', description: 'Cursor ID for forward pagination.' },
      before: { type: 'string', description: 'Cursor ID for backward pagination.' },
    },
    additionalProperties: false,
  }),
  async execute(input: PaginationInput) {
    const qs = buildQueryString({ ...input });
    return apiRequest<{ object: string; has_more: boolean; data: unknown[] }>(
      'GET',
      `/emails${qs}`
    );
  },
});

// ─── Domains ────────────────────────────────────────────────────────────────

export interface CreateDomainInput {
  name: string;
  region?: string;
  custom_return_path?: string;
  open_tracking?: boolean;
  click_tracking?: boolean;
  tls?: string;
}

export const createDomain = tool({
  description:
    'Add a new sending domain to your Resend account. Returns the domain ID and DNS records to configure.',
  inputSchema: jsonSchema<CreateDomainInput>({
    type: 'object',
    properties: {
      name: { type: 'string', description: 'The domain name to add (e.g. "example.com").' },
      region: {
        type: 'string',
        description: 'Region: us-east-1, eu-west-1, sa-east-1, or ap-northeast-1.',
      },
      custom_return_path: {
        type: 'string',
        description: 'Subdomain for Return-Path (default: "send").',
      },
      open_tracking: { type: 'boolean', description: 'Enable open rate tracking.' },
      click_tracking: { type: 'boolean', description: 'Enable click tracking in HTML emails.' },
      tls: { type: 'string', description: 'TLS mode: "opportunistic" or "enforced".' },
    },
    required: ['name'],
    additionalProperties: false,
  }),
  async execute(input: CreateDomainInput) {
    return apiRequest<Record<string, unknown>>('POST', '/domains', input);
  },
});

export interface DomainIdInput {
  domain_id: string;
}

export const getDomain = tool({
  description:
    'Retrieve details and DNS records for a specific domain including verification status.',
  inputSchema: jsonSchema<DomainIdInput>({
    type: 'object',
    properties: {
      domain_id: { type: 'string', description: 'The domain ID to retrieve.' },
    },
    required: ['domain_id'],
    additionalProperties: false,
  }),
  async execute(input: DomainIdInput) {
    return apiRequest<Record<string, unknown>>('GET', `/domains/${input.domain_id}`);
  },
});

export interface UpdateDomainInput {
  domain_id: string;
  click_tracking?: boolean;
  open_tracking?: boolean;
  tls?: string;
}

export const updateDomain = tool({
  description: 'Update tracking, TLS, and capability settings for an existing domain.',
  inputSchema: jsonSchema<UpdateDomainInput>({
    type: 'object',
    properties: {
      domain_id: { type: 'string', description: 'The domain ID to update.' },
      click_tracking: { type: 'boolean', description: 'Enable or disable click tracking.' },
      open_tracking: { type: 'boolean', description: 'Enable or disable open tracking.' },
      tls: { type: 'string', description: 'TLS mode: "opportunistic" or "enforced".' },
    },
    required: ['domain_id'],
    additionalProperties: false,
  }),
  async execute(input: UpdateDomainInput) {
    const { domain_id, ...body } = input;
    return apiRequest<{ object: string; id: string }>('PATCH', `/domains/${domain_id}`, body);
  },
});

export const deleteDomain = tool({
  description: 'Delete a sending domain from your Resend account permanently.',
  inputSchema: jsonSchema<DomainIdInput>({
    type: 'object',
    properties: {
      domain_id: { type: 'string', description: 'The domain ID to delete.' },
    },
    required: ['domain_id'],
    additionalProperties: false,
  }),
  async execute(input: DomainIdInput) {
    return apiRequest<{ object: string; id: string; deleted: boolean }>(
      'DELETE',
      `/domains/${input.domain_id}`
    );
  },
});

export const listDomains = tool({
  description: 'List all sending domains in your Resend account with their verification status.',
  inputSchema: jsonSchema<PaginationInput>({
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Max results to return (1-100, default 20).' },
      after: { type: 'string', description: 'Cursor ID for forward pagination.' },
      before: { type: 'string', description: 'Cursor ID for backward pagination.' },
    },
    additionalProperties: false,
  }),
  async execute(input: PaginationInput) {
    const qs = buildQueryString({ ...input });
    return apiRequest<{ object: string; has_more: boolean; data: unknown[] }>(
      'GET',
      `/domains${qs}`
    );
  },
});

export const verifyDomain = tool({
  description:
    'Trigger DNS verification for a sending domain. Check domain status after DNS records are configured.',
  inputSchema: jsonSchema<DomainIdInput>({
    type: 'object',
    properties: {
      domain_id: { type: 'string', description: 'The domain ID to verify.' },
    },
    required: ['domain_id'],
    additionalProperties: false,
  }),
  async execute(input: DomainIdInput) {
    return apiRequest<{ object: string; id: string }>('POST', `/domains/${input.domain_id}/verify`);
  },
});

// ─── API Keys ───────────────────────────────────────────────────────────────

export interface CreateApiKeyInput {
  name: string;
  permission?: string;
  domain_id?: string;
}

export const createApiKey = tool({
  description: 'Create a new Resend API key with specified name and permission level.',
  inputSchema: jsonSchema<CreateApiKeyInput>({
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Name for the API key (max 50 characters).' },
      permission: { type: 'string', description: 'Permission: "full_access" or "sending_access".' },
      domain_id: { type: 'string', description: 'Restrict to a domain (only for sending_access).' },
    },
    required: ['name'],
    additionalProperties: false,
  }),
  async execute(input: CreateApiKeyInput) {
    return apiRequest<{ id: string; token: string }>('POST', '/api-keys', input);
  },
});

export const listApiKeys = tool({
  description: 'List all API keys in your Resend account with their names and creation dates.',
  inputSchema: jsonSchema<PaginationInput>({
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Max results to return (1-100).' },
      after: { type: 'string', description: 'Cursor ID for forward pagination.' },
      before: { type: 'string', description: 'Cursor ID for backward pagination.' },
    },
    additionalProperties: false,
  }),
  async execute(input: PaginationInput) {
    const qs = buildQueryString({ ...input });
    return apiRequest<{ object: string; has_more: boolean; data: unknown[] }>(
      'GET',
      `/api-keys${qs}`
    );
  },
});

export interface ApiKeyIdInput {
  api_key_id: string;
}

export const deleteApiKey = tool({
  description: 'Delete an API key from your Resend account permanently.',
  inputSchema: jsonSchema<ApiKeyIdInput>({
    type: 'object',
    properties: {
      api_key_id: { type: 'string', description: 'The API key ID to delete.' },
    },
    required: ['api_key_id'],
    additionalProperties: false,
  }),
  async execute(input: ApiKeyIdInput) {
    return apiRequest<Record<string, unknown>>('DELETE', `/api-keys/${input.api_key_id}`);
  },
});

// ─── Contacts ───────────────────────────────────────────────────────────────

export interface CreateContactInput {
  email: string;
  first_name?: string;
  last_name?: string;
  unsubscribed?: boolean;
  properties?: Record<string, string>;
}

export const createContact = tool({
  description:
    'Create a new contact with an email address and optional name, properties, and subscription settings.',
  inputSchema: jsonSchema<CreateContactInput>({
    type: 'object',
    properties: {
      email: { type: 'string', description: 'Contact email address.' },
      first_name: { type: 'string', description: 'Contact first name.' },
      last_name: { type: 'string', description: 'Contact last name.' },
      unsubscribed: {
        type: 'boolean',
        description: 'If true, contact is unsubscribed from all broadcasts.',
      },
      properties: {
        type: 'object',
        additionalProperties: { type: 'string' },
        description: 'Custom key-value properties for the contact.',
      },
    },
    required: ['email'],
    additionalProperties: false,
  }),
  async execute(input: CreateContactInput) {
    return apiRequest<{ object: string; id: string }>('POST', '/contacts', input);
  },
});

export const getContact = tool({
  description:
    'Retrieve a contact by their ID or email address, including name, properties, and subscription status.',
  inputSchema: jsonSchema<IdInput>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Contact ID or email address.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: IdInput) {
    return apiRequest<Record<string, unknown>>('GET', `/contacts/${encodeURIComponent(input.id)}`);
  },
});

export interface UpdateContactInput {
  id: string;
  first_name?: string;
  last_name?: string;
  unsubscribed?: boolean;
  properties?: Record<string, string>;
}

export const updateContact = tool({
  description: "Update a contact's name, subscription status, or custom properties.",
  inputSchema: jsonSchema<UpdateContactInput>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Contact ID or email address.' },
      first_name: { type: 'string', description: 'Updated first name.' },
      last_name: { type: 'string', description: 'Updated last name.' },
      unsubscribed: { type: 'boolean', description: 'Updated subscription status.' },
      properties: {
        type: 'object',
        additionalProperties: { type: 'string' },
        description: 'Updated custom properties.',
      },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: UpdateContactInput) {
    const { id, ...body } = input;
    return apiRequest<{ object: string; id: string }>(
      'PATCH',
      `/contacts/${encodeURIComponent(id)}`,
      body
    );
  },
});

export const deleteContact = tool({
  description: 'Delete a contact by their ID or email address permanently.',
  inputSchema: jsonSchema<IdInput>({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Contact ID or email address to delete.' },
    },
    required: ['id'],
    additionalProperties: false,
  }),
  async execute(input: IdInput) {
    return apiRequest<{ object: string; contact: string; deleted: boolean }>(
      'DELETE',
      `/contacts/${encodeURIComponent(input.id)}`
    );
  },
});

export interface ListContactsInput extends PaginationInput {
  segment_id?: string;
}

export const listContacts = tool({
  description: 'List contacts with optional segment filtering and cursor-based pagination.',
  inputSchema: jsonSchema<ListContactsInput>({
    type: 'object',
    properties: {
      segment_id: { type: 'string', description: 'Filter contacts by segment ID.' },
      limit: { type: 'number', description: 'Max results to return (1-100, default 20).' },
      after: { type: 'string', description: 'Cursor ID for forward pagination.' },
      before: { type: 'string', description: 'Cursor ID for backward pagination.' },
    },
    additionalProperties: false,
  }),
  async execute(input: ListContactsInput) {
    const qs = buildQueryString({ ...input });
    return apiRequest<{ object: string; has_more: boolean; data: unknown[] }>(
      'GET',
      `/contacts${qs}`
    );
  },
});

// ─── Broadcasts ─────────────────────────────────────────────────────────────

export interface CreateBroadcastInput {
  segment_id: string;
  from: string;
  subject: string;
  reply_to?: string | string[];
  html?: string;
  text?: string;
  name?: string;
  topic_id?: string;
}

export const createBroadcast = tool({
  description:
    'Create a new broadcast email draft to send to a segment. Use sendBroadcast to dispatch it.',
  inputSchema: jsonSchema<CreateBroadcastInput>({
    type: 'object',
    properties: {
      segment_id: { type: 'string', description: 'Segment ID to send the broadcast to.' },
      from: { type: 'string', description: 'Sender address. Supports "Name <email>" format.' },
      subject: { type: 'string', description: 'Broadcast email subject line.' },
      reply_to: {
        oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
        description: 'Reply-to address(es).',
      },
      html: { type: 'string', description: 'HTML content. Supports Contact Property templating.' },
      text: { type: 'string', description: 'Plain text content.' },
      name: { type: 'string', description: 'Friendly name for internal reference.' },
      topic_id: { type: 'string', description: 'Topic ID for subscription management.' },
    },
    required: ['segment_id', 'from', 'subject'],
    additionalProperties: false,
  }),
  async execute(input: CreateBroadcastInput) {
    return apiRequest<{ id: string }>('POST', '/broadcasts', input);
  },
});

export const listBroadcasts = tool({
  description: 'List all broadcasts with their status, audience, and scheduling details.',
  inputSchema: jsonSchema<PaginationInput>({
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Max results to return (1-100, default 20).' },
      after: { type: 'string', description: 'Cursor ID for forward pagination.' },
      before: { type: 'string', description: 'Cursor ID for backward pagination.' },
    },
    additionalProperties: false,
  }),
  async execute(input: PaginationInput) {
    const qs = buildQueryString({ ...input });
    return apiRequest<{ object: string; has_more: boolean; data: unknown[] }>(
      'GET',
      `/broadcasts${qs}`
    );
  },
});

export interface SendBroadcastInput {
  broadcast_id: string;
  scheduled_at?: string;
}

export const sendBroadcast = tool({
  description:
    'Send or schedule a previously created broadcast. Optionally provide a scheduled_at time.',
  inputSchema: jsonSchema<SendBroadcastInput>({
    type: 'object',
    properties: {
      broadcast_id: { type: 'string', description: 'The broadcast ID to send.' },
      scheduled_at: {
        type: 'string',
        description: 'ISO 8601 datetime or natural language to schedule.',
      },
    },
    required: ['broadcast_id'],
    additionalProperties: false,
  }),
  async execute(input: SendBroadcastInput) {
    const { broadcast_id, ...body } = input;
    const hasBody = Object.keys(body).length > 0;
    return apiRequest<{ id: string }>(
      'POST',
      `/broadcasts/${broadcast_id}/send`,
      hasBody ? body : undefined
    );
  },
});

export interface BroadcastIdInput {
  broadcast_id: string;
}

export const deleteBroadcast = tool({
  description:
    'Delete a draft broadcast that has not been sent. Scheduled broadcasts are automatically cancelled.',
  inputSchema: jsonSchema<BroadcastIdInput>({
    type: 'object',
    properties: {
      broadcast_id: { type: 'string', description: 'The broadcast ID to delete.' },
    },
    required: ['broadcast_id'],
    additionalProperties: false,
  }),
  async execute(input: BroadcastIdInput) {
    return apiRequest<{ object: string; id: string; deleted: boolean }>(
      'DELETE',
      `/broadcasts/${input.broadcast_id}`
    );
  },
});

// ─── Audiences ──────────────────────────────────────────────────────────────

export interface NameInput {
  name: string;
}

export const createAudience = tool({
  description: 'Create a new audience for organizing contacts into groups.',
  inputSchema: jsonSchema<NameInput>({
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Name for the audience.' },
    },
    required: ['name'],
    additionalProperties: false,
  }),
  async execute(input: NameInput) {
    return apiRequest<{ object: string; id: string; name: string }>('POST', '/audiences', input);
  },
});

export const listAudiences = tool({
  description: 'List all audiences in your Resend account with their names and creation dates.',
  inputSchema: jsonSchema<PaginationInput>({
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Max results to return (1-100, default 20).' },
      after: { type: 'string', description: 'Cursor ID for forward pagination.' },
      before: { type: 'string', description: 'Cursor ID for backward pagination.' },
    },
    additionalProperties: false,
  }),
  async execute(input: PaginationInput) {
    const qs = buildQueryString({ ...input });
    return apiRequest<{ object: string; has_more: boolean; data: unknown[] }>(
      'GET',
      `/audiences${qs}`
    );
  },
});

export interface AudienceIdInput {
  audience_id: string;
}

export const getAudience = tool({
  description: 'Retrieve details of a specific audience by its ID.',
  inputSchema: jsonSchema<AudienceIdInput>({
    type: 'object',
    properties: {
      audience_id: { type: 'string', description: 'The audience ID to retrieve.' },
    },
    required: ['audience_id'],
    additionalProperties: false,
  }),
  async execute(input: AudienceIdInput) {
    return apiRequest<Record<string, unknown>>('GET', `/audiences/${input.audience_id}`);
  },
});

export const deleteAudience = tool({
  description: 'Delete an audience from your Resend account permanently.',
  inputSchema: jsonSchema<AudienceIdInput>({
    type: 'object',
    properties: {
      audience_id: { type: 'string', description: 'The audience ID to delete.' },
    },
    required: ['audience_id'],
    additionalProperties: false,
  }),
  async execute(input: AudienceIdInput) {
    return apiRequest<{ object: string; id: string; deleted: boolean }>(
      'DELETE',
      `/audiences/${input.audience_id}`
    );
  },
});

// ─── Default Export ─────────────────────────────────────────────────────────

export default {
  // Emails
  sendEmail,
  sendBatchEmails,
  getEmail,
  updateEmail,
  cancelEmail,
  listEmails,
  // Domains
  createDomain,
  getDomain,
  updateDomain,
  deleteDomain,
  listDomains,
  verifyDomain,
  // API Keys
  createApiKey,
  listApiKeys,
  deleteApiKey,
  // Contacts
  createContact,
  getContact,
  updateContact,
  deleteContact,
  listContacts,
  // Broadcasts
  createBroadcast,
  listBroadcasts,
  sendBroadcast,
  deleteBroadcast,
  // Audiences
  createAudience,
  listAudiences,
  getAudience,
  deleteAudience,
};
