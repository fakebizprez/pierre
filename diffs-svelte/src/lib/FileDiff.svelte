<!--
  Thin wrapper around the vanilla `FileDiff` class from `@pierre/diffs`.
  The instance is created in `onMount` (never during SSR), updated in place on
  prop changes, and released with `cleanUp()` on destroy.
-->
<script lang="ts" generics="LAnnotation = undefined">
  import {
    areOptionsEqual,
    EMPTY_LINE_ANNOTATIONS,
    FileDiff,
    type DiffFileInput,
    type DiffLineAnnotation,
    type FileContents,
    type FileDiffMetadata,
    type FileDiffOptions,
    type MaybeDiffFileInput,
    type SelectedLineRange,
  } from '@pierre/diffs';
  import { onMount } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { resolveHighlighter, selectionForwarders, type SelectionCallbacks } from './internal.js';

  type Options = FileDiffOptions<LAnnotation, undefined>;

  interface Props extends SelectionCallbacks, Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** Pre-parsed diff metadata. Takes precedence over `oldFile`/`newFile`. Pass a `$state.raw` value. */
    fileDiff?: FileDiffMetadata;
    /** Old side of a file pair; upstream parses the pair. `null` for an added file. */
    oldFile?: FileContents | null;
    /** New side of a file pair. `null` for a deleted file. */
    newFile?: FileContents | null;
    /** Upstream `FileDiffOptions`, passed through unchanged. */
    options?: Options;
    /** Upstream line annotations, rendered by `renderAnnotation`. */
    lineAnnotations?: DiffLineAnnotation<LAnnotation>[];
    /** Controlled selection. When set (including `null`), upstream runs with `controlledSelection`. */
    selectedLines?: SelectedLineRange | null;
    /** Same as `options.renderAnnotation`; returns an element for each annotation. */
    renderAnnotation?: Options['renderAnnotation'];
    /** The upstream instance while mounted. Bind to it for imperative calls. */
    instance?: FileDiff<LAnnotation>;
    /** Called once with the upstream instance after the first render. */
    oninit?: (instance: FileDiff<LAnnotation>) => void;
  }

  let {
    fileDiff,
    oldFile,
    newFile,
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

  const fileInput: MaybeDiffFileInput = $derived(
    fileDiff == null && (oldFile != null || newFile != null)
      ? ({ oldFile: oldFile ?? null, newFile: newFile ?? null } as DiffFileInput)
      : {},
  );

  let host: HTMLDivElement;
  let current: FileDiff<LAnnotation> | undefined = $state.raw();
  let appliedOptions: Options | undefined;

  onMount(() => {
    const created = new FileDiff<LAnnotation>(mergedOptions);
    appliedOptions = mergedOptions;
    created.render({
      fileDiff,
      ...fileInput,
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

  // Options, data and annotations: one imperative render, as upstream expects.
  $effect(() => {
    const opts = mergedOptions;
    const input = { fileDiff, ...fileInput, lineAnnotations: lineAnnotations ?? EMPTY_LINE_ANNOTATIONS };
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
