import {
  create,
} from "zustand";

import NetInfo from "@react-native-community/netinfo";

import api from "../services/api";

import {
  addMutationToQueue,
  getMutationQueue,
  setMutationQueue,
  replaceTempIdEverywhere,
} from "../services/offlineStorage";

function hasConnection(
  state
) {
  return (
    state.isConnected !==
      false &&
    state.isInternetReachable !==
      false
  );
}

export function isNetworkError(
  error
) {
  return !error?.response;
}

export async function isOfflineNow() {
  try {
    const state =
      await NetInfo.fetch();

    return !hasConnection(
      state
    );
  } catch {
    return false;
  }
}

function replaceValue(
  value,
  tempId,
  realId
) {
  if (
    typeof value ===
      "number" &&
    Number(value) ===
      Number(tempId)
  ) {
    return Number(
      realId
    );
  }

  if (
    typeof value ===
      "string" &&
    value ===
      String(tempId)
  ) {
    return String(
      realId
    );
  }

  if (
    Array.isArray(value)
  ) {
    return value.map(
      (item) =>
        replaceValue(
          item,
          tempId,
          realId
        )
    );
  }

  if (
    value &&
    typeof value ===
      "object"
  ) {
    const result = {};

    for (
      const [
        key,
        child,
      ] of Object.entries(
        value
      )
    ) {
      result[key] =
        replaceValue(
          child,
          tempId,
          realId
        );
    }

    return result;
  }

  return value;
}

function replaceUrlId(
  url,
  tempId,
  realId
) {
  return url
    .split("/")
    .map(
      (part) =>
        part ===
        String(tempId)
          ? String(
              realId
            )
          : part
    )
    .join("/");
}

function rewriteMutation(
  mutation,
  tempId,
  realId
) {
  return {
    ...mutation,

    url:
      replaceUrlId(
        mutation.url,
        tempId,
        realId
      ),

    data:
      replaceValue(
        mutation.data,
        tempId,
        realId
      ),
  };
}

const useSyncStore =
  create(
    (set, get) => ({
      isConnected: true,

      pendingCount: 0,

      isSyncing: false,

      initialized: false,

      lastSyncAt: null,

      lastError: null,

      unsubscribe: null,

      refreshPendingCount:
        async () => {
          const queue =
            await getMutationQueue();

          set({
            pendingCount:
              queue.length,
          });

          return queue.length;
        },

      syncPending:
        async () => {
          if (
            get().isSyncing
          ) {
            return;
          }

          const network =
            await NetInfo.fetch();

          if (
            !hasConnection(
              network
            )
          ) {
            set({
              isConnected:
                false,

              lastError:
                "İnternet bağlantısı yok.",
            });

            return;
          }

          set({
            isConnected: true,
            isSyncing: true,
            lastError: null,
          });

          try {
            let queue =
              await getMutationQueue();

            while (
              queue.length >
              0
            ) {
              const current =
                queue[0];

              try {
                const response =
                  await api.request({
                    method:
                      current.method,

                    url:
                      current.url,

                    data:
                      current.data,
                  });

                let remaining =
                  queue.slice(1);

                if (
                  current.tempId !==
                    undefined &&
                  current.tempId !==
                    null &&
                  response.data
                    ?.id !==
                    undefined
                ) {
                  const realId =
                    Number(
                      response
                        .data.id
                    );

                  await replaceTempIdEverywhere(
                    current.tempId,
                    response.data
                  );

                  remaining =
                    remaining.map(
                      (mutation) =>
                        rewriteMutation(
                          mutation,
                          current.tempId,
                          realId
                        )
                    );
                }

                queue =
                  remaining;

                await setMutationQueue(
                  queue
                );

                set({
                  pendingCount:
                    queue.length,
                });
              } catch (
                error
              ) {
                if (
                  isNetworkError(
                    error
                  )
                ) {
                  set({
                    isConnected:
                      false,

                    lastError:
                      "Senkronizasyon sırasında bağlantı kesildi.",
                  });
                } else {
                  set({
                    lastError:
                      error.response
                        ?.data
                        ?.message ||
                      "Bir değişiklik senkronize edilemedi.",
                  });
                }

                break;
              }
            }

            if (
              queue.length ===
              0
            ) {
              set({
                lastSyncAt:
                  new Date().toISOString(),

                lastError:
                  null,
              });
            }
          } finally {
            set({
              isSyncing:
                false,
            });

            await get()
              .refreshPendingCount();
          }
        },

      initialize:
        () => {
          if (
            get().initialized
          ) {
            return;
          }

          set({
            initialized:
              true,
          });

          get()
            .refreshPendingCount();

          NetInfo.fetch().then(
            (state) => {
              const connected =
                hasConnection(
                  state
                );

              set({
                isConnected:
                  connected,
              });

              if (
                connected
              ) {
                get()
                  .syncPending();
              }
            }
          );

          const unsubscribe =
            NetInfo.addEventListener(
              (state) => {
                const connected =
                  hasConnection(
                    state
                  );

                const wasConnected =
                  get()
                    .isConnected;

                set({
                  isConnected:
                    connected,
                });

                if (
                  connected &&
                  (
                    !wasConnected ||
                    get()
                      .pendingCount >
                      0
                  )
                ) {
                  get()
                    .syncPending();
                }
              }
            );

          set({
            unsubscribe,
          });
        },

      stop:
        () => {
          const unsubscribe =
            get()
              .unsubscribe;

          if (
            typeof unsubscribe ===
            "function"
          ) {
            unsubscribe();
          }

          set({
            initialized:
              false,

            unsubscribe:
              null,
          });
        },
    })
  );

export async function queueMutation(
  mutation
) {
  const item =
    await addMutationToQueue(
      mutation
    );

  await useSyncStore
    .getState()
    .refreshPendingCount();

  return item;
}

export default useSyncStore;