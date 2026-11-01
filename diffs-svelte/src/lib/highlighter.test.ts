import { beforeEach, describe, expect, test, vi } from 'vitest';

// The highlighter module only talks to upstream through these exports, so mock
// them to observe which backend it asks for without loading a real one.
vi.mock('@pierre/diffs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@pierre/diffs')>();
  return {
    ...actual,
    canUseWASM: vi.fn(() => true),
    preloadHighlighter: vi.fn(async () => {}),
  };
});

import * as upstream from '@pierre/diffs';
import * as highlighter from './highlighter.js';

// Browser ESM cannot be re-imported fresh, so reset the module's page-level
// state through its test hook instead.
async function freshModule() {
  highlighter._resetHighlighterForTesting();
  return { upstream, mod: highlighter };
}

describe('initHighlighter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('prefers highlights when canUseWASM() is true', async () => {
    const { upstream, mod } = await freshModule();
    vi.mocked(upstream.canUseWASM).mockReturnValue(true);

    const type = await mod.initHighlighter({ themes: ['pierre-dark'], langs: ['typescript'] });

    expect(type).toBe('highlights');
    expect(upstream.preloadHighlighter).toHaveBeenCalledWith({
      preferredHighlighter: 'highlights',
      themes: ['pierre-dark'],
      langs: ['typescript'],
    });
    expect(mod.getPreferredHighlighter()).toBe('highlights');
  });

  test('falls back to shiki-js when WebAssembly is unavailable', async () => {
    const { upstream, mod } = await freshModule();
    vi.mocked(upstream.canUseWASM).mockReturnValue(false);

    const type = await mod.initHighlighter();

    expect(type).toBe('shiki-js');
    expect(upstream.preloadHighlighter).toHaveBeenCalledWith(
      expect.objectContaining({ preferredHighlighter: 'shiki-js' }),
    );
    expect(mod.getPreferredHighlighter()).toBe('shiki-js');
  });

  test('is idempotent: the first initialization wins', async () => {
    const { upstream, mod } = await freshModule();
    vi.mocked(upstream.canUseWASM).mockReturnValue(true);

    const first = mod.initHighlighter({ themes: ['pierre-light'] });
    const second = mod.initHighlighter({ preferredHighlighter: 'shiki-wasm' });

    expect(second).toBe(first);
    await expect(second).resolves.toBe('highlights');
    expect(upstream.preloadHighlighter).toHaveBeenCalledTimes(1);
    expect(mod.getPreferredHighlighter()).toBe('highlights');
  });

  test('honours an explicit preferredHighlighter on the first call', async () => {
    const { upstream, mod } = await freshModule();

    await expect(mod.initHighlighter({ preferredHighlighter: 'shiki-wasm' })).resolves.toBe('shiki-wasm');
    expect(upstream.canUseWASM).not.toHaveBeenCalled();
  });

  test('getPreferredHighlighter() uses the canUseWASM() default before init', async () => {
    const { upstream, mod } = await freshModule();
    vi.mocked(upstream.canUseWASM).mockReturnValue(false);

    expect(mod.getPreferredHighlighter()).toBe('shiki-js');
    expect(upstream.preloadHighlighter).not.toHaveBeenCalled();
  });
});
