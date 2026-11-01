<!--
  Thin wrapper around the vanilla `File` class from `@pierre/diffs`.
  The instance is created in `onMount` (never during SSR), updated in place on
  prop changes, and released with `cleanUp()` on destroy.
-->
<script lang="ts" generics="LAnnotation = undefined">
  import {
    areOptionsEqual,
    EMPTY_LINE_ANNOTATIONS,
    File,
    type FileContents,
    type FileOptions,
    type LineAnnotation,
    type SelectedLineRange,
  } from '@pierre/diffs';
  import { onMount } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { resolveHighlighter, selectionForwarders, type SelectionCallbacks } from './internal.js';

  type Options = FileOptions<LAnnotation, undefined>;

  interface Props extends SelectionCallbacks, Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** The file to render. Pass a `$state.raw` value for large contents. */
    file: FileContents;
    /** Upstream `FileOptions`, passed through unchanged. */
    options?: Options;
    /** Upstream line annotations, rendered by `renderAnnotation`. */
    lineAnnotations?: LineAnnotation<LAnnotation>[];
    /** Controlled selection. When set (including `null`), upstream runs with `controlledSelection`. */
    selectedLines?: SelectedLineRange | null;
    /** Same as `options.renderAnnotation`; returns an element for each annotation. */
    renderAnnotation?: Options['renderAnnotation'];
    /** The upstream instance while mounted. Bind to it for imperative calls. */
    instance?: File<LAnnotation>;
    /** Called once with the upstream instance after the first render. */
    oninit?: (instance: File<LAnnotation>) => void;
  }

  let {
    file,
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
  let current: File<LAnnotation> | undefined = $state.raw();
  let appliedOptions: Options | undefined;

  onMount(() => {
    const created = new File<LAnnotation>(mergedOptions);
    appliedOptions = mergedOptions;
    created.render({ file, lineAnnotations: lineAnnotations ?? EMPTY_LINE_ANNOTATIONS, containerWrapper: host });
    if (selectedLines !== undefined) created.setSelectedLines(selectedLines);
    current = created;
    instance = created;
    oninit?.(created);
    return () => {
      created.cleanUp();
      current = undefined;
      if (instance === created) instance = undefined;
    };
  });

  $effect(() => {
    const opts = mergedOptions;
    const input = { file, lineAnnotations: lineAnnotations ?? EMPTY_LINE_ANNOTATIONS };
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
