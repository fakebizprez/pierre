import {
  FileTree as FileTreeModel,
  prepareFileTreeInput,
  preparePresortedFileTreeInput,
  themeToTreeStyles,
  type FileTreeRowDecorationContext,
} from '@pierre/trees';
import { afterEach, expect, test, vi } from 'vitest';
import { page } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-svelte';
import BindTreeHarness from '../test/BindTreeHarness.svelte';
import FileTree from './FileTree.svelte';

afterEach(() => cleanup());

const PATHS = ['README.md', 'src/', 'src/index.ts', 'src/lib/', 'src/lib/util.ts'];

test('mounts and renders rows inside the shadow root', async () => {
  await render(FileTree, {
    paths: PATHS,
    initialExpansion: 'open',
    style: 'height: 300px',
  });

  await expect.element(page.getByRole('treeitem', { name: 'README.md' })).toBeInTheDocument();
  await expect.element(page.getByRole('treeitem', { name: 'index.ts' })).toBeInTheDocument();
  expect(document.querySelectorAll('file-tree-container')).toHaveLength(1);
});

test('exposes the upstream instance through oninit', async () => {
  let tree: FileTreeModel | undefined;
  await render(FileTree, {
    paths: PATHS,
    style: 'height: 300px',
    oninit: (instance: FileTreeModel) => {
      tree = instance;
    },
  });
  expect(tree).toBeInstanceOf(FileTreeModel);
  expect(tree?.getItem('README.md')?.getPath()).toBe('README.md');
});

test('updating paths calls resetPaths on the same instance', async () => {
  const instances: FileTreeModel[] = [];
  const { rerender } = await render(FileTree, {
    paths: PATHS,
    initialExpansion: 'open',
    style: 'height: 300px',
    oninit: (instance: FileTreeModel) => {
      instances.push(instance);
      vi.spyOn(instance, 'resetPaths');
    },
  });
  const tree = instances[0];

  await rerender({ paths: ['CHANGELOG.md', 'docs/', 'docs/guide.md'] });

  expect(instances).toHaveLength(1);
  expect(tree.resetPaths).toHaveBeenCalledTimes(1);
  expect(tree.resetPaths).toHaveBeenCalledWith(['CHANGELOG.md', 'docs/', 'docs/guide.md']);
  await expect.element(page.getByRole('treeitem', { name: 'CHANGELOG.md' })).toBeInTheDocument();
  await expect.element(page.getByRole('treeitem', { name: 'README.md' })).not.toBeInTheDocument();
});

test('onSelectionChange fires when a row is clicked', async () => {
  const onSelectionChange = vi.fn();
  await render(FileTree, {
    paths: PATHS,
    initialExpansion: 'open',
    style: 'height: 300px',
    onSelectionChange,
  });

  await page.getByRole('treeitem', { name: 'README.md' }).click();

  await expect.poll(() => onSelectionChange.mock.calls.at(-1)?.[0]).toEqual(['README.md']);
});

test('a replaced onSelectionChange prop is used without re-creating the tree', async () => {
  const first = vi.fn();
  const second = vi.fn();
  const instances: FileTreeModel[] = [];
  const { rerender } = await render(FileTree, {
    paths: PATHS,
    style: 'height: 300px',
    oninit: (instance: FileTreeModel) => instances.push(instance),
  });

  await rerender({ onSelectionChange: first });
  await rerender({ onSelectionChange: second });
  instances[0].getItem('README.md')?.select();

  await expect.poll(() => second.mock.calls.at(-1)?.[0]).toEqual(['README.md']);
  expect(first).not.toHaveBeenCalled();
  expect(instances).toHaveLength(1);
});

test('onSearchChange fires when search is set through the model', async () => {
  const onSearchChange = vi.fn();
  let tree: FileTreeModel | undefined;
  await render(FileTree, {
    paths: PATHS,
    search: true,
    style: 'height: 300px',
    onSearchChange,
    oninit: (instance: FileTreeModel) => {
      tree = instance;
    },
  });

  tree?.setSearch('util');

  expect(onSearchChange).toHaveBeenLastCalledWith('util');
  expect(tree?.getSearchMatchingPaths()).toContain('src/lib/util.ts');
});

test('unmount calls cleanUp and clears the bound instance', async () => {
  const instances: FileTreeModel[] = [];
  const { unmount } = await render(FileTree, {
    paths: PATHS,
    style: 'height: 300px',
    oninit: (instance: FileTreeModel) => {
      instances.push(instance);
      vi.spyOn(instance, 'cleanUp');
    },
  });
  const host = instances[0].getFileTreeContainer();
  expect(host?.isConnected).toBe(true);

  await unmount();

  expect(instances[0].cleanUp).toHaveBeenCalledTimes(1);
  expect(instances[0].getFileTreeContainer()).toBeUndefined();
  expect(host?.isConnected).toBe(false);
  expect(host?.shadowRoot?.querySelector('[role="treeitem"]')).toBeNull();
});

test('mounting and unmounting 20 times leaves no instance or host behind', async () => {
  const cleanUp = vi.spyOn(FileTreeModel.prototype, 'cleanUp');
  const instances = new Set<FileTreeModel>();
  for (let i = 0; i < 20; i++) {
    const { unmount } = await render(FileTree, {
      paths: PATHS,
      style: 'height: 300px',
      oninit: (instance: FileTreeModel) => instances.add(instance),
    });
    await expect.element(page.getByRole('treeitem', { name: 'README.md' })).toBeInTheDocument();
    await unmount();
  }
  expect(instances.size).toBe(20);
  expect(cleanUp).toHaveBeenCalledTimes(20);
  for (const instance of instances) expect(instance.getFileTreeContainer()).toBeUndefined();
  expect(document.querySelectorAll('file-tree-container')).toHaveLength(0);
  cleanUp.mockRestore();
});

test('bind:tree exposes the instance and clears it on destroy', async () => {
  const seen: (FileTreeModel | undefined)[] = [];
  const { rerender } = await render(BindTreeHarness, {
    paths: PATHS,
    ontree: (tree: FileTreeModel | undefined) => seen.push(tree),
  });
  await expect.poll(() => seen.at(-1)).toBeInstanceOf(FileTreeModel);

  await rerender({ show: false });

  await expect.poll(() => seen.length > 0 && seen.at(-1) === undefined).toBe(true);
});

test('renders from prepareFileTreeInput and resets with new prepared input', async () => {
  const instances: FileTreeModel[] = [];
  const { rerender } = await render(FileTree, {
    preparedInput: prepareFileTreeInput(PATHS),
    initialExpansion: 'open',
    style: 'height: 300px',
    oninit: (instance: FileTreeModel) => {
      instances.push(instance);
      vi.spyOn(instance, 'resetPaths');
    },
  });
  await expect.element(page.getByRole('treeitem', { name: 'util.ts' })).toBeInTheDocument();

  const next = preparePresortedFileTreeInput(['a/', 'a/b.ts', 'z.md']);
  await rerender({ preparedInput: next });

  expect(instances).toHaveLength(1);
  expect(instances[0].resetPaths).toHaveBeenCalledTimes(1);
  expect(instances[0].resetPaths).toHaveBeenCalledWith({ preparedInput: next });
  await expect.element(page.getByRole('treeitem', { name: 'z.md' })).toBeInTheDocument();
  await expect.element(page.getByRole('treeitem', { name: 'util.ts' })).not.toBeInTheDocument();
});

function hostOf(tree: FileTreeModel): HTMLElement {
  const host = tree.getFileTreeContainer();
  if (host == null) throw new Error('tree is not mounted');
  return host;
}

test('gitStatus updates go through setGitStatus', async () => {
  const instances: FileTreeModel[] = [];
  const { rerender } = await render(FileTree, {
    paths: PATHS,
    initialExpansion: 'open',
    style: 'height: 300px',
    gitStatus: [{ path: 'README.md', status: 'modified' }],
    oninit: (instance: FileTreeModel) => {
      instances.push(instance);
      vi.spyOn(instance, 'setGitStatus');
    },
  });
  const tree = instances[0];
  const row = (path: string) =>
    hostOf(tree).shadowRoot?.querySelector(`[role="treeitem"][data-item-path="${path}"]`);
  await expect.poll(() => row('README.md')?.getAttribute('data-item-git-status')).toBe('modified');

  const next = [{ path: 'src/index.ts', status: 'added' as const }];
  await rerender({ gitStatus: next });

  expect(instances).toHaveLength(1);
  expect(tree.setGitStatus).toHaveBeenCalledTimes(1);
  expect(tree.setGitStatus).toHaveBeenCalledWith(next);
  await expect.poll(() => row('src/index.ts')?.getAttribute('data-item-git-status')).toBe('added');
  await expect.poll(() => row('README.md')?.hasAttribute('data-item-git-status')).toBe(false);
});

test('icons and composition updates go through their setters', async () => {
  const instances: FileTreeModel[] = [];
  const { rerender } = await render(FileTree, {
    paths: PATHS,
    style: 'height: 300px',
    oninit: (instance: FileTreeModel) => {
      instances.push(instance);
      vi.spyOn(instance, 'setIcons');
      vi.spyOn(instance, 'setComposition');
    },
  });
  const tree = instances[0];

  await rerender({ icons: 'complete' });
  const composition = { header: { html: '<strong>Files</strong>' } };
  await rerender({ composition });

  expect(instances).toHaveLength(1);
  expect(tree.setIcons).toHaveBeenCalledTimes(1);
  expect(tree.setIcons).toHaveBeenCalledWith('complete');
  expect(tree.setComposition).toHaveBeenCalledTimes(1);
  expect(tree.setComposition).toHaveBeenCalledWith(composition);
  expect(tree.getComposition()).toEqual(composition);
});

test('renderRowDecoration output appears in the row', async () => {
  await render(FileTree, {
    paths: PATHS,
    style: 'height: 300px',
    renderRowDecoration: ({ item }: FileTreeRowDecorationContext) =>
      item.path === 'README.md' ? { text: 'docs' } : null,
  });

  await expect
    .element(page.getByRole('treeitem', { name: 'README.md' }))
    .toHaveTextContent('docs');
});

test('style accepts themeToTreeStyles output and the CSS variables reach the host', async () => {
  let tree: FileTreeModel | undefined;
  const dark = themeToTreeStyles({
    type: 'dark',
    colors: { 'sideBar.background': '#101820', 'sideBar.foreground': '#e0e0e0' },
  });
  const { rerender } = await render(FileTree, {
    paths: PATHS,
    style: { height: '300px', ...dark },
    oninit: (instance: FileTreeModel) => {
      tree = instance;
    },
  });
  const host = () => getComputedStyle(hostOf(tree!));
  expect(host().getPropertyValue('--trees-theme-sidebar-bg').trim()).toBe('#101820');
  expect(hostOf(tree!).getBoundingClientRect().height).toBe(300);

  const light = themeToTreeStyles({ type: 'light', colors: { 'sideBar.background': '#fafafa' } });
  await rerender({ style: { height: '300px', ...light } });
  expect(host().getPropertyValue('--trees-theme-sidebar-bg').trim()).toBe('#fafafa');
});
