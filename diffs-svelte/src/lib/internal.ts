import type { HighlighterTypes, SelectedLineRange } from '@pierre/diffs';
import { getPreferredHighlighter } from './highlighter.js';

export type SelectionCallback = (range: SelectedLineRange | null) => void;

export interface SelectionCallbacks {
  onLineSelected?: SelectionCallback;
  onLineSelectionStart?: SelectionCallback;
  onLineSelectionChange?: SelectionCallback;
  onLineSelectionEnd?: SelectionCallback;
}

/**
 * Builds stable forwarders for the upstream selection callbacks. Each one calls
 * whatever the component currently holds (the top-level prop, else the same
 * key in `options`), so a parent passing fresh inline functions does not force
 * `setOptions()` and a full re-render.
 */
export function selectionForwarders(
  read: () => { props: SelectionCallbacks; options: SelectionCallbacks | undefined },
): Required<SelectionCallbacks> {
  const make =
    (key: keyof SelectionCallbacks): SelectionCallback =>
    (range) => {
      const { props, options } = read();
      (props[key] ?? options?.[key])?.(range);
    };
  return {
    onLineSelected: make('onLineSelected'),
    onLineSelectionStart: make('onLineSelectionStart'),
    onLineSelectionChange: make('onLineSelectionChange'),
    onLineSelectionEnd: make('onLineSelectionEnd'),
  };
}

/** Browser-only default backend: the explicit option, else the page's choice. */
export function resolveHighlighter(explicit: HighlighterTypes | undefined): HighlighterTypes | undefined {
  if (explicit != null) return explicit;
  return typeof window === 'undefined' ? undefined : getPreferredHighlighter();
}
