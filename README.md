# pierre-svelte

Svelte 5 wrappers for Pierre's open-source `@pierre/diffs` and `@pierre/trees` libraries.

| Package | Wraps | Purpose |
| --- | --- | --- |
| [`diffs-svelte`](./diffs-svelte) | [`@pierre/diffs`](https://diffs.com/docs) | Render syntax-highlighted files, diffs, patches and merge conflicts |
| [`trees-svelte`](./trees-svelte) | [`@pierre/trees`](https://trees.software/docs) | Render an interactive, virtualized file tree |

## Status

Early scaffolding. The package folders do not contain source yet, and nothing is published.

## Approach

These are thin wrappers, not ports. Each package is a set of Svelte components that create and own an instance of the vanilla Pierre API, expose its options as props, and tear it down when the component is destroyed. Rendering, virtualization and highlighting stay inside Pierre's code, so upstream fixes and performance work arrive through a normal dependency update.

Pierre ships first-class wrappers only for React. For other frameworks its docs recommend the vanilla API, with the framework owning the lifecycle. That is what this repo does for Svelte.

## Planned scope

**diffs-svelte**
- `FileDiff`, `File`, `CodeView` and `UnresolvedFile` components over the vanilla classes
- Reactive options, with imperative updates instead of re-creating instances
- Highlighter selection with a `canUseWASM()` fallback from `highlights` to `shiki-js`
- Line annotations and selection exposed as props and callbacks
- SvelteKit-safe loading (client-only initialization, optional SSR preload)

**trees-svelte**
- A `FileTree` component over the vanilla `FileTree` class
- Prepared or presorted input for large trees
- Selection, focus, search, git status and row decorations exposed through props and callbacks
- Theming through CSS variables and `themeToTreeStyles()`

## Requirements

- Svelte 5 and TypeScript
- A runtime with a modern WebKit or Chromium engine. The current Pierre styles target Chrome/Edge 123+, Safari 17.5+ and Firefox 125+.
- Bun as the package manager

## Upstream

- Diffs docs: https://diffs.com/docs (full reference for LLMs: https://diffs.com/llms-full.txt)
- Trees docs: https://trees.software/docs (full reference for LLMs: https://trees.software/llms-full.txt)
- Source: https://github.com/pierrecomputer/pierre

Both upstream libraries are licensed under Apache 2.0 and are maintained by The Pierre Computer Company. Trees is in beta, and Highlights (the optional faster highlighting backend in Diffs) is in beta. Expect API changes upstream.

## License

To be decided. Upstream notices must be preserved wherever Pierre code or text is redistributed.
