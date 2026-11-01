import { prepareFileTreeInput } from '@pierre/trees';
import { afterEach, expect, test } from 'vitest';
import { page } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-svelte';
import FileTree from './FileTree.svelte';

afterEach(() => cleanup());

const DIRS = 500;
const FILES_PER_DIR = 100;

test('renders a 50,000-file tree with only the visible rows in the DOM', async () => {
  const paths: string[] = [];
  for (let d = 0; d < DIRS; d++) {
    for (let f = 0; f < FILES_PER_DIR; f++) paths.push(`pkg${d}/src/file${f}.ts`);
  }
  const started = performance.now();
  await render(FileTree, {
    preparedInput: prepareFileTreeInput(paths),
    initialExpansion: 'open',
    style: 'height: 600px',
  });

  await expect.element(page.getByRole('treeitem', { name: 'pkg0' })).toBeInTheDocument();
  const elapsed = performance.now() - started;
  const root = document.querySelector('file-tree-container')!.shadowRoot!;
  const rows = root.querySelectorAll('[role="treeitem"]').length;

  expect(rows).toBeGreaterThan(0);
  expect(rows).toBeLessThan(500);
  console.info(`50k-file tree: ${rows} rows in DOM, first rows after ${elapsed.toFixed(0)}ms`);
});
