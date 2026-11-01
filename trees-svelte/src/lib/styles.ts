import type { TreeThemeStyles } from '@pierre/trees';

/**
 * Converts a style object such as the result of `themeToTreeStyles()` (React-style
 * camelCase keys plus `--trees-*` custom properties) into CSS text for a `style`
 * attribute. Strings pass through unchanged.
 */
export function treeStylesToCssText(style: string | TreeThemeStyles | undefined): string | undefined {
  if (style == null || typeof style === 'string') return style;
  return Object.entries(style)
    .filter(([, value]) => value !== '')
    .map(([key, value]) => {
      const property = key.startsWith('--')
        ? key
        : key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
      return `${property}: ${value}`;
    })
    .join('; ');
}
