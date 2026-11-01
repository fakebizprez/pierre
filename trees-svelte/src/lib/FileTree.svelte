<script lang="ts">
  import { FileTree, type FileTreeOptions } from '@pierre/trees';
  import { onMount } from 'svelte';
  import { treeStylesToCssText } from './styles.js';
  import type { FileTreeProps } from './types.js';

  let {
    tree = $bindable(),
    oninit,
    class: className,
    style,
    ...options
  }: FileTreeProps = $props();

  let container: HTMLDivElement;
  let instance: FileTree | undefined;
  // The values the instance currently reflects, so effects only call a setter
  // when a prop actually changed after construction.
  let applied: Pick<
    FileTreeOptions,
    'paths' | 'preparedInput' | 'gitStatus' | 'icons' | 'composition'
  > = {};

  onMount(() => {
    const initial = {
      ...options,
      // Upstream reads callbacks once at construction. Route them through
      // closures so a callback prop replaced later is still the one called.
      onSelectionChange: (paths) => options.onSelectionChange?.(paths),
      onSearchChange: (value) => options.onSearchChange?.(value),
    } as FileTreeOptions;
    applied = {
      paths: initial.paths,
      preparedInput: initial.preparedInput,
      gitStatus: initial.gitStatus,
      icons: initial.icons,
      composition: initial.composition,
    };
    instance = new FileTree(initial);
    instance.render({ containerWrapper: container });
    tree = instance;
    oninit?.(instance);
    return () => {
      instance?.cleanUp();
      instance = undefined;
      tree = undefined;
    };
  });

  $effect(() => {
    const paths = options.paths;
    const preparedInput = options.preparedInput;
    if (instance == null) return;
    if (paths === applied.paths && preparedInput === applied.preparedInput) return;
    applied.paths = paths;
    applied.preparedInput = preparedInput;
    if (preparedInput != null) instance.resetPaths({ preparedInput });
    else instance.resetPaths(paths ?? []);
  });

  $effect(() => {
    const gitStatus = options.gitStatus;
    if (instance == null || gitStatus === applied.gitStatus) return;
    applied.gitStatus = gitStatus;
    instance.setGitStatus(gitStatus);
  });

  $effect(() => {
    const icons = options.icons;
    if (instance == null || icons === applied.icons) return;
    applied.icons = icons;
    instance.setIcons(icons);
  });

  $effect(() => {
    const composition = options.composition;
    if (instance == null || composition === applied.composition) return;
    applied.composition = composition;
    instance.setComposition(composition);
  });
</script>

<div bind:this={container} class={className} style={treeStylesToCssText(style)}></div>
