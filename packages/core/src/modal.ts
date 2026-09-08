interface InertRecord {
  /** Number of active modal containers in this branch. */
  active: number;
  count: number;
  readonly hadAttribute: boolean;
  readonly inert: boolean;
}

interface ScrollLockRecord {
  count: number;
  readonly overflow: string;
  readonly paddingRight: string;
}

const inertRecords = new Map<HTMLElement, InertRecord>();
const scrollLocks = new WeakMap<Document, ScrollLockRecord>();

/**
 * Make everything outside active modal containers non-interactive and lock page scrolling.
 * Calls are reference counted so independently mounted modal widgets compose.
 */
export function acquireContext7Modal(container: HTMLElement): () => void {
  const document = container.ownerDocument;
  const { branches, outside } = collectModalElements(container, document.body);

  for (const element of branches) updateInert(element, 0, 1);
  for (const element of outside) updateInert(element, 1);
  retainScrollLock(document);

  let released = false;
  return () => {
    if (released) return;
    released = true;
    for (const element of outside) updateInert(element, -1);
    for (const element of branches) updateInert(element, 0, -1);
    releaseScrollLock(document);
  };
}

function collectModalElements(container: HTMLElement, body: HTMLElement) {
  const branches: HTMLElement[] = [];
  const outside: HTMLElement[] = [];
  let branch: HTMLElement | null = container;

  while (branch && branch !== body) {
    branches.push(branch);
    const parentElement: HTMLElement | null = branch.parentElement;
    if (!parentElement) break;
    for (const sibling of parentElement.children) {
      if (sibling !== branch && sibling instanceof HTMLElement) outside.push(sibling);
    }
    branch = parentElement;
  }

  return { branches, outside };
}

function updateInert(element: HTMLElement, count: number, active = 0): void {
  let record = inertRecords.get(element);
  if (!record) {
    record = { active: 0, count: 0, hadAttribute: element.hasAttribute('inert'), inert: element.inert };
    inertRecords.set(element, record);
  }

  const wasInerted = record.count > 0 && record.active === 0;
  record.count += count;
  record.active += active;
  const inerted = record.count > 0 && record.active === 0;
  if (wasInerted !== inerted) {
    element.inert = inerted || record.inert;
    element.toggleAttribute('inert', inerted || record.hadAttribute);
  }
  if (!record.count && !record.active) inertRecords.delete(element);
}

function retainScrollLock(document: Document): void {
  const existing = scrollLocks.get(document);
  if (existing) {
    existing.count += 1;
    return;
  }

  const body = document.body;
  const view = document.defaultView;
  const scrollbarWidth = view ? Math.max(0, view.innerWidth - document.documentElement.clientWidth) : 0;
  const computedPadding = view ? Number.parseFloat(view.getComputedStyle(body).paddingRight) || 0 : 0;

  scrollLocks.set(document, {
    count: 1,
    overflow: body.style.overflow,
    paddingRight: body.style.paddingRight
  });
  body.style.overflow = 'hidden';
  if (scrollbarWidth > 0) body.style.paddingRight = `${computedPadding + scrollbarWidth}px`;
}

function releaseScrollLock(document: Document): void {
  const record = scrollLocks.get(document);
  if (!record) return;
  record.count -= 1;
  if (record.count > 0) return;

  scrollLocks.delete(document);
  document.body.style.overflow = record.overflow;
  document.body.style.paddingRight = record.paddingRight;
}
