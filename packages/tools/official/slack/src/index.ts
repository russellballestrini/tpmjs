/**
 * @tpmjs/tools-slack — Slack API Tools for AI Agents
 *
 * Full access to the Slack Web API: send messages, manage channels, users,
 * reactions, file uploads, and search.
 *
 * @requires SLACK_BOT_TOKEN environment variable
 */

import { jsonSchema, tool } from 'ai';

const BASE_URL = 'https://slack.com/api';

// ─── Client Infrastructure ──────────────────────────────────────────────────

function getApiKey(): string {
  const key = process.env.SLACK_BOT_TOKEN;
  if (!key) {
    throw new Error(
      'SLACK_BOT_TOKEN environment variable is required. Get your token from https://api.slack.com/apps'
    );
  }
  return key;
}

async function apiRequest<T>(method: string, body?: unknown): Promise<T> {
  const token = getApiKey();

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const options: RequestInit = {
    method: 'POST',
    headers,
  };

  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}/${method}`, options);

  if (!response.ok) {
    throw new Error(`Slack HTTP error ${response.status}: ${response.statusText}`);
  }

  const data = (await response.json()) as { ok: boolean; error?: string } & T;

  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error || 'Unknown error'}`);
  }

  return data;
}

async function apiGetRequest<T>(method: string, params: Record<string, unknown>): Promise<T> {
  const token = getApiKey();

  const qs = buildQueryString(params);
  const url = `${BASE_URL}/${method}${qs}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch(url, { method: 'GET', headers });

  if (!response.ok) {
    throw new Error(`Slack HTTP error ${response.status}: ${response.statusText}`);
  }

  const data = (await response.json()) as { ok: boolean; error?: string } & T;

  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error || 'Unknown error'}`);
  }

  return data;
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

// ─── Output Types ────────────────────────────────────────────────────────────

export interface SlackMessage {
  ts: string;
  channel: string;
  text: string;
  user?: string;
  type: string;
}

export interface SlackChannel {
  id: string;
  name: string;
  is_channel: boolean;
  is_private: boolean;
  topic: { value: string };
  purpose: { value: string };
  num_members: number;
}

export interface SlackUser {
  id: string;
  name: string;
  real_name: string;
  is_bot: boolean;
  deleted: boolean;
  profile: { email?: string; display_name?: string; status_text?: string };
}

export interface SlackFile {
  id: string;
  name: string;
  title: string;
  filetype: string;
  size: number;
  url_private: string;
}

export interface SendMessageResult {
  ok: boolean;
  channel: string;
  ts: string;
  message: SlackMessage;
}

export interface ListMessagesResult {
  ok: boolean;
  messages: SlackMessage[];
  has_more: boolean;
  response_metadata?: { next_cursor: string };
}

export interface SearchMessagesResult {
  ok: boolean;
  messages: {
    total: number;
    matches: SlackMessage[];
  };
}

export interface ListChannelsResult {
  ok: boolean;
  channels: SlackChannel[];
  response_metadata?: { next_cursor: string };
}

export interface GetChannelResult {
  ok: boolean;
  channel: SlackChannel;
}

export interface ListUsersResult {
  ok: boolean;
  members: SlackUser[];
  response_metadata?: { next_cursor: string };
}

export interface GetUserResult {
  ok: boolean;
  user: SlackUser;
}

export interface AddReactionResult {
  ok: boolean;
}

export interface UploadFileResult {
  ok: boolean;
  file: SlackFile;
}

export interface SetChannelTopicResult {
  ok: boolean;
  topic: string;
}

// ─── Messages ───────────────────────────────────────────────────────────────

export interface SendMessageInput {
  channel: string;
  text: string;
  thread_ts?: string;
  unfurl_links?: boolean;
}

export const sendMessage = tool({
  description: 'Send a message to a Slack channel or thread. Supports Slack markdown formatting.',
  inputSchema: jsonSchema<SendMessageInput>({
    type: 'object',
    properties: {
      channel: {
        type: 'string',
        description: 'Channel ID or name (e.g., "C1234567890" or "#general").',
      },
      text: { type: 'string', description: 'Message text (supports Slack markdown).' },
      thread_ts: { type: 'string', description: 'Optional thread timestamp to reply in a thread.' },
      unfurl_links: {
        type: 'boolean',
        description: 'Enable or disable link unfurling (default: true).',
      },
    },
    required: ['channel', 'text'],
    additionalProperties: false,
  }),
  async execute(input: SendMessageInput): Promise<SendMessageResult> {
    try {
      if (!input.channel || !input.text) {
        throw new Error('Channel and text are required and must be non-empty');
      }
      return await apiRequest<SendMessageResult>('chat.postMessage', {
        channel: input.channel,
        text: input.text,
        thread_ts: input.thread_ts,
        unfurl_links: input.unfurl_links,
      });
    } catch (error) {
      throw new Error(`Failed to send message: ${(error as Error).message}`);
    }
  },
});

export interface ListMessagesInput {
  channel: string;
  limit?: number;
  cursor?: string;
  oldest?: string;
  latest?: string;
}

export const listMessages = tool({
  description: 'Get recent messages from a channel with optional pagination and time filtering.',
  inputSchema: jsonSchema<ListMessagesInput>({
    type: 'object',
    properties: {
      channel: { type: 'string', description: 'Channel ID.' },
      limit: {
        type: 'number',
        description: 'Number of messages to return (1-1000, default: 100).',
      },
      cursor: { type: 'string', description: 'Pagination cursor from previous response.' },
      oldest: {
        type: 'string',
        description: 'Only messages after this Unix timestamp (e.g., "1234567890.123456").',
      },
      latest: {
        type: 'string',
        description: 'Only messages before this Unix timestamp (e.g., "1234567890.123456").',
      },
    },
    required: ['channel'],
    additionalProperties: false,
  }),
  async execute(input: ListMessagesInput): Promise<ListMessagesResult> {
    try {
      if (!input.channel) {
        throw new Error('Channel is required');
      }
      if (input.limit !== undefined && (input.limit < 1 || input.limit > 1000)) {
        throw new Error('Limit must be between 1 and 1000');
      }
      return await apiGetRequest<ListMessagesResult>('conversations.history', {
        channel: input.channel,
        limit: input.limit,
        cursor: input.cursor,
        oldest: input.oldest,
        latest: input.latest,
      });
    } catch (error) {
      throw new Error(`Failed to list messages: ${(error as Error).message}`);
    }
  },
});

export interface SearchMessagesInput {
  query: string;
  sort?: string;
  count?: number;
}

export const searchMessages = tool({
  description: 'Search for messages across all channels in the workspace using keyword queries.',
  inputSchema: jsonSchema<SearchMessagesInput>({
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query (supports operators like from:, in:, has:).',
      },
      sort: {
        type: 'string',
        description: 'Sort by: score (relevance) or timestamp (default: score).',
      },
      count: { type: 'number', description: 'Number of results to return (1-100, default: 20).' },
    },
    required: ['query'],
    additionalProperties: false,
  }),
  async execute(input: SearchMessagesInput): Promise<SearchMessagesResult> {
    try {
      if (!input.query) {
        throw new Error('Query is required and must be non-empty');
      }
      if (input.count !== undefined && (input.count < 1 || input.count > 100)) {
        throw new Error('Count must be between 1 and 100');
      }
      if (input.sort !== undefined && input.sort !== 'score' && input.sort !== 'timestamp') {
        throw new Error('Sort must be "score" or "timestamp"');
      }
      return await apiGetRequest<SearchMessagesResult>('search.messages', {
        query: input.query,
        sort: input.sort,
        count: input.count,
      });
    } catch (error) {
      throw new Error(`Failed to search messages: ${(error as Error).message}`);
    }
  },
});

// ─── Channels ───────────────────────────────────────────────────────────────

export interface ListChannelsInput {
  types?: string;
  limit?: number;
  cursor?: string;
}

export const listChannels = tool({
  description: 'List channels in the workspace. Defaults to public channels if no types specified.',
  inputSchema: jsonSchema<ListChannelsInput>({
    type: 'object',
    properties: {
      types: {
        type: 'string',
        description:
          'Comma-separated channel types: public_channel, private_channel, mpim, im (default: public_channel).',
      },
      limit: {
        type: 'number',
        description: 'Number of channels to return (1-1000, default: 100).',
      },
      cursor: { type: 'string', description: 'Pagination cursor from previous response.' },
    },
    additionalProperties: false,
  }),
  async execute(input: ListChannelsInput): Promise<ListChannelsResult> {
    try {
      if (input.limit !== undefined && (input.limit < 1 || input.limit > 1000)) {
        throw new Error('Limit must be between 1 and 1000');
      }
      return await apiGetRequest<ListChannelsResult>('conversations.list', {
        types: input.types || 'public_channel',
        limit: input.limit,
        cursor: input.cursor,
      });
    } catch (error) {
      throw new Error(`Failed to list channels: ${(error as Error).message}`);
    }
  },
});

export interface GetChannelInput {
  channel: string;
}

export const getChannel = tool({
  description:
    'Get detailed information about a channel including name, topic, purpose, and member count.',
  inputSchema: jsonSchema<GetChannelInput>({
    type: 'object',
    properties: {
      channel: { type: 'string', description: 'Channel ID (e.g., "C1234567890").' },
    },
    required: ['channel'],
    additionalProperties: false,
  }),
  async execute(input: GetChannelInput): Promise<GetChannelResult> {
    try {
      if (!input.channel) {
        throw new Error('Channel is required and must be non-empty');
      }
      return await apiGetRequest<GetChannelResult>('conversations.info', {
        channel: input.channel,
      });
    } catch (error) {
      throw new Error(`Failed to get channel: ${(error as Error).message}`);
    }
  },
});

export interface SetChannelTopicInput {
  channel: string;
  topic: string;
}

export const setChannelTopic = tool({
  description: 'Set the topic for a channel. Requires appropriate permissions in the channel.',
  inputSchema: jsonSchema<SetChannelTopicInput>({
    type: 'object',
    properties: {
      channel: { type: 'string', description: 'Channel ID.' },
      topic: { type: 'string', description: 'New topic text (max 250 characters).' },
    },
    required: ['channel', 'topic'],
    additionalProperties: false,
  }),
  async execute(input: SetChannelTopicInput): Promise<SetChannelTopicResult> {
    try {
      if (!input.channel || !input.topic) {
        throw new Error('Channel and topic are required');
      }
      if (input.topic.length > 250) {
        throw new Error('Topic must be 250 characters or less');
      }
      return await apiRequest<SetChannelTopicResult>('conversations.setTopic', {
        channel: input.channel,
        topic: input.topic,
      });
    } catch (error) {
      throw new Error(`Failed to set channel topic: ${(error as Error).message}`);
    }
  },
});

// ─── Users ──────────────────────────────────────────────────────────────────

export interface ListUsersInput {
  limit?: number;
  cursor?: string;
}

export const listUsers = tool({
  description: 'List all users in the workspace including bots and deactivated users.',
  inputSchema: jsonSchema<ListUsersInput>({
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Number of users to return (1-1000, default: 100).' },
      cursor: { type: 'string', description: 'Pagination cursor from previous response.' },
    },
    additionalProperties: false,
  }),
  async execute(input: ListUsersInput): Promise<ListUsersResult> {
    try {
      if (input.limit !== undefined && (input.limit < 1 || input.limit > 1000)) {
        throw new Error('Limit must be between 1 and 1000');
      }
      return await apiGetRequest<ListUsersResult>('users.list', {
        limit: input.limit,
        cursor: input.cursor,
      });
    } catch (error) {
      throw new Error(`Failed to list users: ${(error as Error).message}`);
    }
  },
});

export interface GetUserInput {
  user: string;
}

export const getUser = tool({
  description:
    'Get detailed profile information for a specific user including name, email, and status.',
  inputSchema: jsonSchema<GetUserInput>({
    type: 'object',
    properties: {
      user: { type: 'string', description: 'User ID (e.g., "U1234567890").' },
    },
    required: ['user'],
    additionalProperties: false,
  }),
  async execute(input: GetUserInput): Promise<GetUserResult> {
    try {
      if (!input.user) {
        throw new Error('User ID is required and must be non-empty');
      }
      return await apiGetRequest<GetUserResult>('users.info', {
        user: input.user,
      });
    } catch (error) {
      throw new Error(`Failed to get user: ${(error as Error).message}`);
    }
  },
});

// ─── Reactions ──────────────────────────────────────────────────────────────

export interface AddReactionInput {
  channel: string;
  timestamp: string;
  name: string;
}

export const addReaction = tool({
  description: 'Add an emoji reaction to a message. The emoji name should be without colons.',
  inputSchema: jsonSchema<AddReactionInput>({
    type: 'object',
    properties: {
      channel: { type: 'string', description: 'Channel ID where the message is.' },
      timestamp: { type: 'string', description: 'Message timestamp (ts field from message).' },
      name: {
        type: 'string',
        description: 'Emoji name without colons (e.g., "thumbsup", "fire", "rocket").',
      },
    },
    required: ['channel', 'timestamp', 'name'],
    additionalProperties: false,
  }),
  async execute(input: AddReactionInput): Promise<AddReactionResult> {
    try {
      if (!input.channel || !input.timestamp || !input.name) {
        throw new Error('Channel, timestamp, and name are required');
      }
      return await apiRequest<AddReactionResult>('reactions.add', {
        channel: input.channel,
        timestamp: input.timestamp,
        name: input.name,
      });
    } catch (error) {
      throw new Error(`Failed to add reaction: ${(error as Error).message}`);
    }
  },
});

// ─── Files ──────────────────────────────────────────────────────────────────

export interface UploadFileInput {
  channel_id: string;
  content: string;
  filename: string;
  title?: string;
  initial_comment?: string;
}

export const uploadFile = tool({
  description: 'Upload a text file or snippet to a channel with optional title and comment.',
  inputSchema: jsonSchema<UploadFileInput>({
    type: 'object',
    properties: {
      channel_id: { type: 'string', description: 'Channel ID to upload to.' },
      content: { type: 'string', description: 'File content (text).' },
      filename: { type: 'string', description: 'Filename (e.g., "code.js", "notes.txt").' },
      title: { type: 'string', description: 'Optional title for the file.' },
      initial_comment: { type: 'string', description: 'Optional message to post with the file.' },
    },
    required: ['channel_id', 'content', 'filename'],
    additionalProperties: false,
  }),
  async execute(input: UploadFileInput): Promise<UploadFileResult> {
    try {
      if (!input.channel_id || !input.content || !input.filename) {
        throw new Error('channel_id, content, and filename are required and must be non-empty');
      }
      return await apiRequest<UploadFileResult>('files.upload', {
        channels: input.channel_id,
        content: input.content,
        filename: input.filename,
        title: input.title,
        initial_comment: input.initial_comment,
      });
    } catch (error) {
      throw new Error(`Failed to upload file: ${(error as Error).message}`);
    }
  },
});

// ─── Default Export ─────────────────────────────────────────────────────────

export default {
  // Messages
  sendMessage,
  listMessages,
  searchMessages,
  // Channels
  listChannels,
  getChannel,
  setChannelTopic,
  // Users
  listUsers,
  getUser,
  // Reactions
  addReaction,
  // Files
  uploadFile,
};
