export type RouteHandler = () => void;

const ROUTE_EVENT = "betterread:routechange";

export function installRouteObserver(handler: RouteHandler): () => void {
  const originalPush = history.pushState.bind(history);
  const originalReplace = history.replaceState.bind(history);
  let scheduled = false;

  const notify = () => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      handler();
    });
  };

  history.pushState = (...args) => {
    originalPush(...args);
    window.dispatchEvent(new Event(ROUTE_EVENT));
  };
  history.replaceState = (...args) => {
    originalReplace(...args);
    window.dispatchEvent(new Event(ROUTE_EVENT));
  };

  window.addEventListener("popstate", notify);
  window.addEventListener("hashchange", notify);
  window.addEventListener(ROUTE_EVENT, notify);

  return () => {
    history.pushState = originalPush;
    history.replaceState = originalReplace;
    window.removeEventListener("popstate", notify);
    window.removeEventListener("hashchange", notify);
    window.removeEventListener(ROUTE_EVENT, notify);
  };
}
