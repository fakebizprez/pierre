import type { FileTree, FileTreeOptions, TreeThemeStyles } from '@pierre/trees';

/**
 * Props for the `FileTree` Svelte component: every upstream `FileTreeOptions`
 * field under its upstream name and type, plus wrapper-only props.
 *
 * After mount, these props are applied through upstream setters:
 * `paths` / `preparedInput` (`resetPaths`), `gitStatus` (`setGitStatus`),
 * `icons` (`setIcons`) and `composition` (`setComposition`).
 * `onSelectionChange` and `onSearchChange` may be replaced at any time.
 * Every other option is read once at construction, as upstream does.
 */
export type FileTreeProps = FileTreeOptions & {
  /** The upstream instance. Bind it (`bind:tree`) to use the full model API. */
  tree?: FileTree;
  /** Called once, right after the instance is created and rendered. */
  oninit?: (tree: FileTree) => void;
  /** Class for the wrapper element the tree renders into. */
  class?: string;
  /**
   * Style for the wrapper element: CSS text, or a style object such as the
   * result of `themeToTreeStyles(theme)`. Give the tree a height here.
   * CSS custom properties set here inherit into the tree's shadow root.
   */
  style?: string | TreeThemeStyles;
};
