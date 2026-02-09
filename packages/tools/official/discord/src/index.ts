/**
 * @tpmjs/tools-discord — Discord API Tools for AI Agents
 *
 * Full access to the Discord REST API: send messages, manage channels, guilds,
 * members, threads, reactions, and more.
 *
 * @requires DISCORD_BOT_TOKEN environment variable
 */

import { jsonSchema, tool } from 'ai';

const BASE_URL = 'https://discord.com/api/v10';

// ─── Client Infrastructure ──────────────────────────────────────────────────

function getApiKey(): string {
  const key = process.env.DISCORD_BOT_TOKEN;
  if (!key) {
    throw new Error(
      'DISCORD_BOT_TOKEN environment variable is required. Get your token from https://discord.com/developers/applications'
    );
  }
  return key;
}

async function apiRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  const key = getApiKey();

  const headers: Record<string, string> = {
    Authorization: `Bot ${key}`,
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

  if (response.status === 204) {
    return { success: true } as T;
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
    const errorData = (await response.json()) as { message?: string; code?: number };
    errorMessage = errorData.message || `HTTP ${response.status}`;
    if (errorData.code) {
      errorMessage = `${errorMessage} (Discord Error Code: ${errorData.code})`;
    }
  } catch {
    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
  }

  switch (response.status) {
    case 400:
      throw new Error(`Bad request: ${errorMessage}`);
    case 401:
      throw new Error('Authentication failed: Invalid Discord bot token. Check DISCORD_BOT_TOKEN.');
    case 403:
      throw new Error(`Access forbidden: ${errorMessage}`);
    case 404:
      throw new Error(`Not found: ${errorMessage}`);
    case 429:
      throw new Error(`Rate limit exceeded: ${errorMessage}`);
    default:
      throw new Error(`Discord API error (${response.status}): ${errorMessage}`);
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

// ─── Output Types ────────────────────────────────────────────────────────────

export interface DiscordMessage {
  id: string;
  channel_id: string;
  content: string;
  author: { id: string; username: string; discriminator: string };
  timestamp: string;
  tts: boolean;
  pinned: boolean;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner_id: string;
  member_count?: number;
  approximate_member_count?: number;
  approximate_presence_count?: number;
  features: string[];
}

export interface DiscordChannel {
  id: string;
  type: number;
  guild_id?: string;
  name?: string;
  topic?: string | null;
  position?: number;
  parent_id?: string | null;
}

export interface DiscordMember {
  user: { id: string; username: string; discriminator: string };
  nick: string | null;
  roles: string[];
  joined_at: string;
}

export interface DiscordThread {
  id: string;
  name: string;
  type: number;
  guild_id: string;
  parent_id: string;
  owner_id: string;
  message_count: number;
  member_count: number;
}

export interface SuccessResult {
  success: boolean;
}

export interface ListThreadsResult {
  threads: DiscordThread[];
  members: { id: string; user_id: string; join_timestamp: string }[];
}

// ─── Messages ───────────────────────────────────────────────────────────────

export interface SendMessageInput {
  channel_id: string;
  content: string;
  tts?: boolean;
}

export const sendMessage = tool({
  description: 'Send a message to a Discord channel with optional text-to-speech.',
  inputSchema: jsonSchema<SendMessageInput>({
    type: 'object',
    properties: {
      channel_id: { type: 'string', description: 'The ID of the channel to send the message to.' },
      content: { type: 'string', description: 'The message content (up to 2000 characters).' },
      tts: {
        type: 'boolean',
        description: 'Whether this message should be sent as text-to-speech.',
      },
    },
    required: ['channel_id', 'content'],
    additionalProperties: false,
  }),
  async execute(input: SendMessageInput): Promise<DiscordMessage> {
    try {
      if (!input.channel_id || !input.content) {
        throw new Error('channel_id and content are required and must be non-empty');
      }
      if (input.content.length > 2000) {
        throw new Error('Message content must be 2000 characters or less');
      }
      return await apiRequest<DiscordMessage>('POST', `/channels/${input.channel_id}/messages`, {
        content: input.content,
        tts: input.tts,
      });
    } catch (error) {
      throw new Error(`Failed to send message: ${(error as Error).message}`);
    }
  },
});

export interface ListMessagesInput {
  channel_id: string;
  limit?: number;
  before?: string;
  after?: string;
  around?: string;
}

export const listMessages = tool({
  description:
    'Get recent messages from a Discord channel with optional pagination using message IDs.',
  inputSchema: jsonSchema<ListMessagesInput>({
    type: 'object',
    properties: {
      channel_id: { type: 'string', description: 'The ID of the channel to get messages from.' },
      limit: {
        type: 'number',
        description: 'Number of messages to retrieve (1-100, default: 50).',
      },
      before: { type: 'string', description: 'Get messages before this message ID.' },
      after: { type: 'string', description: 'Get messages after this message ID.' },
      around: { type: 'string', description: 'Get messages around this message ID.' },
    },
    required: ['channel_id'],
    additionalProperties: false,
  }),
  async execute(input: ListMessagesInput): Promise<DiscordMessage[]> {
    try {
      if (!input.channel_id) {
        throw new Error('channel_id is required');
      }
      if (input.limit !== undefined && (input.limit < 1 || input.limit > 100)) {
        throw new Error('Limit must be between 1 and 100');
      }
      const qs = buildQueryString({
        limit: input.limit,
        before: input.before,
        after: input.after,
        around: input.around,
      });
      return await apiRequest<DiscordMessage[]>(
        'GET',
        `/channels/${input.channel_id}/messages${qs}`
      );
    } catch (error) {
      throw new Error(`Failed to list messages: ${(error as Error).message}`);
    }
  },
});

export interface EditMessageInput {
  channel_id: string;
  message_id: string;
  content: string;
}

export const editMessage = tool({
  description: 'Edit an existing message sent by the bot in a Discord channel.',
  inputSchema: jsonSchema<EditMessageInput>({
    type: 'object',
    properties: {
      channel_id: { type: 'string', description: 'The ID of the channel containing the message.' },
      message_id: { type: 'string', description: 'The ID of the message to edit.' },
      content: { type: 'string', description: 'The new message content (up to 2000 characters).' },
    },
    required: ['channel_id', 'message_id', 'content'],
    additionalProperties: false,
  }),
  async execute(input: EditMessageInput): Promise<DiscordMessage> {
    try {
      if (!input.channel_id || !input.message_id || !input.content) {
        throw new Error('channel_id, message_id, and content are required and must be non-empty');
      }
      if (input.content.length > 2000) {
        throw new Error('Message content must be 2000 characters or less');
      }
      return await apiRequest<DiscordMessage>(
        'PATCH',
        `/channels/${input.channel_id}/messages/${input.message_id}`,
        { content: input.content }
      );
    } catch (error) {
      throw new Error(`Failed to edit message: ${(error as Error).message}`);
    }
  },
});

export interface DeleteMessageInput {
  channel_id: string;
  message_id: string;
}

export const deleteMessage = tool({
  description: 'Delete a message from a Discord channel. Requires appropriate permissions.',
  inputSchema: jsonSchema<DeleteMessageInput>({
    type: 'object',
    properties: {
      channel_id: { type: 'string', description: 'The ID of the channel containing the message.' },
      message_id: { type: 'string', description: 'The ID of the message to delete.' },
    },
    required: ['channel_id', 'message_id'],
    additionalProperties: false,
  }),
  async execute(input: DeleteMessageInput): Promise<SuccessResult> {
    try {
      if (!input.channel_id || !input.message_id) {
        throw new Error('channel_id and message_id are required');
      }
      return await apiRequest<SuccessResult>(
        'DELETE',
        `/channels/${input.channel_id}/messages/${input.message_id}`
      );
    } catch (error) {
      throw new Error(`Failed to delete message: ${(error as Error).message}`);
    }
  },
});

export interface PinMessageInput {
  channel_id: string;
  message_id: string;
}

export const pinMessage = tool({
  description: 'Pin a message in a Discord channel. Maximum 50 pinned messages per channel.',
  inputSchema: jsonSchema<PinMessageInput>({
    type: 'object',
    properties: {
      channel_id: { type: 'string', description: 'The ID of the channel containing the message.' },
      message_id: { type: 'string', description: 'The ID of the message to pin.' },
    },
    required: ['channel_id', 'message_id'],
    additionalProperties: false,
  }),
  async execute(input: PinMessageInput): Promise<SuccessResult> {
    try {
      if (!input.channel_id || !input.message_id) {
        throw new Error('channel_id and message_id are required');
      }
      return await apiRequest<SuccessResult>(
        'PUT',
        `/channels/${input.channel_id}/pins/${input.message_id}`
      );
    } catch (error) {
      throw new Error(`Failed to pin message: ${(error as Error).message}`);
    }
  },
});

// ─── Reactions ──────────────────────────────────────────────────────────────

export interface AddReactionInput {
  channel_id: string;
  message_id: string;
  emoji: string;
}

export const addReaction = tool({
  description:
    'Add a reaction emoji to a message. Use URL-encoded emoji like %F0%9F%91%8D or custom emoji format name:id.',
  inputSchema: jsonSchema<AddReactionInput>({
    type: 'object',
    properties: {
      channel_id: { type: 'string', description: 'The ID of the channel containing the message.' },
      message_id: { type: 'string', description: 'The ID of the message to react to.' },
      emoji: {
        type: 'string',
        description:
          'URL-encoded emoji (e.g., %F0%9F%91%8D for thumbs up) or custom emoji in name:id format.',
      },
    },
    required: ['channel_id', 'message_id', 'emoji'],
    additionalProperties: false,
  }),
  async execute(input: AddReactionInput): Promise<SuccessResult> {
    try {
      if (!input.channel_id || !input.message_id || !input.emoji) {
        throw new Error('channel_id, message_id, and emoji are required');
      }
      return await apiRequest<SuccessResult>(
        'PUT',
        `/channels/${input.channel_id}/messages/${input.message_id}/reactions/${input.emoji}/@me`
      );
    } catch (error) {
      throw new Error(`Failed to add reaction: ${(error as Error).message}`);
    }
  },
});

// ─── Guilds ─────────────────────────────────────────────────────────────────

export interface ListGuildsInput {
  limit?: number;
  before?: string;
  after?: string;
}

export const listGuilds = tool({
  description:
    'List all guilds (servers) the bot is a member of with optional pagination using guild IDs.',
  inputSchema: jsonSchema<ListGuildsInput>({
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Number of guilds to retrieve (1-200, default: 200).' },
      before: { type: 'string', description: 'Get guilds before this guild ID.' },
      after: { type: 'string', description: 'Get guilds after this guild ID.' },
    },
    additionalProperties: false,
  }),
  async execute(input: ListGuildsInput): Promise<DiscordGuild[]> {
    try {
      if (input.limit !== undefined && (input.limit < 1 || input.limit > 200)) {
        throw new Error('Limit must be between 1 and 200');
      }
      const qs = buildQueryString({
        limit: input.limit,
        before: input.before,
        after: input.after,
      });
      return await apiRequest<DiscordGuild[]>('GET', `/users/@me/guilds${qs}`);
    } catch (error) {
      throw new Error(`Failed to list guilds: ${(error as Error).message}`);
    }
  },
});

export interface GetGuildInput {
  guild_id: string;
  with_counts?: boolean;
}

export const getGuild = tool({
  description:
    'Get detailed information about a Discord guild including roles, emojis, and features.',
  inputSchema: jsonSchema<GetGuildInput>({
    type: 'object',
    properties: {
      guild_id: { type: 'string', description: 'The ID of the guild to retrieve.' },
      with_counts: {
        type: 'boolean',
        description: 'Include approximate member and presence counts (default: false).',
      },
    },
    required: ['guild_id'],
    additionalProperties: false,
  }),
  async execute(input: GetGuildInput): Promise<DiscordGuild> {
    try {
      if (!input.guild_id) {
        throw new Error('guild_id is required');
      }
      const qs = buildQueryString({ with_counts: input.with_counts });
      return await apiRequest<DiscordGuild>('GET', `/guilds/${input.guild_id}${qs}`);
    } catch (error) {
      throw new Error(`Failed to get guild: ${(error as Error).message}`);
    }
  },
});

// ─── Channels ───────────────────────────────────────────────────────────────

export interface ListChannelsInput {
  guild_id: string;
}

export const listChannels = tool({
  description: 'List all channels in a Discord guild including text, voice, and category channels.',
  inputSchema: jsonSchema<ListChannelsInput>({
    type: 'object',
    properties: {
      guild_id: { type: 'string', description: 'The ID of the guild to list channels from.' },
    },
    required: ['guild_id'],
    additionalProperties: false,
  }),
  async execute(input: ListChannelsInput): Promise<DiscordChannel[]> {
    try {
      if (!input.guild_id) {
        throw new Error('guild_id is required');
      }
      return await apiRequest<DiscordChannel[]>('GET', `/guilds/${input.guild_id}/channels`);
    } catch (error) {
      throw new Error(`Failed to list channels: ${(error as Error).message}`);
    }
  },
});

export interface GetChannelInput {
  channel_id: string;
}

export const getChannel = tool({
  description: 'Get detailed information about a specific Discord channel.',
  inputSchema: jsonSchema<GetChannelInput>({
    type: 'object',
    properties: {
      channel_id: { type: 'string', description: 'The ID of the channel to retrieve.' },
    },
    required: ['channel_id'],
    additionalProperties: false,
  }),
  async execute(input: GetChannelInput): Promise<DiscordChannel> {
    try {
      if (!input.channel_id) {
        throw new Error('channel_id is required');
      }
      return await apiRequest<DiscordChannel>('GET', `/channels/${input.channel_id}`);
    } catch (error) {
      throw new Error(`Failed to get channel: ${(error as Error).message}`);
    }
  },
});

export interface CreateChannelInput {
  guild_id: string;
  name: string;
  type?: number;
  topic?: string;
  parent_id?: string;
}

const VALID_CHANNEL_TYPES = [0, 2, 4, 5];

export const createChannel = tool({
  description:
    'Create a new channel in a Discord guild. Channel types: 0=text, 2=voice, 4=category, 5=announcement.',
  inputSchema: jsonSchema<CreateChannelInput>({
    type: 'object',
    properties: {
      guild_id: { type: 'string', description: 'The ID of the guild to create the channel in.' },
      name: { type: 'string', description: 'The name of the channel (1-100 characters).' },
      type: {
        type: 'number',
        description: 'Channel type: 0=text, 2=voice, 4=category, 5=announcement (default: 0).',
      },
      topic: {
        type: 'string',
        description: 'Channel topic (0-1024 characters, text channels only).',
      },
      parent_id: {
        type: 'string',
        description: 'ID of the parent category for the channel.',
      },
    },
    required: ['guild_id', 'name'],
    additionalProperties: false,
  }),
  async execute(input: CreateChannelInput): Promise<DiscordChannel> {
    try {
      if (!input.guild_id || !input.name) {
        throw new Error('guild_id and name are required');
      }
      if (input.name.length < 1 || input.name.length > 100) {
        throw new Error('Channel name must be between 1 and 100 characters');
      }
      if (input.type !== undefined && !VALID_CHANNEL_TYPES.includes(input.type)) {
        throw new Error(
          'Channel type must be 0 (text), 2 (voice), 4 (category), or 5 (announcement)'
        );
      }
      if (input.topic !== undefined && input.topic.length > 1024) {
        throw new Error('Topic must be 1024 characters or less');
      }
      return await apiRequest<DiscordChannel>('POST', `/guilds/${input.guild_id}/channels`, {
        name: input.name,
        type: input.type ?? 0,
        topic: input.topic,
        parent_id: input.parent_id,
      });
    } catch (error) {
      throw new Error(`Failed to create channel: ${(error as Error).message}`);
    }
  },
});

// ─── Members ────────────────────────────────────────────────────────────────

export interface ListMembersInput {
  guild_id: string;
  limit?: number;
  after?: string;
}

export const listMembers = tool({
  description: 'List members of a Discord guild with optional pagination using user IDs.',
  inputSchema: jsonSchema<ListMembersInput>({
    type: 'object',
    properties: {
      guild_id: { type: 'string', description: 'The ID of the guild to list members from.' },
      limit: { type: 'number', description: 'Number of members to retrieve (1-1000, default: 1).' },
      after: { type: 'string', description: 'Get members after this user ID.' },
    },
    required: ['guild_id'],
    additionalProperties: false,
  }),
  async execute(input: ListMembersInput): Promise<DiscordMember[]> {
    try {
      if (!input.guild_id) {
        throw new Error('guild_id is required');
      }
      if (input.limit !== undefined && (input.limit < 1 || input.limit > 1000)) {
        throw new Error('Limit must be between 1 and 1000');
      }
      const qs = buildQueryString({
        limit: input.limit,
        after: input.after,
      });
      return await apiRequest<DiscordMember[]>('GET', `/guilds/${input.guild_id}/members${qs}`);
    } catch (error) {
      throw new Error(`Failed to list members: ${(error as Error).message}`);
    }
  },
});

export interface GetMemberInput {
  guild_id: string;
  user_id: string;
}

export const getMember = tool({
  description:
    'Get detailed information about a specific member in a guild including roles and join date.',
  inputSchema: jsonSchema<GetMemberInput>({
    type: 'object',
    properties: {
      guild_id: { type: 'string', description: 'The ID of the guild.' },
      user_id: { type: 'string', description: 'The ID of the user to get member info for.' },
    },
    required: ['guild_id', 'user_id'],
    additionalProperties: false,
  }),
  async execute(input: GetMemberInput): Promise<DiscordMember> {
    try {
      if (!input.guild_id || !input.user_id) {
        throw new Error('guild_id and user_id are required');
      }
      return await apiRequest<DiscordMember>(
        'GET',
        `/guilds/${input.guild_id}/members/${input.user_id}`
      );
    } catch (error) {
      throw new Error(`Failed to get member: ${(error as Error).message}`);
    }
  },
});

// ─── Threads ────────────────────────────────────────────────────────────────

export interface CreateThreadInput {
  channel_id: string;
  message_id: string;
  name: string;
  auto_archive_duration?: number;
}

const VALID_ARCHIVE_DURATIONS = [60, 1440, 4320, 10080];

export const createThread = tool({
  description:
    'Create a thread from an existing message. Auto-archive durations: 60 (1h), 1440 (1d), 4320 (3d), 10080 (7d) minutes.',
  inputSchema: jsonSchema<CreateThreadInput>({
    type: 'object',
    properties: {
      channel_id: { type: 'string', description: 'The ID of the channel containing the message.' },
      message_id: { type: 'string', description: 'The ID of the message to create a thread from.' },
      name: { type: 'string', description: 'The name of the thread (1-100 characters).' },
      auto_archive_duration: {
        type: 'number',
        description:
          'Duration in minutes to auto-archive: 60 (1 hour), 1440 (1 day), 4320 (3 days), or 10080 (7 days). Default: 1440.',
      },
    },
    required: ['channel_id', 'message_id', 'name'],
    additionalProperties: false,
  }),
  async execute(input: CreateThreadInput): Promise<DiscordThread> {
    try {
      if (!input.channel_id || !input.message_id || !input.name) {
        throw new Error('channel_id, message_id, and name are required');
      }
      if (input.name.length < 1 || input.name.length > 100) {
        throw new Error('Thread name must be between 1 and 100 characters');
      }
      if (
        input.auto_archive_duration !== undefined &&
        !VALID_ARCHIVE_DURATIONS.includes(input.auto_archive_duration)
      ) {
        throw new Error('auto_archive_duration must be 60, 1440, 4320, or 10080');
      }
      return await apiRequest<DiscordThread>(
        'POST',
        `/channels/${input.channel_id}/messages/${input.message_id}/threads`,
        {
          name: input.name,
          auto_archive_duration: input.auto_archive_duration,
        }
      );
    } catch (error) {
      throw new Error(`Failed to create thread: ${(error as Error).message}`);
    }
  },
});

export interface ListThreadsInput {
  guild_id: string;
}

export const listThreads = tool({
  description: 'List all active threads in a Discord guild across all channels.',
  inputSchema: jsonSchema<ListThreadsInput>({
    type: 'object',
    properties: {
      guild_id: { type: 'string', description: 'The ID of the guild to list active threads from.' },
    },
    required: ['guild_id'],
    additionalProperties: false,
  }),
  async execute(input: ListThreadsInput): Promise<ListThreadsResult> {
    try {
      if (!input.guild_id) {
        throw new Error('guild_id is required');
      }
      return await apiRequest<ListThreadsResult>('GET', `/guilds/${input.guild_id}/threads/active`);
    } catch (error) {
      throw new Error(`Failed to list threads: ${(error as Error).message}`);
    }
  },
});

// ─── Default Export ─────────────────────────────────────────────────────────

export default {
  // Messages
  sendMessage,
  listMessages,
  editMessage,
  deleteMessage,
  pinMessage,
  // Reactions
  addReaction,
  // Guilds
  listGuilds,
  getGuild,
  // Channels
  listChannels,
  getChannel,
  createChannel,
  // Members
  listMembers,
  getMember,
  // Threads
  createThread,
  listThreads,
};
