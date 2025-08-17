import { test, expect } from 'vitest';
import { readCampaignResource, writeCampaignResource } from '../src/index';
import { URL } from 'node:url';
import fs from 'fs/promises';
import matter from 'gray-matter';

const lorePath = 'campaign/lore/test-entry.md';

test('write and read campaign memory', async () => {
  const uri = new URL('campaign://lore/test-entry');
  const text = `---\ntitle: Test Entry\ndate: 2024-01-01\n---\n\nHello world`;
  await writeCampaignResource(uri, text);
  const result = await readCampaignResource(uri);
  const parsed = matter(result.contents[0].text);
  expect(parsed.data.title).toBe('Test Entry');
  expect(parsed.content.trim()).toBe('Hello world');
  await fs.unlink(lorePath);
});
