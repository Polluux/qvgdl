import { getCurrentInstance, onBeforeUnmount } from 'vue';

// Event name -> payload type (use `void` for events without payload)
export interface BusEvents {
  'game:force-next-question': void;
}

type Handler<T> = (payload: T) => void;
type Args<T> = T extends void ? [] : [payload: T];

const handlers = new Map<keyof BusEvents, Set<Handler<never>>>();

function on<K extends keyof BusEvents>(event: K, handler: Handler<BusEvents[K]>) {
  let set = handlers.get(event);
  if (!set) {
    set = new Set();
    handlers.set(event, set);
  }
  set.add(handler);
  return () => off(event, handler);
}

function off<K extends keyof BusEvents>(event: K, handler: Handler<BusEvents[K]>) {
  handlers.get(event)?.delete(handler);
}

function emit<K extends keyof BusEvents>(event: K, ...args: Args<BusEvents[K]>) {
  const [payload] = args as unknown[];
  handlers.get(event)?.forEach((handler) => (handler as Handler<unknown>)(payload));
}

export function useEventBus() {
  // Listeners registered from a component are removed automatically when it unmounts
  function onScoped<K extends keyof BusEvents>(event: K, handler: Handler<BusEvents[K]>) {
    const unsubscribe = on(event, handler);
    if (getCurrentInstance()) onBeforeUnmount(unsubscribe);
    return unsubscribe;
  }

  return { on: onScoped, off, emit };
}
