# diffs-svelte

Svelte 5 wrappers for [`@pierre/diffs`](https://diffs.com/docs). Each component creates and owns the matching vanilla class, so rendering, highlighting and virtualization stay in Pierre's code.

## Usage

Pick the highlighter backend once, in the browser, before the first component renders:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { FileDiff, initHighlighter } from 'diffs-svelte';

  let ready = $state(false);
  onMount(() => {
    initHighlighter({ themes: ['pierre-light', 'pierre-dark'] }).finally(() => (ready = true));
  });

  const oldFile = { name: 'a.ts', contents: 'const a = 1;\n' };
  const newFile = { name: 'a.ts', contents: 'const a = 2;\n' };
</script>

{#if ready}
  <FileDiff {oldFile} {newFile} options={{ diffStyle: 'split' }} />
{/if}
```

`initHighlighter` uses Highlights when `canUseWASM()` is true and falls back to `shiki-js`. The first call wins; later calls return the same promise. Only one backend can be active per page.

## Components

| Component | Wraps | Main props |
| --- | --- | --- |
| `FileDiff` | `FileDiff` | `oldFile`/`newFile` or `fileDiff`, `options`, `lineAnnotations`, `renderAnnotation`, `selectedLines`, `onLineSelected` and the other selection callbacks |
| `File` | `File` | `file`, `options`, `lineAnnotations`, `renderAnnotation`, `selectedLines`, selection callbacks |
| `CodeView` | `CodeView` | `items`, `options`, `selectedLines`, `onSelectedLinesChange` |
| `UnresolvedFile` | `UnresolvedFile` | `file` (read once), `options`, controlled `fileDiff`/`actions`/`markerRows`, annotations, selection |

All of them:

- Expose the instance through `bind:instance` and `oninit(instance)`.
- Take upstream option types unchanged and apply changes with `setOptions()`, never re-creating the instance.
- Are created in `onMount` and disposed with `cleanUp()` on destroy.
- Spread other attributes (`class`, `style`, `data-*`) onto the host element. Upstream renders into Shadow DOM, so style it with CSS custom properties.

`CodeView`'s host element is the scroll root: give it a height and `overflow: auto`. `UnresolvedFile` parses `file` once; wrap it in `{#key}` to show a different file.

## Not yet supported

SSR preload and hydration (`@pierre/diffs/ssr`), and worker pools.

## License

Wraps `@pierre/diffs`, Apache 2.0, by The Pierre Computer Company. This package's license is not decided yet.
