import * as upstream from '@pierre/trees';
import { expect, test } from 'vitest';
import * as pkg from './index.js';
import FileTreeComponent from './FileTree.svelte';

test('exports the component and re-exports upstream helpers', () => {
  expect(pkg.FileTree).toBe(FileTreeComponent);
  expect(pkg.FileTreeModel).toBe(upstream.FileTree);
  expect(pkg.prepareFileTreeInput).toBe(upstream.prepareFileTreeInput);
  expect(pkg.preparePresortedFileTreeInput).toBe(upstream.preparePresortedFileTreeInput);
  expect(pkg.themeToTreeStyles).toBe(upstream.themeToTreeStyles);
  expect(typeof pkg.treeStylesToCssText).toBe('function');
});
