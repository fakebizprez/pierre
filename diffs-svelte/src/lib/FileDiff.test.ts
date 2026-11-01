import { FileDiff as UpstreamFileDiff, parseDiffFromFile, type DiffLineAnnotation, type SelectedLineRange } from '@pierre/diffs';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import FileDiff from './FileDiff.svelte';
import { lines, trackResizeObservers, waitForRows } from '../test/test-utils.js';

const oldFile = { name: 'value.ts', contents: 'const a = 1;\nconst b = 2;\nconst c = 3;\n' };
const newFile = { name: 'value.ts', contents: 'const a = 1;\nconst b = 20;\nconst c = 3;\n' };

describe('FileDiff', () => {
  test('mounts and renders added and removed lines from a file pair', async () => {
    const screen = render(FileDiff<undefined>, { oldFile, newFile });
    const host = screen.container;

    await waitForRows(host, '[data-line-type="change-addition"]');
    expect(lines(host, '[data-line-type="change-addition"]')).toContain('const b = 20;');
    expect(lines(host, '[data-line-type="change-deletion"]')).toContain('const b = 2;');
  });

  test('renders pre-parsed fileDiff metadata and exposes the instance', async () => {
    const oninit = vi.fn();
    const screen = render(FileDiff<undefined>, { fileDiff: parseDiffFromFile(oldFile, newFile), oninit });

    await waitForRows(screen.container, '[data-line-type="change-addition"]');
    expect(oninit).toHaveBeenCalledTimes(1);
    expect(oninit.mock.calls[0][0]).toBeInstanceOf(UpstreamFileDiff);
  });

  test('applies option changes to the same instance', async () => {
    let instance: UpstreamFileDiff | undefined;
    const screen = render(FileDiff<undefined>, {
      oldFile,
      newFile,
      options: { diffStyle: 'split' },
      oninit: (i: UpstreamFileDiff) => (instance = i),
    });
    const host = screen.container;
    await waitForRows(host, 'pre[data-diff-type="split"]');
    const first = instance!;
    const setOptions = vi.spyOn(first, 'setOptions');

    await screen.rerender({ options: { diffStyle: 'unified' } });

    await waitForRows(host, 'pre[data-diff-type="single"]');
    expect(setOptions).toHaveBeenCalled();
    expect(instance).toBe(first);
  });

  test('re-renders new contents through the same instance', async () => {
    let instance: UpstreamFileDiff | undefined;
    const screen = render(FileDiff<undefined>, { oldFile, newFile, oninit: (i: UpstreamFileDiff) => (instance = i) });
    const host = screen.container;
    await waitForRows(host, '[data-line-type="change-addition"]');
    const first = instance!;

    await screen.rerender({ newFile: { name: 'value.ts', contents: 'const a = 1;\nconst b = 99;\nconst c = 3;\n' } });

    await expect.poll(() => lines(host, '[data-line-type="change-addition"]')).toContain('const b = 99;');
    expect(instance).toBe(first);
  });

  test('renders line annotations through renderAnnotation', async () => {
    const lineAnnotations: DiffLineAnnotation<{ note: string }>[] = [
      { side: 'additions', lineNumber: 2, metadata: { note: 'check this' } },
    ];
    const renderAnnotation = vi.fn((annotation: DiffLineAnnotation<{ note: string }>) => {
      const el = document.createElement('p');
      el.className = 'note';
      el.textContent = annotation.metadata.note;
      return el;
    });
    const screen = render(FileDiff<{ note: string }>, { oldFile, newFile, lineAnnotations, renderAnnotation });

    await expect.poll(() => screen.container.querySelector('.note')?.textContent).toBe('check this');
    expect(renderAnnotation).toHaveBeenCalled();

    await screen.rerender({ lineAnnotations: [] });
    await expect.poll(() => screen.container.querySelector('.note')).toBeNull();
  });

  test('controlled selectedLines are applied and selection callbacks fire on click', async () => {
    const onLineSelected = vi.fn();
    const screen = render(FileDiff<undefined>, {
      oldFile,
      newFile,
      options: { enableLineSelection: true },
      onLineSelected,
    });
    const host = screen.container;
    await waitForRows(host, '[data-line-type="change-addition"]');

    const range: SelectedLineRange = { start: 1, end: 1, side: 'additions' };
    await screen.rerender({ selectedLines: range });
    await expect.poll(() => host.querySelector('diffs-container')?.shadowRoot?.querySelector('[data-selected-line]')).not.toBeNull();
    expect(onLineSelected).toHaveBeenCalledWith(range);
  });

  test('swapping a callback prop does not call setOptions and the new callback fires', async () => {
    let instance: UpstreamFileDiff | undefined;
    const firstCallback = vi.fn();
    const secondCallback = vi.fn();
    const screen = render(FileDiff<undefined>, {
      oldFile,
      newFile,
      onLineSelected: firstCallback,
      oninit: (i: UpstreamFileDiff) => (instance = i),
    });
    await waitForRows(screen.container, '[data-line-type="change-addition"]');
    const setOptions = vi.spyOn(instance!, 'setOptions');

    await screen.rerender({ onLineSelected: secondCallback });
    instance!.setSelectedLines({ start: 2, end: 2, side: 'additions' });

    expect(setOptions).not.toHaveBeenCalled();
    expect(firstCallback).not.toHaveBeenCalled();
    expect(secondCallback).toHaveBeenCalledWith({ start: 2, end: 2, side: 'additions' });
  });

  test('selection callbacks fire from a real pointer click on a line number', async () => {
    const onLineSelectionEnd = vi.fn();
    const screen = render(FileDiff<undefined>, {
      oldFile,
      newFile,
      options: { enableLineSelection: true, diffStyle: 'unified' },
      onLineSelectionEnd,
    });
    const host = screen.container;
    await waitForRows(host, '[data-line-type="change-addition"]');
    const shadow = host.querySelector('diffs-container')!.shadowRoot!;
    const number = shadow.querySelector<HTMLElement>('[data-column-number="1"]')!;
    expect(number).not.toBeNull();

    const { userEvent } = await import('vitest/browser');
    await userEvent.click(number);

    await expect.poll(() => onLineSelectionEnd.mock.calls.length).toBeGreaterThan(0);
    expect(onLineSelectionEnd.mock.calls.at(-1)![0]).toMatchObject({ start: 1, end: 1 });
  });

  test('unmount calls cleanUp() and mounting 20x does not leak containers', async () => {
    const cleanUp = vi.spyOn(UpstreamFileDiff.prototype, 'cleanUp');
    const observers = trackResizeObservers();
    try {
      for (let i = 0; i < 20; i++) {
        const screen = render(FileDiff<undefined>, { oldFile, newFile });
        await waitForRows(screen.container, '[data-line-type="change-addition"]');
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
