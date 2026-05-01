// ─── Theme Application Utility ─────────────────────────────────────────────────

/**
 * Apply the given theme to the root HTML element by toggling CSS classes.
 *
 * - `'dark'`   → adds `dark`, removes `light`
 * - `'light'`  → adds `light`, removes `dark`
 * - `'system'` → removes both, then applies `dark` if the OS prefers dark mode
 */
export function applyTheme(theme: 'light' | 'dark' | 'system'): void {
  const root = document.documentElement;

  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else if (theme === 'light') {
    root.classList.remove('dark');
    root.classList.add('light');
  } else {
    // System: mirror the OS preference
    root.classList.remove('dark', 'light');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
    root.classList.toggle('light', !prefersDark);
  }
}
