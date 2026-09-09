import { copyText } from './clipboard.js';

export const CONTEXT7_COPY_FEEDBACK_DELAY = 1600;

export const context7CopyIconHtml = `<svg class="c7-copy-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path class="c7-copy-icon--copy" d="M5 5h9v9H5zM2 11V2h9"></path><path class="c7-copy-icon--copied" d="m3 8 3 3 7-7"></path></svg>`;

export const context7CopyIconsHtml = `${context7CopyIconHtml}<span aria-live="polite" class="c7-copy-status"></span>`;

export interface Context7CopyActionControllerOptions<Key> {
  /** Clipboard implementation. Injectable for custom runtimes and tests. */
  readonly copy?: (value: string) => Promise<boolean>;
  /** Duration of copied feedback and repeat-click suppression. */
  readonly delay?: number;
  /** Maps shared copied state into the owning renderer. */
  readonly onChange: (key: Key, copied: boolean) => void;
}

/**
 * Coordinates concurrent clipboard work and copied feedback without owning a
 * renderer. Each framework maps keys into native reactive or DOM state.
 */
export class Context7CopyActionController<Key> {
  private readonly active = new Map<Key, ReturnType<typeof setTimeout> | null>();
  private readonly copyValue: (value: string) => Promise<boolean>;
  private readonly delay: number;
  private generation = 0;
  private readonly onChange: (key: Key, copied: boolean) => void;

  constructor(options: Context7CopyActionControllerOptions<Key>) {
    this.copyValue = options.copy ?? copyText;
    this.delay = Math.max(0, options.delay ?? CONTEXT7_COPY_FEEDBACK_DELAY);
    this.onChange = options.onChange;
  }

  isCopied(key: Key): boolean {
    return this.active.has(key) && this.active.get(key) !== null;
  }

  async copy(key: Key, rawValue: string): Promise<boolean> {
    const value = rawValue.trim();
    if (!value || this.active.has(key)) return false;

    const generation = this.generation;
    this.active.set(key, null);
    try {
      if (!(await this.copyValue(value)) || generation !== this.generation) return false;

      const timer = setTimeout(() => {
        if (this.active.get(key) !== timer) return;
        this.active.delete(key);
        this.onChange(key, false);
      }, this.delay);
      this.active.set(key, timer);
      this.onChange(key, true);
      return true;
    } finally {
      if (generation === this.generation && this.active.get(key) === null) this.active.delete(key);
    }
  }

  /** Invalidate pending writes, clear timers, and optionally reset rendered state. */
  reset(notify = true): void {
    this.generation += 1;
    const copiedKeys: Key[] = [];
    for (const [key, timer] of this.active) {
      if (timer === null) continue;
      clearTimeout(timer);
      copiedKeys.push(key);
    }
    this.active.clear();
    if (notify) for (const key of copiedKeys) this.onChange(key, false);
  }
}

export function createContext7CopyActionController<Key>(
  options: Context7CopyActionControllerOptions<Key>
): Context7CopyActionController<Key> {
  return new Context7CopyActionController(options);
}

/** Update a raw-Markdown or custom-element copy button without replacing it. */
export function syncContext7CopyButton(
  button: HTMLButtonElement,
  copied: boolean,
  copyLabel: string,
  copiedLabel: string
): void {
  const label = copied ? copiedLabel : copyLabel;
  button.toggleAttribute('data-c7-copied', copied);
  if (copied) button.setAttribute('aria-disabled', 'true');
  else button.removeAttribute('aria-disabled');
  button.setAttribute('aria-label', label);
  button.setAttribute('title', label);
  const status = button.querySelector<HTMLElement>('.c7-copy-status');
  if (status) status.textContent = copied ? copiedLabel : '';
}
