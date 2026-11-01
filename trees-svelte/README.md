# trees-svelte

Svelte 5 wrapper for [`@pierre/trees`](https://trees.software/docs). The component creates and owns a vanilla `FileTree`, so rendering and virtualization stay in Pierre's code.

## Usage

```svelte
<script lang="ts">
  import { FileTree, prepareFileTreeInput, type FileTreeModel } from 'trees-svelte';

  let paths = $state.raw(['README.md', 'src/index.ts', 'src/lib/util.ts']);
  let preparedInput = $derived(prepareFileTreeInput(paths));
  let tree = $state<FileTreeModel>();
</script>

<FileTree
  bind:tree
  {preparedInput}
  initialExpansion="open"
  search
  onSelectionChange={(selected) => console.log(selected)}
  style="height: 400px"
/>
```

## Props

Every upstream `FileTreeOptions` field, with the upstream name and type, plus:

| Prop | Purpose |
| --- | --- |
| `tree` (bindable) | The upstream `FileTree` instance, set on mount and cleared on destroy |
| `oninit(tree)` | Called once after the tree is created and rendered |
| `class` | Class for the element the tree renders into |
| `style` | CSS text or a style object. Accepts `themeToTreeStyles(theme)` output directly |

## Behavior

- The tree is created in `onMount`, never during SSR, and released with `cleanUp()` on destroy.
- After mount, `paths` / `preparedInput`, `gitStatus`, `icons` and `composition` update through `resetPaths`, `setGitStatus`, `setIcons` and `setComposition`. The instance is never re-created. Setters run when the prop's reference changes, so replace arrays (use `$state.raw`) instead of mutating them.
- `onSelectionChange` and `onSearchChange` can be swapped after mount.
- Every other option is read once at construction, as upstream does. For selection, focus and search after mount, use the instance (`getItem(path).select()`, `setSearch()`, `subscribe()`).
- Upstream renders into Shadow DOM. Style it with the `--trees-*` CSS custom properties on `style`.
- Use `paths` only for small trees. Use `prepareFileTreeInput()` or `preparePresortedFileTreeInput()` for real ones.

## Not yet supported

SSR preload and hydration (`@pierre/trees/ssr`).

## License

Wraps `@pierre/trees`, Apache 2.0, by The Pierre Computer Company. This package's license is not decided yet.
