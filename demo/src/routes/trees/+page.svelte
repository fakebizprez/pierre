<script lang="ts">
  import {
    FileTree,
    prepareFileTreeInput,
    type FileTreeModel,
    type GitStatusEntry,
  } from 'trees-svelte';

  // Prepare once, outside reactive state: prepared input is the recommended
  // input for real trees, and large inputs should not live in deep $state.
  const preparedInput = prepareFileTreeInput([
    'README.md',
    'package.json',
    'tsconfig.json',
    'src/',
    'src/app.html',
    'src/lib/',
    'src/lib/index.ts',
    'src/lib/components/',
    'src/lib/components/Button.svelte',
    'src/lib/components/Card.svelte',
    'src/lib/components/Dialog.svelte',
    'src/lib/utils/',
    'src/lib/utils/format.ts',
    'src/lib/utils/strings.ts',
    'src/routes/',
    'src/routes/+layout.svelte',
    'src/routes/+page.svelte',
    'src/routes/about/',
    'src/routes/about/+page.svelte',
    'static/',
    'static/favicon.png',
    'tests/',
    'tests/format.test.ts',
  ]);

  const gitStatus: GitStatusEntry[] = [
    { path: 'src/lib/components/Button.svelte', status: 'modified' },
    { path: 'src/lib/utils/strings.ts', status: 'added' },
  ];

  let tree = $state.raw<FileTreeModel>();
  let selectedPaths = $state.raw<readonly string[]>([]);
  let query = $state('');
  let matchCount = $state.raw<number | null>(null);

  // Search is driven through the model, which stays the source of truth.
  function onSearchInput(event: Event & { currentTarget: HTMLInputElement }) {
    query = event.currentTarget.value;
    if (tree == null) return;
    tree.setSearch(query === '' ? null : query);
    matchCount = query === '' ? null : tree.getSearchMatchingPaths().length;
  }
</script>

<h1>trees-svelte</h1>

<label>
  Filter files
  <input type="search" value={query} oninput={onSearchInput} placeholder="Search…" />
</label>
{#if matchCount != null}
  <span data-testid="match-count">{matchCount} {matchCount === 1 ? 'match' : 'matches'}</span>
{/if}

<FileTree
  bind:tree
  {preparedInput}
  {gitStatus}
  initialExpansion="open"
  fileTreeSearchMode="hide-non-matches"
  onSelectionChange={(paths) => (selectedPaths = paths)}
  style="height: 420px; max-width: 360px; --trees-selected-bg-override: #dbeafe; border: 1px solid #ddd;"
/>

<p>Selected: <output data-testid="selected-paths">{selectedPaths.join(', ')}</output></p>
