import type { UnwrapRef } from "vue";

export function watchMessage(
  ref: Ref<unknown>,
  type: string,
  callback: (data: any) => void,
) {
  watch(ref, (data) => {
    if (typeof data === "string") {
      try {
        const message = JSON.parse(data);
        if (message.type === type) {
          callback(message);
        }
      } catch (e) {
        console.error(e);
      }
    }
  });
}

export function useWebsocketRef<T>(
  reference: Ref<unknown>,
  type: string,
  key: string,
  start: T,
  mapper: (data: any) => T = (data) => data,
) {
  const result = ref<T>(start);
  const notSet = ref(true);
  watchMessage(reference, type, (data) => {
    result.value = mapper(data[key]) as UnwrapRef<T>;
    notSet.value = false;
  });
  return { result, notSet };
}