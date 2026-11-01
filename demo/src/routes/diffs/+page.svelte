<script lang="ts">
  import { onMount } from 'svelte';
  import { File, FileDiff, initHighlighter, type FileContents } from 'diffs-svelte';

  // Small inputs: plain constants. For large ones, use $state.raw.
  const oldFile: FileContents = {
    name: 'greet.ts',
    lang: 'typescript',
    contents: "export function greet(name: string) {\n  return 'Hello, ' + name;\n}\n",
  };
  const newFile: FileContents = {
    name: 'greet.ts',
    lang: 'typescript',
    contents: 'export function greet(name: string) {\n  return `Hello, ${name}!`;\n}\n',
  };
  const readme: FileContents = {
    name: 'README.md',
    contents: '# diffs-svelte\n\nA thin Svelte 5 wrapper around @pierre/diffs.\n',
  };

  let diffStyle = $state<'split' | 'unified'>('split');
  let ready = $state(false);

  onMount(() => {
    // Pick the backend once, in the browser, before any component renders.
    initHighlighter({ themes: ['pierre-light', 'pierre-dark'] }).finally(() => (ready = true));
  });
</script>

<h1>diffs-svelte</h1>

<label>
  <input
    type="checkbox"
    checked={diffStyle === 'unified'}
    onchange={(e) => (diffStyle = e.currentTarget.checked ? 'unified' : 'split')}
  />
  Unified
</label>

{#if ready}
  <h2>FileDiff</h2>
  <FileDiff data-testid="file-diff" {oldFile} {newFile} options={{ diffStyle, enableLineSelection: true }} />

  <h2>File</h2>
  <File data-testid="file" file={readme} />
{/if}
