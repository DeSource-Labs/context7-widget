interface InertRecord {
  count: number;
  readonly element: HTMLElement;
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
 * Make everything outside `container` non-interactive and lock page scrolling.
 * Calls are reference counted so independently mounted modal widgets compose.
 */
export function acquireContext7Modal(container: HTMLElement): () => void {
  const document = container.ownerDocument;
  const inerted = collectOutsideElements(container, document.body);

  for (const element of inerted) retainInert(element);
  retainScrollLock(document);

  let released = false;
  return () => {
    if (released) return;
    released = true;
    for (const element of inerted) releaseInert(element);
    releaseScrollLock(document);
  };
}

function collectOutsideElements(container: HTMLElement, body: HTMLElement): HTMLElement[] {
  const elements = new Set<HTMLElement>();
  let branch: HTMLElement | null = container;

  while (branch && branch !== body) {
    const parentElement: HTMLElement | null = branch.parentElement;
    if (!parentElement) break;
    for (const sibling of parentElement.children) {
      if (sibling !== branch && sibling instanceof HTMLElement) elements.add(sibling);
    }
    branch = parentElement;
  }

  return [...elements];
}

function retainInert(element: HTMLElement): void {
  const existing = inertRecords.get(element);
  if (existing) {
    existing.count += 1;
    return;
  }

  inertRecords.set(element, {
    count: 1,
    element,
    hadAttribute: element.hasAttribute('inert'),
    inert: element.inert
  });
  element.inert = true;
  element.setAttribute('inert', '');
}

function releaseInert(element: HTMLElement): void {
  const record = inertRecords.get(element);
  if (!record) return;
  record.count -= 1;
  if (record.count > 0) return;

  inertRecords.delete(element);
  record.element.inert = record.inert;
  if (!record.hadAttribute) record.element.removeAttribute('inert');
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
