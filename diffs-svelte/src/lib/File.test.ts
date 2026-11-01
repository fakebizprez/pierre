import { File as UpstreamFile, type LineAnnotation } from '@pierre/diffs';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import File from './File.svelte';
import { lines, queryShadow, trackResizeObservers, waitForRows } from './test-utils.js';

const file = { name: 'hello.ts', contents: 'const greeting = "hi";\nconsole.log(greeting);\n' };

describe('File', () => {
  test('mounts and renders file contents', async () => {
    const oninit = vi.fn();
    const screen = render(File<undefined>, { file, oninit });

    await waitForRows(screen.container, '[data-line]');
    expect(lines(screen.container, '[data-line]')).toContain('console.log(greeting);');
    expect(oninit.mock.calls[0][0]).toBeInstanceOf(UpstreamFile);
  });

  test('applies option and content changes to the same instance', async () => {
    let instance: UpstreamFile | undefined;
    const screen = render(File<undefined>, { file, oninit: (i: UpstreamFile) => (instance = i) });
    const host = screen.container;
    await waitForRows(host, '[data-line]');
    const first = instance!;
    const setOptions = vi.spyOn(first, 'setOptions');

    await screen.rerender({ options: { disableLineNumbers: true } });
    expect(setOptions).toHaveBeenCalledTimes(1);
    await expect.poll(() => queryShadow(host, 'pre')[0]?.hasAttribute('data-disable-line-numbers')).toBe(true);

    await screen.rerender({ file: { name: 'hello.ts', contents: 'const changed = true;\n' } });
    await expect.poll(() => lines(host, '[data-line]')).toContain('const changed = true;');
    expect(instance).toBe(first);
  });

  test('renders line annotations and fires selection callbacks', async () => {
    const lineAnnotations: LineAnnotation<string>[] = [{ lineNumber: 1, metadata: 'first line' }];
    const onLineSelected = vi.fn();
    const screen = render(File<string>, {
      file,
      lineAnnotations,
      renderAnnotation: (a: LineAnnotation<string>) => {
        const el = document.createElement('span');
        el.className = 'note';
        el.textContent = a.metadata;
        return el;
      },
      options: { enableLineSelection: true },
      onLineSelected,
      selectedLines: { start: 2, end: 2 },
    });

    await expect.poll(() => screen.container.querySelector('.note')?.textContent).toBe('first line');
    await expect.poll(() => onLineSelected.mock.calls.length).toBeGreaterThan(0);
    expect(onLineSelected).toHaveBeenCalledWith({ start: 2, end: 2 });
  });

  test('unmount calls cleanUp() and mounting 20x does not leak', async () => {
    const cleanUp = vi.spyOn(UpstreamFile.prototype, 'cleanUp');
    const observers = trackResizeObservers();
    try {
      for (let i = 0; i < 20; i++) {
        const screen = render(File<undefined>, { file });
        await waitForRows(screen.container, '[data-line]');
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
