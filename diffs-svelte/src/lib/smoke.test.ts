import * as diffs from '@pierre/diffs';
import { expect, test } from 'vitest';

test('runs in a real browser with @pierre/diffs available', () => {
  expect(typeof window.ResizeObserver).toBe('function');
  expect(Object.keys(diffs).length).toBeGreaterThan(0);
});
