# @tpmjs/tools-discord

Discord API tools for AI agents. Send messages, manage guilds, channels, threads, members, reactions, and more.

## Installation

```bash
npm install @tpmjs/tools-discord
```

## Setup

Set the `DISCORD_BOT_TOKEN` environment variable. Get your token from [Discord Developer Portal](https://discord.com/developers/applications).

Required bot permissions: Send Messages, Read Message History, Manage Messages, Manage Channels, Add Reactions, Manage Threads.

## Usage

```typescript
import { sendMessage, listGuilds } from '@tpmjs/tools-discord';

const result = await sendMessage.execute({ channel_id: '123456789', content: 'Hello from AI!' });
const guilds = await listGuilds.execute({});
```

## Tools

| Tool | Description |
|------|-------------|
| sendMessage | Send a message to a channel |
| listGuilds | List guilds the bot is in |
| getGuild | Get guild details |
| listChannels | List guild channels |
| getChannel | Get channel details |
| listMessages | Get recent messages from a channel |
| createChannel | Create a text/voice/category channel |
| editMessage | Edit a previously sent message |
| deleteMessage | Delete a message |
| addReaction | Add emoji reaction to a message |
| listMembers | List guild members |
| getMember | Get member details |
| createThread | Create a thread from a message |
| listThreads | List active threads |
| pinMessage | Pin a message |

## License

MIT
