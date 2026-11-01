import { UnresolvedFile as UpstreamUnresolvedFile, type FileContents } from '@pierre/diffs';
import { userEvent } from 'vitest/browser';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import UnresolvedFile from './UnresolvedFile.svelte';
import { lines, queryShadow, trackResizeObservers, waitForRows } from './test-utils.js';

const file: FileContents = {
  name: 'conflict.ts',
  contents: [
    'const a = 1;',
    '<<<<<<< HEAD',
    'const b = 2;',
    '=======',
    'const b = 3;',
    '>>>>>>> feature',
    'const c = 4;',
    '',
  ].join('\n'),
};

describe('UnresolvedFile', () => {
  test('mounts and renders both sides of a merge conflict', async () => {
    const oninit = vi.fn();
    const screen = render(UnresolvedFile<undefined>, { file, oninit });
    const host = screen.container;

    await waitForRows(host, 'pre[data-has-merge-conflict]');
    const text = lines(host, '[data-line]');
    expect(text).toContain('const b = 2;');
    expect(text).toContain('const b = 3;');
    expect(oninit.mock.calls[0][0]).toBeInstanceOf(UpstreamUnresolvedFile);
  });

  test('resolving a conflict fires onMergeConflictResolve and survives option changes', async () => {
    let instance: UpstreamUnresolvedFile | undefined;
    const onMergeConflictResolve = vi.fn();
    const screen = render(UnresolvedFile<undefined>, {
      file,
      options: { onMergeConflictResolve },
      oninit: (i: UpstreamUnresolvedFile) => (instance = i),
    });
    const host = screen.container;
    await waitForRows(host, '[data-merge-conflict-action="incoming"]');
    const first = instance!;

    await userEvent.click(queryShadow(host, '[data-merge-conflict-action="incoming"]')[0] as HTMLElement);

    await expect.poll(() => onMergeConflictResolve.mock.calls.length).toBe(1);
    const resolved = onMergeConflictResolve.mock.calls[0][0] as FileContents;
    expect(resolved.contents).toContain('const b = 3;');
    expect(resolved.contents).not.toContain('<<<<<<<');

    // An option change re-renders the same instance without re-parsing the original file.
    const setOptions = vi.spyOn(first, 'setOptions');
    await screen.rerender({ options: { onMergeConflictResolve, disableLineNumbers: true } });
    expect(setOptions).toHaveBeenCalledTimes(1);
    await expect.poll(() => queryShadow(host, 'pre')[0]?.hasAttribute('data-disable-line-numbers')).toBe(true);
    expect(lines(host, '[data-line]')).not.toContain('const b = 2;');
    expect(instance).toBe(first);
  });

  test('unmount calls cleanUp() and mounting 20x does not leak', async () => {
    const cleanUp = vi.spyOn(UpstreamUnresolvedFile.prototype, 'cleanUp');
    const observers = trackResizeObservers();
    try {
      for (let i = 0; i < 20; i++) {
        const screen = render(UnresolvedFile<undefined>, { file });
        await waitForRows(screen.container, 'pre[data-has-merge-conflict]');
        screen.unmount();
      }
      expect(cleanUp).toHaveBeenCalledTimes(20);
      expect(document.querySelectorAll('diffs-container').length).toBe(0);
      expect(observers.live()).toBe(0);
    } finally {
      observers.restore();
      cleanUp.mockRestore();
    }
  });
});
