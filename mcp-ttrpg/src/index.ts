import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { RequestSchema, TextResourceContentsSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { randomInt } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

const CAMPAIGN_DIR = path.join(process.cwd(), 'campaign');
const SESSIONS_DIR = path.join(CAMPAIGN_DIR, 'sessions');
const LORE_DIR = path.join(CAMPAIGN_DIR, 'lore');

await fs.mkdir(SESSIONS_DIR, { recursive: true });
await fs.mkdir(LORE_DIR, { recursive: true });

export type Advantage = 'adv' | 'dis' | null;

export function rollDice(notation: string, advantage: Advantage = null) {
  const match = notation.replace(/\s+/g, '').match(/^(\d*)d(\d+)([+-]\d+)?$/i);
  if (!match) throw new Error('Invalid dice notation');
  const count = parseInt(match[1] || '1', 10);
  const sides = parseInt(match[2], 10);
  const modifier = match[3] ? parseInt(match[3], 10) : 0;
  let rolls: number[] = [];

  if (advantage && count === 1 && sides === 20) {
    const r1 = randomInt(1, 21);
    const r2 = randomInt(1, 21);
    rolls = [r1, r2];
    const chosen = advantage === 'adv' ? Math.max(r1, r2) : Math.min(r1, r2);
    const total = chosen + modifier;
    const detail = `Rolled 1d20${modifier ? (modifier > 0 ? '+' + modifier : modifier) : ''} with ${advantage === 'adv' ? 'advantage' : 'disadvantage'}: [${r1}, ${r2}] -> ${chosen}${modifier ? (modifier > 0 ? '+' + modifier : modifier) : ''} = ${total}`;
    return { total, rolls, detail };
  }

  for (let i = 0; i < count; i++) {
    rolls.push(randomInt(1, sides + 1));
  }
  const total = rolls.reduce((a, b) => a + b, 0) + modifier;
  const detail = `Rolled ${notation}: [${rolls.join(', ')}]${modifier ? (modifier > 0 ? ' + ' + modifier : ' - ' + Math.abs(modifier)) : ''} = ${total}`;
  return { total, rolls, detail };
}

function uriToFilePath(url: URL) {
  if (url.protocol !== 'campaign:') throw new Error('Invalid scheme');
  const category = url.hostname;
  const slug = url.pathname.replace(/^\//, '');
  if (!category || !slug) throw new Error('Invalid campaign URI');
  if (category === 'sessions') {
    return path.join(SESSIONS_DIR, `${slug}.md`);
  } else if (category === 'lore') {
    return path.join(LORE_DIR, `${slug}.md`);
  }
  throw new Error('Unknown campaign category');
}

export async function readCampaignResource(url: URL) {
  const filePath = uriToFilePath(url);
  const raw = await fs.readFile(filePath, 'utf8');
  const parsed = matter(raw);
  const text = matter.stringify(parsed.content, parsed.data);
  return {
    contents: [{ uri: url.href, text }]
  };
}

export async function writeCampaignResource(url: URL, text: string) {
  const filePath = uriToFilePath(url);
  const parsed = matter(text);
  const full = matter.stringify(parsed.content, parsed.data);
  await fs.writeFile(filePath, full, 'utf8');
}

const server = new McpServer({ name: 'mcp-ttrpg', version: '0.1.0' });

server.registerTool('roll_dice', {
  title: 'Roll Dice',
  description: 'Roll dice using standard notation',
  inputSchema: {
    notation: z.string(),
    advantage: z.enum(['adv', 'dis']).nullish()
  },
  outputSchema: {
    total: z.number(),
    rolls: z.array(z.number()),
    detail: z.string()
  }
}, async ({ notation, advantage }) => {
  const result = rollDice(notation, advantage ?? null);
  return {
    content: [
      { type: 'text', text: JSON.stringify(result) }
    ]
  };
});

const sessionsTemplate = new ResourceTemplate('campaign://sessions/{date}', {
  list: async () => {
    const files = await fs.readdir(SESSIONS_DIR);
    return {
      resources: files.filter(f => f.endsWith('.md')).map(f => ({
        uri: `campaign://sessions/${f.replace(/\.md$/, '')}`,
        name: f.replace(/\.md$/, ''),
        description: 'Session notes',
        mimeType: 'text/markdown'
      }))
    };
  }
});

server.registerResource('session-notes', sessionsTemplate, {
  title: 'Session Notes',
  description: 'TTRPG session notes',
  mimeType: 'text/markdown'
}, async (uri) => readCampaignResource(uri));

const loreTemplate = new ResourceTemplate('campaign://lore/{slug}', {
  list: async () => {
    const files = await fs.readdir(LORE_DIR);
    return {
      resources: files.filter(f => f.endsWith('.md')).map(f => ({
        uri: `campaign://lore/${f.replace(/\.md$/, '')}`,
        name: f.replace(/\.md$/, ''),
        description: 'Lore entry',
        mimeType: 'text/markdown'
      }))
    };
  }
});

server.registerResource('lore', loreTemplate, {
  title: 'Lore Entries',
  description: 'Campaign lore entries',
  mimeType: 'text/markdown'
}, async (uri) => readCampaignResource(uri));

const WriteResourceRequestSchema = RequestSchema.extend({
  method: z.literal('resources/write'),
  params: z.object({
    uri: z.string().url(),
    contents: z.array(TextResourceContentsSchema)
  })
});

server.server.setRequestHandler(WriteResourceRequestSchema, async (request) => {
  const { uri, contents } = request.params;
  const url = new URL(uri);
  const textBlock = contents.find(c => 'text' in c && c.type === 'text');
  if (!textBlock) throw new Error('Only text content supported');
  await writeCampaignResource(url, textBlock.text);
  await server.server.sendResourceUpdated({ uri });
  server.sendResourceListChanged();
  return {};
});

export async function start() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  start().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

export { server };
