export function setViewportSize(width: number, height: number): void {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width
  });
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: height
  });
}

export function setElementSize(element: HTMLElement | null | undefined, width: number, height: number): void {
  if (!element) throw new Error('Expected element to exist.');

  Object.defineProperty(element, 'offsetWidth', {
    configurable: true,
    value: width
  });
  Object.defineProperty(element, 'offsetHeight', {
    configurable: true,
    value: height
  });
}

export function setElementRect(
  element: HTMLElement | null | undefined,
  rect: Pick<DOMRect, 'bottom' | 'height' | 'left' | 'right' | 'top' | 'width'>
): void {
  if (!element) throw new Error('Expected element to exist.');

  element.getBoundingClientRect = () =>
    ({
      ...rect,
      x: rect.left,
      y: rect.top,
      toJSON: () => rect
    }) as DOMRect;
}
