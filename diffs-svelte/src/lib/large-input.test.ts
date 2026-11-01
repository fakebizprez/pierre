import { parseDiffFromFile, type CodeViewItem } from '@pierre/diffs';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import CodeView from './CodeView.svelte';
import { queryShadow, waitForRows } from '../test/test-utils.js';

const LINE_COUNT = 20_000;

function bigFile(edit: number): string {
  return Array.from({ length: LINE_COUNT }, (_, i) =>
    i % 1000 === 0 ? `export const v${i} = ${i + edit};` : `const line${i} = ${i};`,
  ).join('\n');
}

test('CodeView virtualizes a 20,000-line diff instead of rendering every line', async () => {
  const items: CodeViewItem<undefined>[] = [
    {
      id: 'big',
      type: 'diff',
      fileDiff: parseDiffFromFile({ name: 'big.ts', contents: bigFile(0) }, { name: 'big.ts', contents: bigFile(1) }),
      version: 0,
    },
  ];
  const started = performance.now();
  const screen = render(CodeView<undefined>, {
    items,
    options: { expandUnchanged: true },
    style: 'height: 600px; overflow: auto;',
  });

  await waitForRows(screen.container, '[data-line]');
  const elapsed = performance.now() - started;

  const rendered = queryShadow(screen.container, '[data-line]').length;
  expect(rendered).toBeGreaterThan(0);
  expect(rendered).toBeLessThan(LINE_COUNT / 4);
  console.info(`20k-line CodeView: ${rendered} line elements in DOM, first rows after ${elapsed.toFixed(0)}ms`);
});
