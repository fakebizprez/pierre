<!--
  Thin wrapper around the vanilla `CodeView` class from `@pierre/diffs`: one
  virtualized scroll region holding many files and diffs. The wrapper's `div`
  is the scroll root, so give it a height and `overflow: auto` (via `class` or
  `style`). The instance is created in `onMount`, updated with `setItems()`,
  `setOptions()` and `setSelectedLines()`, and released with `cleanUp()`.
-->
<script lang="ts" generics="LAnnotation = undefined">
  import {
    areOptionsEqual,
    CodeView,
    type CodeViewItem,
    type CodeViewLineSelection,
    type CodeViewOptions,
  } from '@pierre/diffs';
  import { onMount } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { resolveHighlighter } from './internal.js';

  type Options = CodeViewOptions<LAnnotation, undefined>;

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /**
     * Items with stable `id`s. Pass a new array (from `$state.raw`) to update;
     * the wrapper calls `setItems()`, which reconciles by `id` and `version`.
     */
    items?: readonly CodeViewItem<LAnnotation>[];
    /** Upstream `CodeViewOptions`, passed through unchanged. */
    options?: Options;
    /** Controlled list selection. When set (including `null`), upstream runs with `controlledSelection`. */
    selectedLines?: CodeViewLineSelection | null;
    /** Same as `options.onSelectedLinesChange`. */
    onSelectedLinesChange?: Options['onSelectedLinesChange'];
    /** The upstream instance while mounted. Bind to it for imperative calls (`scrollTo`, `updateItem`, ...). */
    instance?: CodeView<LAnnotation>;
    /** Called once with the upstream instance after setup. */
    oninit?: (instance: CodeView<LAnnotation>) => void;
  }

  let {
    items = [],
    options,
    selectedLines,
    onSelectedLinesChange,
    instance = $bindable(),
    oninit,
    ...rest
  }: Props = $props();

  // Stable forwarder, so fresh inline callbacks do not trigger setOptions().
  const forwardSelectedLinesChange = (selection: CodeViewLineSelection | null) =>
    (onSelectedLinesChange ?? options?.onSelectedLinesChange)?.(selection);

  const mergedOptions: Options = $derived({
    ...options,
    preferredHighlighter: resolveHighlighter(options?.preferredHighlighter),
    controlledSelection: selectedLines !== undefined ? true : options?.controlledSelection,
    onSelectedLinesChange: forwardSelectedLinesChange,
  });

  let root: HTMLDivElement;
  let current: CodeView<LAnnotation> | undefined = $state.raw();
  let appliedOptions: Options | undefined;
  let appliedItems: readonly CodeViewItem<LAnnotation>[] | undefined;

  onMount(() => {
    const created = new CodeView<LAnnotation>(mergedOptions);
    appliedOptions = mergedOptions;
    created.setup(root);
    created.setItems(items);
    appliedItems = items;
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
    if (current == null || areOptionsEqual(appliedOptions, opts)) return;
    appliedOptions = opts;
    current.setOptions(opts);
  });

  $effect(() => {
    const next = items;
    if (current == null || next === appliedItems) return;
    appliedItems = next;
    current.setItems(next);
  });

  $effect(() => {
    const selection = selectedLines;
    if (current == null || selection === undefined) return;
    current.setSelectedLines(selection);
  });
</script>

<div bind:this={root} {...rest}></div>
