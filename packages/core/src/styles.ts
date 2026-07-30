import widgetStylesSource from './shadow.scss?inline';

// Sass nesting emits `:host[open]`, which browsers parse but do not match as a
// conditional shadow-host selector. The functional `:host([open])` form is the
// interoperable syntax. Normalize every one-or-more attribute state sequence
// once when this module is evaluated.
export const widgetStyles = normalizeShadowHostSelectors(widgetStylesSource);

/** @internal Exported for regression testing; the package export map keeps this module private. */
export function normalizeShadowHostSelectors(styles: string): string {
  return styles.replace(/:host((?:\[[^\]]+\])+)/g, (_match, attributes: string) => `:host(${attributes})`);
}
