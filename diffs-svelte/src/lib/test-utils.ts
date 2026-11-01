import { expect } from 'vitest';

/** Every open shadow root rendered by upstream under `host`. */
function shadowRoots(host: ParentNode): ShadowRoot[] {
  return Array.from(host.querySelectorAll('diffs-container'))
    .map((el) => el.shadowRoot)
    .filter((root): root is ShadowRoot => root != null);
}

/** Elements matching `selector` inside upstream's shadow roots under `host`. */
export function queryShadow(host: ParentNode, selector: string): Element[] {
  return shadowRoots(host).flatMap((root) => Array.from(root.querySelectorAll(selector)));
}

/** Text of every element matching `selector` inside the shadow roots, joined by newlines. */
export function lines(host: ParentNode, selector: string): string {
  return queryShadow(host, selector)
    .map((el) => el.textContent ?? '')
    .join('\n');
}

/** Waits until upstream has rendered at least one element matching `selector`. */
export async function waitForRows(host: ParentNode, selector: string): Promise<void> {
  await expect.poll(() => queryShadow(host, selector).length, { timeout: 5000 }).toBeGreaterThan(0);
}

/**
 * Counts elements currently observed by any ResizeObserver, by wrapping the
 * prototype methods (upstream shares one static observer, so constructor
 * counts would miss it). Call `restore()` when done.
 */
export function trackResizeObservers(): { live: () => number; restore: () => void } {
  const proto = ResizeObserver.prototype;
  const { observe, unobserve, disconnect } = proto;
  const observed = new Map<ResizeObserver, Set<Element>>();
  const targets = (observer: ResizeObserver) => {
    let set = observed.get(observer);
    if (set == null) observed.set(observer, (set = new Set()));
    return set;
  };
  proto.observe = function (this: ResizeObserver, target: Element, options?: ResizeObserverOptions) {
    targets(this).add(target);
    observe.call(this, target, options);
  };
  proto.unobserve = function (this: ResizeObserver, target: Element) {
    targets(this).delete(target);
    unobserve.call(this, target);
  };
  proto.disconnect = function (this: ResizeObserver) {
    observed.delete(this);
    disconnect.call(this);
  };
  return {
    live: () => Array.from(observed.values()).reduce((sum, set) => sum + set.size, 0),
    restore: () => Object.assign(proto, { observe, unobserve, disconnect }),
  };
}
