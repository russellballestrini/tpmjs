# @tpmjs/tools-slack

Slack API tools for AI agents. Send messages, manage channels, list users, search messages, upload files, and more.

## Installation

```bash
npm install @tpmjs/tools-slack
```

## Setup

Set the `SLACK_BOT_TOKEN` environment variable. Get your token from [Slack API Apps](https://api.slack.com/apps).

Required bot scopes: `chat:write`, `channels:read`, `channels:history`, `users:read`, `reactions:write`, `files:write`, `search:read`.

## Usage

```typescript
import { sendMessage, listChannels } from '@tpmjs/tools-slack';

const result = await sendMessage.execute({ channel: '#general', text: 'Hello from AI!' });
const channels = await listChannels.execute({});
```

## Tools

| Tool | Description |
|------|-------------|
| sendMessage | Send a message to a channel or thread |
| listChannels | List workspace channels by type |
| getChannel | Get channel details |
| listUsers | List workspace users |
| getUser | Get user profile details |
| addReaction | Add emoji reaction to a message |
| uploadFile | Upload a text file or snippet |
| setChannelTopic | Set a channel's topic |
| listMessages | Get recent messages from a channel |
| searchMessages | Search messages across the workspace |

## License

MIT
