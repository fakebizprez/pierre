import { CodeView as UpstreamCodeView, parseDiffFromFile, type CodeViewItem } from '@pierre/diffs';
import { userEvent } from 'vitest/browser';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import CodeView from './CodeView.svelte';
import { lines, queryShadow, trackResizeObservers, waitForRows } from './test-utils.js';

const oldFile = { name: 'src/value.ts', contents: 'export const value = 1;\n' };
const newFile = { name: 'src/value.ts', contents: 'export const value = 2;\n' };

function makeItems(): CodeViewItem<undefined>[] {
  return [
    { id: 'diff:value', type: 'diff', fileDiff: parseDiffFromFile(oldFile, newFile), version: 0 },
    { id: 'file:readme', type: 'file', file: { name: 'README.md', contents: '# Review notes\n' }, version: 0 },
  ];
}

const style = 'height: 500px; overflow: auto;';

describe('CodeView', () => {
  test('mounts and renders diff and file items', async () => {
    const oninit = vi.fn();
    const screen = render(CodeView<undefined>, { items: makeItems(), style, oninit });
    const host = screen.container;

    await waitForRows(host, '[data-line-type="change-addition"]');
    expect(lines(host, '[data-line-type="change-addition"]')).toContain('export const value = 2;');
    expect(lines(host, '[data-line-type="change-deletion"]')).toContain('export const value = 1;');
    await expect.poll(() => lines(host, '[data-line]')).toContain('# Review notes');
    expect(oninit.mock.calls[0][0]).toBeInstanceOf(UpstreamCodeView);
  });

  test('applies items and option changes to the same instance', async () => {
    let instance: UpstreamCodeView | undefined;
    const items = makeItems();
    const screen = render(CodeView<undefined>, { items, style, oninit: (i: UpstreamCodeView) => (instance = i) });
    const host = screen.container;
    await waitForRows(host, '[data-line-type="change-addition"]');
    const first = instance!;
    const setItems = vi.spyOn(first, 'setItems');
    const setOptions = vi.spyOn(first, 'setOptions');

    const nextItems: CodeViewItem<undefined>[] = [
      items[0],
      { id: 'file:readme', type: 'file', file: { name: 'README.md', contents: '# Updated notes\n' }, version: 1 },
    ];
    await screen.rerender({ items: nextItems });
    expect(setItems).toHaveBeenCalledWith(nextItems);
    await expect.poll(() => lines(host, '[data-line]')).toContain('# Updated notes');

    await screen.rerender({ options: { disableLineNumbers: true } });
    expect(setOptions).toHaveBeenCalledTimes(1);
    await expect.poll(() => queryShadow(host, 'pre')[0]?.hasAttribute('data-disable-line-numbers')).toBe(true);
    expect(instance).toBe(first);
  });

  test('selectedLines is applied and onSelectedLinesChange fires on click', async () => {
    let instance: UpstreamCodeView | undefined;
    const onSelectedLinesChange = vi.fn();
    const screen = render(CodeView<undefined>, {
      items: makeItems(),
      style,
      options: { enableLineSelection: true, diffStyle: 'unified' },
      onSelectedLinesChange,
      oninit: (i: UpstreamCodeView) => (instance = i),
    });
    const host = screen.container;
    await waitForRows(host, '[data-line-type="change-addition"]');

    const selection = { id: 'file:readme', range: { start: 1, end: 1 } };
    await screen.rerender({ selectedLines: selection });
    expect(instance!.getSelectedLines()).toEqual(selection);

    await screen.rerender({ selectedLines: undefined });
    instance!.clearSelectedLines({ notify: false });
    onSelectedLinesChange.mockClear();
    const number = queryShadow(host, '[data-column-number="1"]')[0] as HTMLElement;
    await userEvent.click(number);
    await expect.poll(() => onSelectedLinesChange.mock.calls.length).toBeGreaterThan(0);
    expect(onSelectedLinesChange.mock.calls.at(-1)![0]).toMatchObject({ id: 'diff:value' });
  });

  test('unmount calls cleanUp() and mounting 20x does not leak', async () => {
    const cleanUp = vi.spyOn(UpstreamCodeView.prototype, 'cleanUp');
    const observers = trackResizeObservers();
    try {
      for (let i = 0; i < 20; i++) {
        const screen = render(CodeView<undefined>, { items: makeItems(), style });
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
