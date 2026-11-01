import {
  canUseWASM,
  preloadHighlighter,
  type DiffsThemeNames,
  type HighlighterTypes,
  type SupportedLanguages,
} from '@pierre/diffs';

export interface InitHighlighterOptions {
  /** Themes to preload. Defaults to none (components load what they need). */
  themes?: DiffsThemeNames[];
  /**
   * Languages to preload. Only Shiki loads grammars; Highlights bundles its
   * lexers and ignores this list.
   */
  langs?: SupportedLanguages[];
  /**
   * Overrides the default choice of `'highlights'` when `canUseWASM()` is
   * true, else `'shiki-js'`.
   */
  preferredHighlighter?: HighlighterTypes;
}

let chosen: HighlighterTypes | undefined;
let pending: Promise<HighlighterTypes> | undefined;

/**
 * The backend this page uses: the one chosen by `initHighlighter()`, or, before
 * that, `'highlights'` when `canUseWASM()` is true and `'shiki-js'` otherwise.
 * Browser only.
 */
export function getPreferredHighlighter(): HighlighterTypes {
  return chosen ?? (canUseWASM() ? 'highlights' : 'shiki-js');
}

/**
 * Initializes the shared highlighter once per page. Call it in the browser
 * (for example in `onMount` of the root layout) before any diff component
 * renders. Only one backend can be active per page and the first
 * initialization wins, so later calls return the first call's promise and
 * ignore their options.
 */
export function initHighlighter(options: InitHighlighterOptions = {}): Promise<HighlighterTypes> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('initHighlighter() must run in the browser, not during SSR.'));
  }
  if (pending != null) return pending;
  const type = options.preferredHighlighter ?? getPreferredHighlighter();
  chosen = type;
  pending = preloadHighlighter({
    preferredHighlighter: type,
    themes: options.themes ?? [],
    langs: options.langs ?? [],
  }).then(() => type);
  return pending;
}

/** @internal Test hook: forget the page-level choice. Not exported from the package. */
export function _resetHighlighterForTesting(): void {
  chosen = undefined;
  pending = undefined;
}
