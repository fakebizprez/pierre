import { getHighlighterType } from '@pierre/diffs';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import FileDiff from './FileDiff.svelte';
import { initHighlighter } from './highlighter.js';
import { queryShadow, waitForRows } from './test-utils.js';

// Unmocked: Chromium supports WebAssembly SIMD, so the real Highlights backend loads.
test('initHighlighter() loads Highlights for real and components use it', async () => {
  await expect(initHighlighter({ themes: ['pierre-dark', 'pierre-light'] })).resolves.toBe('highlights');
  expect(getHighlighterType()).toBe('highlights');

  const screen = render(FileDiff, {
    oldFile: { name: 'a.ts', contents: 'const a = 1;\n', lang: 'typescript' },
    newFile: { name: 'a.ts', contents: 'const a = 2;\n', lang: 'typescript' },
  });

  await waitForRows(screen.container, '[data-line-type="change-addition"]');
  // Highlighted tokens carry per-token colors as inline styles.
  await expect
    .poll(() => queryShadow(screen.container, '[data-line-type="change-addition"] span[style]').length)
    .toBeGreaterThan(0);
  expect(getHighlighterType()).toBe('highlights');
});
