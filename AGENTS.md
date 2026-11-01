# AGENTS.md

Guidance for AI coding agents working in this repository.

## What this repo is

Two Svelte 5 wrapper packages around Pierre's vanilla libraries:

- `diffs-svelte/` wraps `@pierre/diffs`
- `trees-svelte/` wraps `@pierre/trees`

They are thin wrappers, not ports. Do not re-implement rendering, virtualization, diffing, tokenization or highlighting. If a feature exists in the upstream vanilla API, call it.

## Read the upstream skills first

Full API references are installed locally:

- `.agents/skills/diffs/SKILL.md` and `.agents/skills/diffs/references/*`
- `.agents/skills/trees/SKILL.md` and `.agents/skills/trees/references/*`

Start with `recipe-vanilla.md` in each skill, then the relevant `api-*.md`. Do not rely on memory for API names, since both libraries change quickly. Trees and the Highlights backend are in beta.

Live docs: https://diffs.com/docs and https://trees.software/docs. Upstream source: https://github.com/pierrecomputer/pierre.

## Stack and tooling

- Svelte 5 (runes), TypeScript, SvelteKit for demos and tests
- Bun is the package manager: `bun add`, `bun install`, `bun run`. Do not use pnpm or npm in this repo.
- Do not add React. Use the vanilla entry points (`@pierre/diffs`, `@pierre/trees`), never the `/react` entries.

## Wrapper rules

1. **Lifecycle.** The component owns the upstream instance. Create it in `onMount` (or a Svelte action), never during SSR. Release it on destroy: `cleanUp()` for CodeView and Trees (`unmount()` only removes the UI and keeps the model), plus the dispose call each Diffs component documents.
2. **Reactivity.**
   - Use `$state.raw` or plain variables for large inputs (diff metadata, file contents, path arrays). Do not put them in deep `$state`.
   - Apply prop changes through the upstream setters (`setItems`, `updateItem`, `resetPaths`, and similar). Do not destroy and re-create the instance on each change.
3. **Model is the source of truth.** For Trees, read and write selection, focus and search through the model, never by reading the DOM.
4. **Shadow DOM.** Upstream renders into Shadow DOM. Svelte scoped or global styles do not reach inside it. Style through the documented CSS custom properties (and `unsafeCSS` only as an escape hatch).
5. **Highlighter.**
   - Default to `preferredHighlighter: 'highlights'` guarded by `canUseWASM()`, falling back to `'shiki-js'`.
   - Run the check in the browser, not on the server.
   - Only one backend can be active per page, and the first initialization wins. Initialize once, before any component renders, and never switch backends without disposing every instance.
   - Do not use a worker pool with Highlights unless measured. Custom TextMate themes and grammars require Shiki. Zed themes require Highlights.
   - Highlights does not detect language. Pass it explicitly, and validate with `isSupportedLanguage()` since unsupported names throw `RangeError`.
6. **Trees input.** Use `paths` only for small demos. Use `prepareFileTreeInput()` or `preparePresortedFileTreeInput()` for real trees.
7. **SSR.** The upstream preload helpers use declarative shadow DOM. Do not inject the preloaded HTML as an arbitrary string or hand-roll DOM diffing. Follow each library's preload and hydrate contract, and keep server and client options identical. If SSR is not required for a task, skip it.
8. **Expose, don't hide.** Wrappers should pass through upstream options and callbacks with the same names and types, using upstream types directly. Avoid inventing a parallel option vocabulary.

## Compatibility

Current upstream styles use `light-dark()`, `color-mix()` and `@layer`, so the minimum engines are Chrome/Edge 123+, Safari 17.5+ and Firefox 125+. Highlights additionally needs WebAssembly SIMD (Safari 16.4+) and a CSP that permits WebAssembly. Do not add polyfills or lower the floor.

## Licensing

Upstream is Apache 2.0. Preserve upstream license and NOTICE files wherever upstream code or text is copied, and mark any modified files. Never copy upstream source into this repo when a dependency import will do.

## Testing and verification

- Test in a real browser engine, not only jsdom. Shadow DOM, ResizeObserver and virtualization behavior must be exercised for real.
- Check cleanup: mounting and unmounting a component repeatedly must not leak observers or instances.
- For performance claims, measure with a large diff and a large tree. Upstream's benchmark figures are vendor-stated, not independent.
- Run type checks and tests before reporting a task as done. State what you ran and what you could not run.

## Working style

- Keep changes small and scoped to the package you were asked to change.
- Prefer the upstream vanilla API's behavior over cleverness. When docs and installed references disagree, say so and ask.
- Do not commit generated build output or `node_modules`.
