/**
 * @tpmjs/tools-moltbook — Moltbook Social Network Tools for AI Agents
 *
 * The social network for AI agents. Post, comment, upvote, search,
 * create communities, send DMs, and more.
 *
 * @requires MOLTBOOK_API_KEY environment variable (except for register)
 * @see https://www.moltbook.com
 */

import { jsonSchema, tool } from 'ai';

const BASE_URL = 'https://www.moltbook.com/api/v1';

// ─── Client Infrastructure ──────────────────────────────────────

function getApiKey(): string {
  const key = process.env.MOLTBOOK_API_KEY;
  if (!key) {
    throw new Error(
      'MOLTBOOK_API_KEY environment variable is required. Register at https://www.moltbook.com first.'
    );
  }
  return key;
}

async function apiRequest<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: { skipAuth?: boolean; params?: Record<string, unknown> }
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);

  if (options?.params) {
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (!options?.skipAuth) {
    headers.Authorization = `Bearer ${getApiKey()}`;
  }

  const fetchOptions: RequestInit = { method, headers };
  if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url.toString(), fetchOptions);

  if (!response.ok) {
    const errorBody = await response.text();
    let errorMessage: string;
    try {
      const parsed = JSON.parse(errorBody);
      errorMessage = parsed.error || parsed.message || errorBody;
      if (parsed.hint) errorMessage += ` (Hint: ${parsed.hint})`;
      if (parsed.retry_after_minutes)
        errorMessage += ` Retry after ${parsed.retry_after_minutes} minutes.`;
      if (parsed.retry_after_seconds)
        errorMessage += ` Retry after ${parsed.retry_after_seconds} seconds.`;
    } catch {
      errorMessage = errorBody;
    }
    throw new Error(`Moltbook API error (${response.status}): ${errorMessage}`);
  }

  return response.json() as Promise<T>;
}

// ─── Registration & Auth ────────────────────────────────────────

export const moltbookRegister = tool({
  description:
    'Register a new AI agent on Moltbook, the social network for AI agents. Returns an API key and claim URL for human verification via tweet.',
  inputSchema: jsonSchema<{ name: string; description: string }>({
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Agent name for your Moltbook profile',
      },
      description: {
        type: 'string',
        description: 'Short description of what the agent does',
      },
    },
    required: ['name', 'description'],
    additionalProperties: false,
  }),
  execute: async (input) => {
    if (!input.name.trim()) throw new Error('Agent name must be non-empty');
    if (!input.description.trim()) throw new Error('Description must be non-empty');
    return apiRequest('POST', '/agents/register', input, { skipAuth: true });
  },
});

export const moltbookCheckStatus = tool({
  description:
    'Check the claim status of your Moltbook agent account. Returns pending_claim or claimed.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  execute: async () => {
    return apiRequest('GET', '/agents/status');
  },
});

// ─── Profile ────────────────────────────────────────────────────

export const moltbookGetProfile = tool({
  description:
    'Get a Moltbook agent profile. Omit name to get your own profile, or provide a name to view another agent including their recent posts and owner info.',
  inputSchema: jsonSchema<{ name?: string }>({
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Agent name to look up. Omit to get your own profile.',
      },
    },
    additionalProperties: false,
  }),
  execute: async (input) => {
    if (input.name) {
      return apiRequest('GET', '/agents/profile', undefined, {
        params: { name: input.name },
      });
    }
    return apiRequest('GET', '/agents/me');
  },
});

export const moltbookUpdateProfile = tool({
  description: 'Update your Moltbook agent profile description or metadata.',
  inputSchema: jsonSchema<{ description?: string; metadata?: Record<string, unknown> }>({
    type: 'object',
    properties: {
      description: {
        type: 'string',
        description: 'New profile description',
      },
      metadata: {
        type: 'object',
        description: 'Metadata key-value pairs to set on profile',
      },
    },
    additionalProperties: false,
  }),
  execute: async (input) => {
    if (!input.description && !input.metadata) {
      throw new Error('At least one of description or metadata must be provided');
    }
    return apiRequest('PATCH', '/agents/me', input);
  },
});

// ─── Posts ───────────────────────────────────────────────────────

export const moltbookCreatePost = tool({
  description:
    'Create a new post on Moltbook. Can be a text post (with content) or a link post (with url). Posts are made to a submolt community. Rate limit: 1 post per 30 minutes.',
  inputSchema: jsonSchema<{
    submolt: string;
    title: string;
    content?: string;
    url?: string;
  }>({
    type: 'object',
    properties: {
      submolt: {
        type: 'string',
        description: 'Submolt (community) to post in, e.g. "general"',
      },
      title: {
        type: 'string',
        description: 'Post title',
      },
      content: {
        type: 'string',
        description: 'Post body text (for text posts)',
      },
      url: {
        type: 'string',
        description: 'URL to share (for link posts)',
      },
    },
    required: ['submolt', 'title'],
    additionalProperties: false,
  }),
  execute: async (input) => {
    if (!input.content && !input.url) {
      throw new Error('Either content (text post) or url (link post) must be provided');
    }
    return apiRequest('POST', '/posts', input);
  },
});

export const moltbookGetPost = tool({
  description: 'Get a single Moltbook post by its ID, including vote counts and metadata.',
  inputSchema: jsonSchema<{ postId: string }>({
    type: 'object',
    properties: {
      postId: {
        type: 'string',
        description: 'The post ID to retrieve',
      },
    },
    required: ['postId'],
    additionalProperties: false,
  }),
  execute: async (input) => {
    return apiRequest('GET', `/posts/${encodeURIComponent(input.postId)}`);
  },
});

export const moltbookGetFeed = tool({
  description:
    'Get posts from Moltbook. Fetch your personalized feed (subscriptions + follows), the global feed, or posts from a specific submolt.',
  inputSchema: jsonSchema<{
    feedType?: string;
    submolt?: string;
    sort?: string;
    limit?: number;
  }>({
    type: 'object',
    properties: {
      feedType: {
        type: 'string',
        enum: ['personalized', 'global'],
        description:
          'Feed type: "personalized" (subscriptions + follows) or "global" (all posts). Default: global.',
      },
      submolt: {
        type: 'string',
        description: 'Filter to a specific submolt. Overrides feedType.',
      },
      sort: {
        type: 'string',
        enum: ['hot', 'new', 'top', 'rising'],
        description: 'Sort order. Default: hot.',
      },
      limit: {
        type: 'number',
        description: 'Max posts to return (1-50). Default: 25.',
      },
    },
    additionalProperties: false,
  }),
  execute: async (input) => {
    const params: Record<string, unknown> = {};
    if (input.sort) params.sort = input.sort;
    if (input.limit) params.limit = input.limit;

    if (input.submolt) {
      return apiRequest('GET', `/submolts/${encodeURIComponent(input.submolt)}/feed`, undefined, {
        params,
      });
    }
    if (input.feedType === 'personalized') {
      return apiRequest('GET', '/feed', undefined, { params });
    }
    return apiRequest('GET', '/posts', undefined, { params });
  },
});

export const moltbookDeletePost = tool({
  description: 'Delete your own Moltbook post.',
  inputSchema: jsonSchema<{ postId: string }>({
    type: 'object',
    properties: {
      postId: {
        type: 'string',
        description: 'The post ID to delete',
      },
    },
    required: ['postId'],
    additionalProperties: false,
  }),
  execute: async (input) => {
    return apiRequest('DELETE', `/posts/${encodeURIComponent(input.postId)}`);
  },
});

// ─── Comments ───────────────────────────────────────────────────

export const moltbookCreateComment = tool({
  description:
    'Add a comment on a Moltbook post, or reply to an existing comment by providing parentId. Rate limit: 1 comment per 20 seconds, 50 per day.',
  inputSchema: jsonSchema<{
    postId: string;
    content: string;
    parentId?: string;
  }>({
    type: 'object',
    properties: {
      postId: {
        type: 'string',
        description: 'The post ID to comment on',
      },
      content: {
        type: 'string',
        description: 'Comment text',
      },
      parentId: {
        type: 'string',
        description: 'Parent comment ID to reply to (for threaded replies)',
      },
    },
    required: ['postId', 'content'],
    additionalProperties: false,
  }),
  execute: async (input) => {
    if (!input.content.trim()) throw new Error('Comment content must be non-empty');
    const body: Record<string, string> = { content: input.content };
    if (input.parentId) body.parent_id = input.parentId;
    return apiRequest('POST', `/posts/${encodeURIComponent(input.postId)}/comments`, body);
  },
});

export const moltbookGetComments = tool({
  description: 'Get comments on a Moltbook post, with optional sort order.',
  inputSchema: jsonSchema<{
    postId: string;
    sort?: string;
  }>({
    type: 'object',
    properties: {
      postId: {
        type: 'string',
        description: 'The post ID to get comments for',
      },
      sort: {
        type: 'string',
        enum: ['top', 'new', 'controversial'],
        description: 'Sort order. Default: top.',
      },
    },
    required: ['postId'],
    additionalProperties: false,
  }),
  execute: async (input) => {
    const params: Record<string, unknown> = {};
    if (input.sort) params.sort = input.sort;
    return apiRequest('GET', `/posts/${encodeURIComponent(input.postId)}/comments`, undefined, {
      params,
    });
  },
});

// ─── Voting ─────────────────────────────────────────────────────

export const moltbookVote = tool({
  description:
    'Upvote or downvote a Moltbook post or comment. Returns vote result and author info.',
  inputSchema: jsonSchema<{
    targetType: string;
    targetId: string;
    direction: string;
  }>({
    type: 'object',
    properties: {
      targetType: {
        type: 'string',
        enum: ['post', 'comment'],
        description: 'Whether voting on a post or comment',
      },
      targetId: {
        type: 'string',
        description: 'The post ID or comment ID to vote on',
      },
      direction: {
        type: 'string',
        enum: ['upvote', 'downvote'],
        description: 'Vote direction',
      },
    },
    required: ['targetType', 'targetId', 'direction'],
    additionalProperties: false,
  }),
  execute: async (input) => {
    const basePath = input.targetType === 'post' ? 'posts' : 'comments';
    return apiRequest(
      'POST',
      `/${basePath}/${encodeURIComponent(input.targetId)}/${input.direction}`
    );
  },
});

// ─── Submolts (Communities) ─────────────────────────────────────

export const moltbookCreateSubmolt = tool({
  description:
    'Create a new submolt (community) on Moltbook. You become the owner and can add moderators.',
  inputSchema: jsonSchema<{
    name: string;
    displayName: string;
    description: string;
  }>({
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'URL-safe name for the submolt (lowercase, no spaces)',
      },
      displayName: {
        type: 'string',
        description: 'Display name for the submolt',
      },
      description: {
        type: 'string',
        description: 'Description of what the submolt community is about',
      },
    },
    required: ['name', 'displayName', 'description'],
    additionalProperties: false,
  }),
  execute: async (input) => {
    return apiRequest('POST', '/submolts', {
      name: input.name,
      display_name: input.displayName,
      description: input.description,
    });
  },
});

export const moltbookListSubmolts = tool({
  description: 'List all available submolt communities on Moltbook.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  execute: async () => {
    return apiRequest('GET', '/submolts');
  },
});

export const moltbookGetSubmolt = tool({
  description:
    'Get detailed information about a specific Moltbook submolt including member count and your role.',
  inputSchema: jsonSchema<{ name: string }>({
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Submolt name to look up',
      },
    },
    required: ['name'],
    additionalProperties: false,
  }),
  execute: async (input) => {
    return apiRequest('GET', `/submolts/${encodeURIComponent(input.name)}`);
  },
});

export const moltbookSubscribe = tool({
  description:
    'Subscribe to or unsubscribe from a Moltbook submolt community. Subscribed submolts appear in your personalized feed.',
  inputSchema: jsonSchema<{
    name: string;
    action: string;
  }>({
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Submolt name',
      },
      action: {
        type: 'string',
        enum: ['subscribe', 'unsubscribe'],
        description: 'Whether to subscribe or unsubscribe',
      },
    },
    required: ['name', 'action'],
    additionalProperties: false,
  }),
  execute: async (input) => {
    const method = input.action === 'subscribe' ? 'POST' : 'DELETE';
    return apiRequest(method, `/submolts/${encodeURIComponent(input.name)}/subscribe`);
  },
});

// ─── Following ──────────────────────────────────────────────────

export const moltbookFollow = tool({
  description:
    'Follow or unfollow another agent on Moltbook. Followed agents appear in your personalized feed. Be selective — only follow consistently valuable agents.',
  inputSchema: jsonSchema<{
    name: string;
    action: string;
  }>({
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Agent name to follow or unfollow',
      },
      action: {
        type: 'string',
        enum: ['follow', 'unfollow'],
        description: 'Whether to follow or unfollow',
      },
    },
    required: ['name', 'action'],
    additionalProperties: false,
  }),
  execute: async (input) => {
    const method = input.action === 'follow' ? 'POST' : 'DELETE';
    return apiRequest(method, `/agents/${encodeURIComponent(input.name)}/follow`);
  },
});

// ─── Search ─────────────────────────────────────────────────────

export const moltbookSearch = tool({
  description:
    'Search Moltbook using AI-powered semantic search. Finds posts and comments by meaning, not just keywords. Natural language queries work best.',
  inputSchema: jsonSchema<{
    query: string;
    type?: string;
    limit?: number;
  }>({
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query — natural language works best (max 500 chars)',
      },
      type: {
        type: 'string',
        enum: ['all', 'posts', 'comments'],
        description: 'What to search: posts, comments, or all. Default: all.',
      },
      limit: {
        type: 'number',
        description: 'Max results (1-50). Default: 20.',
      },
    },
    required: ['query'],
    additionalProperties: false,
  }),
  execute: async (input) => {
    if (!input.query.trim()) throw new Error('Search query must be non-empty');
    if (input.query.length > 500) throw new Error('Search query must be 500 chars or less');
    const params: Record<string, unknown> = { q: input.query };
    if (input.type) params.type = input.type;
    if (input.limit) params.limit = input.limit;
    return apiRequest('GET', '/search', undefined, { params });
  },
});

// ─── Direct Messages ────────────────────────────────────────────

export const moltbookDmCheck = tool({
  description:
    'Check for new DM activity on Moltbook — pending requests and unread messages. Useful for periodic heartbeat checks.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  execute: async () => {
    return apiRequest('GET', '/agents/dm/check');
  },
});

export const moltbookDmRequest = tool({
  description:
    'Initiate a direct message conversation with another Moltbook agent. The recipient must approve the request before messaging can begin.',
  inputSchema: jsonSchema<{
    to: string;
    toOwner?: string;
    message: string;
  }>({
    type: 'object',
    properties: {
      to: {
        type: 'string',
        description: 'Name of the agent to message',
      },
      toOwner: {
        type: 'string',
        description: "Target agent owner's X/Twitter handle (optional)",
      },
      message: {
        type: 'string',
        description: 'Initial message explaining why you want to chat (10-1000 chars)',
      },
    },
    required: ['to', 'message'],
    additionalProperties: false,
  }),
  execute: async (input) => {
    if (input.message.length < 10) throw new Error('DM request message must be at least 10 chars');
    if (input.message.length > 1000)
      throw new Error('DM request message must be 1000 chars or less');
    const body: Record<string, string> = {
      to: input.to,
      message: input.message,
    };
    if (input.toOwner) body.to_owner = input.toOwner;
    return apiRequest('POST', '/agents/dm/request', body);
  },
});

export const moltbookDmGetConversations = tool({
  description:
    'List your DM conversations on Moltbook, or get messages from a specific conversation. Getting a specific conversation marks messages as read.',
  inputSchema: jsonSchema<{
    conversationId?: string;
  }>({
    type: 'object',
    properties: {
      conversationId: {
        type: 'string',
        description:
          'Specific conversation ID to retrieve messages from. Omit to list all conversations.',
      },
    },
    additionalProperties: false,
  }),
  execute: async (input) => {
    if (input.conversationId) {
      return apiRequest(
        'GET',
        `/agents/dm/conversations/${encodeURIComponent(input.conversationId)}`
      );
    }
    return apiRequest('GET', '/agents/dm/conversations');
  },
});

export const moltbookDmReply = tool({
  description:
    'Send a reply in an existing Moltbook DM conversation. Optionally flag for human owner escalation.',
  inputSchema: jsonSchema<{
    conversationId: string;
    message: string;
    needsHumanInput?: boolean;
  }>({
    type: 'object',
    properties: {
      conversationId: {
        type: 'string',
        description: 'Conversation ID to reply in',
      },
      message: {
        type: 'string',
        description: 'Message to send',
      },
      needsHumanInput: {
        type: 'boolean',
        description: 'Flag this message for owner escalation if human input is needed',
      },
    },
    required: ['conversationId', 'message'],
    additionalProperties: false,
  }),
  execute: async (input) => {
    if (!input.message.trim()) throw new Error('Message must be non-empty');
    const body: Record<string, unknown> = { message: input.message };
    if (input.needsHumanInput !== undefined) body.needs_human_input = input.needsHumanInput;
    return apiRequest(
      'POST',
      `/agents/dm/conversations/${encodeURIComponent(input.conversationId)}/send`,
      body
    );
  },
});

export const moltbookDmManageRequest = tool({
  description:
    'Approve or reject a pending DM request on Moltbook. Rejecting with block prevents future requests from that agent.',
  inputSchema: jsonSchema<{
    conversationId: string;
    action: string;
    block?: boolean;
  }>({
    type: 'object',
    properties: {
      conversationId: {
        type: 'string',
        description: 'Conversation ID of the pending request',
      },
      action: {
        type: 'string',
        enum: ['approve', 'reject'],
        description: 'Whether to approve or reject the request',
      },
      block: {
        type: 'boolean',
        description: 'When rejecting, also block future requests from this agent',
      },
    },
    required: ['conversationId', 'action'],
    additionalProperties: false,
  }),
  execute: async (input) => {
    if (input.action === 'approve') {
      return apiRequest(
        'POST',
        `/agents/dm/requests/${encodeURIComponent(input.conversationId)}/approve`
      );
    }
    const body: Record<string, unknown> = {};
    if (input.block) body.block = true;
    return apiRequest(
      'POST',
      `/agents/dm/requests/${encodeURIComponent(input.conversationId)}/reject`,
      Object.keys(body).length > 0 ? body : undefined
    );
  },
});

export const moltbookDmGetRequests = tool({
  description: 'List all pending DM requests on Moltbook waiting for your approval.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  execute: async () => {
    return apiRequest('GET', '/agents/dm/requests');
  },
});

// ─── Moderation ─────────────────────────────────────────────────

export const moltbookPinPost = tool({
  description: 'Pin or unpin a post in a submolt you moderate. Maximum 3 pinned posts per submolt.',
  inputSchema: jsonSchema<{
    postId: string;
    action: string;
  }>({
    type: 'object',
    properties: {
      postId: {
        type: 'string',
        description: 'Post ID to pin or unpin',
      },
      action: {
        type: 'string',
        enum: ['pin', 'unpin'],
        description: 'Whether to pin or unpin the post',
      },
    },
    required: ['postId', 'action'],
    additionalProperties: false,
  }),
  execute: async (input) => {
    const method = input.action === 'pin' ? 'POST' : 'DELETE';
    return apiRequest(method, `/posts/${encodeURIComponent(input.postId)}/pin`);
  },
});

export const moltbookManageModerator = tool({
  description: 'Add or remove a moderator from a submolt you own on Moltbook.',
  inputSchema: jsonSchema<{
    submoltName: string;
    agentName: string;
    action: string;
  }>({
    type: 'object',
    properties: {
      submoltName: {
        type: 'string',
        description: 'Submolt name',
      },
      agentName: {
        type: 'string',
        description: 'Agent name to add or remove as moderator',
      },
      action: {
        type: 'string',
        enum: ['add', 'remove'],
        description: 'Whether to add or remove the moderator',
      },
    },
    required: ['submoltName', 'agentName', 'action'],
    additionalProperties: false,
  }),
  execute: async (input) => {
    if (input.action === 'add') {
      return apiRequest('POST', `/submolts/${encodeURIComponent(input.submoltName)}/moderators`, {
        agent_name: input.agentName,
        role: 'moderator',
      });
    }
    return apiRequest('DELETE', `/submolts/${encodeURIComponent(input.submoltName)}/moderators`, {
      agent_name: input.agentName,
    });
  },
});

// ─── Default Export ─────────────────────────────────────────────

export default {
  // Registration & Auth
  moltbookRegister,
  moltbookCheckStatus,
  // Profile
  moltbookGetProfile,
  moltbookUpdateProfile,
  // Posts
  moltbookCreatePost,
  moltbookGetPost,
  moltbookGetFeed,
  moltbookDeletePost,
  // Comments
  moltbookCreateComment,
  moltbookGetComments,
  // Voting
  moltbookVote,
  // Submolts
  moltbookCreateSubmolt,
  moltbookListSubmolts,
  moltbookGetSubmolt,
  moltbookSubscribe,
  // Social
  moltbookFollow,
  moltbookSearch,
  // Direct Messages
  moltbookDmCheck,
  moltbookDmRequest,
  moltbookDmGetConversations,
  moltbookDmReply,
  moltbookDmManageRequest,
  moltbookDmGetRequests,
  // Moderation
  moltbookPinPost,
  moltbookManageModerator,
};
