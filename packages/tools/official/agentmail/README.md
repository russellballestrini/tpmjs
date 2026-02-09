# @tpmjs/tools-agentmail

AgentMail API tools for AI agents — create inboxes, send/receive emails, manage threads, drafts, and more.

## Installation

```bash
npm install @tpmjs/tools-agentmail
```

## Setup

Set the `AGENTMAIL_API_KEY` environment variable. Get your API key from [AgentMail Dashboard](https://app.agentmail.to).

```bash
export AGENTMAIL_API_KEY=your_api_key_here
```

## Usage

```typescript
import { createInbox, sendMessage, listMessages } from '@tpmjs/tools-agentmail';

// Create a new inbox for your AI agent
const inbox = await createInbox.execute({
  username: 'my-agent',
  display_name: 'My AI Agent',
});

// Send an email
const message = await sendMessage.execute({
  inbox_id: inbox.inbox_id,
  to: 'recipient@example.com',
  subject: 'Hello from AI',
  text: 'This is an automated message from my AI agent.',
});

// List received messages
const messages = await listMessages.execute({
  inbox_id: inbox.inbox_id,
  limit: 20,
});
```

## Tools

| Tool | Description |
|------|-------------|
| createInbox | Create a new email inbox with optional custom username and domain |
| listInboxes | List all email inboxes with pagination support |
| getInbox | Get details of a specific inbox by ID |
| deleteInbox | Delete an inbox and all its messages permanently |
| sendMessage | Send an email message with subject and body |
| replyToMessage | Reply to an existing email in a thread |
| listMessages | List email messages in an inbox with pagination |
| getMessage | Get full details of a specific message |
| listThreads | List email threads, optionally filtered by labels |
| getThread | Get a thread with all its messages |
| createDraft | Create an email draft for approval before sending |
| sendDraft | Send a previously created draft |

## Features

- **Complete Email Management**: Create inboxes, send/receive emails, manage threads
- **Thread Support**: View full conversation history with thread IDs
- **Draft Support**: Create drafts for human-in-the-loop approval workflows
- **Label Support**: Organize messages with custom labels
- **Pagination**: Efficiently handle large inboxes with cursor-based pagination
- **Type-Safe**: Full TypeScript types for all API responses

## API Documentation

For detailed API documentation, visit [AgentMail API Docs](https://docs.agentmail.to).

## License

MIT
