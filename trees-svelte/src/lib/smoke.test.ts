import { FileTree } from '@pierre/trees';
import { expect, test } from 'vitest';

test('runs in a real browser with @pierre/trees available', () => {
  expect(typeof window.ResizeObserver).toBe('function');
  expect(typeof FileTree).toBe('function');
});
