export { default as CodeView } from './CodeView.svelte';
export { default as File } from './File.svelte';
export { default as FileDiff } from './FileDiff.svelte';
export { default as UnresolvedFile } from './UnresolvedFile.svelte';
export { getPreferredHighlighter, initHighlighter, type InitHighlighterOptions } from './highlighter.js';

// Upstream types used by the components' props, re-exported unchanged.
export type {
  CodeViewItem,
  CodeViewLineSelection,
  CodeViewOptions,
  CodeViewScrollTarget,
  DiffLineAnnotation,
  DiffsThemeNames,
  FileContents,
  FileDiffMetadata,
  FileDiffOptions,
  FileOptions,
  HighlighterTypes,
  LineAnnotation,
  MergeConflictActionPayload,
  MergeConflictMarkerRow,
  SelectedLineRange,
  SupportedLanguages,
  ThemesType,
  ThemeTypes,
  UnresolvedFileOptions,
} from '@pierre/diffs';

// Upstream instance types, for `bind:instance` / `oninit`.
export type {
  CodeView as CodeViewInstance,
  File as FileInstance,
  FileDiff as FileDiffInstance,
  UnresolvedFile as UnresolvedFileInstance,
} from '@pierre/diffs';
