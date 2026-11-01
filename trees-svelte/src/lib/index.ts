export { default as FileTree } from './FileTree.svelte';
export type { FileTreeProps } from './types.js';
export { treeStylesToCssText } from './styles.js';

// Upstream runtime helpers. The upstream class is re-exported as `FileTreeModel`
// so it does not clash with the component name.
export {
  FileTree as FileTreeModel,
  FILE_TREE_DEFAULT_ITEM_HEIGHT,
  FILE_TREE_DENSITY_PRESETS,
  createFileTreeIconResolver,
  getBuiltInSpriteSheet,
  prepareFileTreeInput,
  preparePresortedFileTreeInput,
  themeToTreeStyles,
} from '@pierre/trees';

export type {
  ContextMenuItem,
  ContextMenuOpenContext,
  FileTreeBatchOperation,
  FileTreeBuiltInIconSet,
  FileTreeCompositionOptions,
  FileTreeDensity,
  FileTreeDirectoryHandle,
  FileTreeDragAndDropConfig,
  FileTreeDropContext,
  FileTreeDropResult,
  FileTreeFileHandle,
  FileTreeGitStatusPatch,
  FileTreeIconConfig,
  FileTreeIcons,
  FileTreeInitialExpansion,
  FileTreeItemHandle,
  FileTreeListener,
  FileTreeMutationEvent,
  FileTreeOptions,
  FileTreePreparedInput,
  FileTreeRenameEvent,
  FileTreeRenamingConfig,
  FileTreeRenderOptions,
  FileTreeResetOptions,
  FileTreeRowDecoration,
  FileTreeRowDecorationContext,
  FileTreeRowDecorationRenderer,
  FileTreeScrollToPathOptions,
  FileTreeSearchBlurBehavior,
  FileTreeSearchChangeListener,
  FileTreeSearchMode,
  FileTreeSelectionChangeListener,
  FileTreeSortComparator,
  FileTreeVisibleRow,
  GitStatus,
  GitStatusEntry,
  TreeThemeInput,
  TreeThemeStyles,
} from '@pierre/trees';
