<!--
  Thin wrapper around the vanilla `UnresolvedFile` class from `@pierre/diffs`.
  The instance is created in `onMount` (never during SSR), updated in place on
  prop changes, and released with `cleanUp()` on destroy.

  Like upstream, `file` only initializes the conflict state: upstream parses it
  once and keeps resolutions in its own cache. To show a different file, wrap
  the component in `{#key file}`. For controlled mode, set
  `options.onMergeConflictAction` and pass `fileDiff`, `actions` and
  `markerRows` together (for example from `instance.resolveConflict()`).
-->
<script lang="ts" generics="LAnnotation = undefined">
  import {
    areOptionsEqual,
    EMPTY_LINE_ANNOTATIONS,
    UnresolvedFile,
    type DiffLineAnnotation,
    type FileContents,
    type FileDiffMetadata,
    type MergeConflictMarkerRow,
    type SelectedLineRange,
    type UnresolvedFileOptions,
    type UnresolvedFileRenderProps,
  } from '@pierre/diffs';
  import { onMount } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { resolveHighlighter, selectionForwarders, type SelectionCallbacks } from './internal.js';

  type Options = UnresolvedFileOptions<LAnnotation>;

  interface Props extends SelectionCallbacks, Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** File containing merge conflict markers. Read once, at mount. */
    file?: FileContents;
    /** Controlled mode: diff metadata, passed together with `actions` and `markerRows`. */
    fileDiff?: FileDiffMetadata;
    /** Controlled mode: conflict actions. */
    actions?: UnresolvedFileRenderProps<LAnnotation>['actions'];
    /** Controlled mode: marker rows. */
    markerRows?: MergeConflictMarkerRow[];
    /** Upstream `UnresolvedFileOptions`, passed through unchanged. */
    options?: Options;
    /** Upstream line annotations, rendered by `renderAnnotation`. */
    lineAnnotations?: DiffLineAnnotation<LAnnotation>[];
    /** Controlled selection. When set (including `null`), upstream runs with `controlledSelection`. */
    selectedLines?: SelectedLineRange | null;
    /** Same as `options.renderAnnotation`; returns an element for each annotation. */
    renderAnnotation?: Options['renderAnnotation'];
    /** The upstream instance while mounted. Bind to it for imperative calls. */
    instance?: UnresolvedFile<LAnnotation>;
    /** Called once with the upstream instance after the first render. */
    oninit?: (instance: UnresolvedFile<LAnnotation>) => void;
  }

  let {
    file,
    fileDiff,
    actions,
    markerRows,
    options,
    lineAnnotations,
    selectedLines,
    renderAnnotation,
    onLineSelected,
    onLineSelectionStart,
    onLineSelectionChange,
    onLineSelectionEnd,
    instance = $bindable(),
    oninit,
    ...rest
  }: Props = $props();

  const forwarders = selectionForwarders(() => ({
    props: { onLineSelected, onLineSelectionStart, onLineSelectionChange, onLineSelectionEnd },
    options,
  }));

  const mergedOptions: Options = $derived({
    ...options,
    preferredHighlighter: resolveHighlighter(options?.preferredHighlighter),
    controlledSelection: selectedLines !== undefined ? true : options?.controlledSelection,
    renderAnnotation: renderAnnotation ?? options?.renderAnnotation,
    ...forwarders,
  });

  let host: HTMLDivElement;
  let current: UnresolvedFile<LAnnotation> | undefined = $state.raw();
  let appliedOptions: Options | undefined;

  onMount(() => {
    const created = new UnresolvedFile<LAnnotation>(mergedOptions);
    appliedOptions = mergedOptions;
    created.render({
      file,
      fileDiff,
      actions,
      markerRows,
      lineAnnotations: lineAnnotations ?? EMPTY_LINE_ANNOTATIONS,
      containerWrapper: host,
    });
    if (selectedLines !== undefined) created.setSelectedLines(selectedLines);
    current = created;
    instance = created;
    const release = () => {
      created.cleanUp();
      current = undefined;
      if (instance === created) instance = undefined;
    };
    try {
      oninit?.(created);
    } catch (error) {
      release();
      throw error;
    }
    return release;
  });

  $effect(() => {
    const opts = mergedOptions;
    // `file` is deliberately not passed again: upstream keeps resolved state in
    // its own cache and rejects a second, different initial file.
    const input = { fileDiff, actions, markerRows, lineAnnotations: lineAnnotations ?? EMPTY_LINE_ANNOTATIONS };
    const target = current;
    if (target == null) return;
    let forceRender = false;
    if (!areOptionsEqual(appliedOptions, opts)) {
      target.setOptions(opts);
      appliedOptions = opts;
      forceRender = true;
    }
    target.render({ ...input, forceRender, containerWrapper: host });
  });

  $effect(() => {
    const range = selectedLines;
    if (current == null || range === undefined) return;
    current.setSelectedLines(range);
  });
</script>

<div bind:this={host} {...rest}></div>
