// Runtime patch for ResizeObserver callback scheduling to avoid
// 'ResizeObserver loop completed with undelivered notifications' warnings.
// Defers ResizeObserver callbacks to the next animation frame.

if (typeof window !== "undefined" && (window as any).ResizeObserver) {
  const OriginalResizeObserver = (window as any)
    .ResizeObserver as typeof ResizeObserver;

  // Avoid double-patching
  const alreadyPatched = (OriginalResizeObserver as any).__abbyPatched__;
  if (!alreadyPatched) {
    class PatchedResizeObserver extends OriginalResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        super((entries: ResizeObserverEntry[], observer: ResizeObserver) => {
          // Schedule in next frame to avoid layout thrash within same notification cycle
          requestAnimationFrame(() => {
            try {
              callback(entries, observer);
            } catch (err) {
              // Swallow errors to prevent breaking the ResizeObserver delivery
              // eslint-disable-next-line no-console
              console.warn("ResizeObserver callback error:", err);
            }
          });
        });
      }
    }
    (PatchedResizeObserver as any).__abbyPatched__ = true;
    (window as any).ResizeObserver =
      PatchedResizeObserver as unknown as typeof ResizeObserver;
  }
}
