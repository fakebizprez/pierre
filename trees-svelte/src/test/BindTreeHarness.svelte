<script lang="ts">
  import type { FileTree as FileTreeModel } from '@pierre/trees';
  import FileTree from '../lib/FileTree.svelte';

  let {
    show = true,
    paths,
    ontree,
  }: {
    show?: boolean;
    paths: readonly string[];
    ontree: (tree: FileTreeModel | undefined) => void;
  } = $props();

  let tree = $state.raw<FileTreeModel>();

  $effect(() => ontree(tree));
</script>

{#if show}
  <FileTree bind:tree {paths} style="height: 300px" />
{/if}
