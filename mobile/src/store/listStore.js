import {
  create,
} from "zustand";

import api from "../services/api";

import {
  cacheLists,
  getCachedLists,
  createTempId,
  resolveStoredId,
} from "../services/offlineStorage";

import {
  isNetworkError,
  isOfflineNow,
  queueMutation,
} from "./syncStore";

async function saveLists(
  boardId,
  lists
) {
  if (
    boardId === null ||
    boardId === undefined
  ) {
    return;
  }

  const resolvedBoardId =
    await resolveStoredId(
      boardId
    );

  await cacheLists(
    resolvedBoardId,
    lists
  );
}

const useListStore =
  create(
    (set, get) => ({
      lists: [],

      currentBoardId:
        null,

      isLoading:
        false,

      fetchLists:
        async (
          boardId
        ) => {
          const resolvedBoardId =
            await resolveStoredId(
              boardId
            );

          try {
            set({
              isLoading:
                true,

              currentBoardId:
                boardId,
            });

            const response =
              await api.get(
                `/boards/${resolvedBoardId}/lists`
              );

            set({
              lists:
                response.data,

              currentBoardId:
                boardId,
            });

            await cacheLists(
              resolvedBoardId,
              response.data
            );

            return response.data;
          } catch (error) {
            if (
              isNetworkError(
                error
              )
            ) {
              const cached =
                await getCachedLists(
                  resolvedBoardId
                );

              set({
                lists:
                  cached,

                currentBoardId:
                  boardId,
              });

              return cached;
            }

            throw error;
          } finally {
            set({
              isLoading:
                false,
            });
          }
        },

      createList:
        async (
          boardId,
          title
        ) => {
          const resolvedBoardId =
            await resolveStoredId(
              boardId
            );

          const data = {
            title,
          };

          const offline =
            await isOfflineNow();

          if (!offline) {
            try {
              const response =
                await api.post(
                  `/boards/${resolvedBoardId}/lists`,
                  data
                );

              const next = [
                ...get().lists,
                response.data,
              ].sort(
                (a, b) =>
                  a.order -
                  b.order
              );

              set({
                lists:
                  next,
              });

              await saveLists(
                boardId,
                next
              );

              return response.data;
            } catch (error) {
              if (
                !isNetworkError(
                  error
                )
              ) {
                throw error;
              }
            }
          }

          const current =
            get().lists;

          const maxOrder =
            current.length >
            0
              ? Math.max(
                  ...current.map(
                    (list) =>
                      Number(
                        list.order
                      ) || 0
                  )
                )
              : -1;

          const tempId =
            createTempId();

          const tempList = {
            id: tempId,

            boardId,

            title,

            order:
              maxOrder + 1,

            _offline:
              true,
          };

          const next = [
            ...current,
            tempList,
          ].sort(
            (a, b) =>
              a.order -
              b.order
          );

          set({
            lists:
              next,

            currentBoardId:
              boardId,
          });

          await saveLists(
            boardId,
            next
          );

          await queueMutation({
            method: "post",

            url:
              `/boards/${resolvedBoardId}/lists`,

            data,

            entityType:
              "list",

            tempId,
          });

          return tempList;
        },

      updateList:
        async (
          id,
          data
        ) => {
          const resolvedId =
            await resolveStoredId(
              id
            );

          const boardId =
            get()
              .currentBoardId;

          const offline =
            await isOfflineNow();

          if (!offline) {
            try {
              const response =
                await api.put(
                  `/lists/${resolvedId}`,
                  data
                );

              const next =
                get()
                  .lists
                  .map(
                    (list) =>
                      Number(
                        list.id
                      ) ===
                        Number(id) ||
                      Number(
                        list.id
                      ) ===
                        Number(
                          resolvedId
                        )
                        ? response.data
                        : list
                  )
                  .sort(
                    (a, b) =>
                      a.order -
                      b.order
                  );

              set({
                lists:
                  next,
              });

              await saveLists(
                boardId,
                next
              );

              return response.data;
            } catch (error) {
              if (
                !isNetworkError(
                  error
                )
              ) {
                throw error;
              }
            }
          }

          const next =
            get()
              .lists
              .map(
                (list) =>
                  Number(
                    list.id
                  ) ===
                    Number(id) ||
                  Number(
                    list.id
                  ) ===
                    Number(
                      resolvedId
                    )
                    ? {
                        ...list,
                        ...data,
                        _offline:
                          true,
                      }
                    : list
              )
              .sort(
                (a, b) =>
                  a.order -
                  b.order
              );

          set({
            lists:
              next,
          });

          await saveLists(
            boardId,
            next
          );

          await queueMutation({
            method: "put",

            url:
              `/lists/${resolvedId}`,

            data,

            entityType:
              "list",
          });

          return next.find(
            (list) =>
              Number(
                list.id
              ) ===
                Number(id) ||
              Number(
                list.id
              ) ===
                Number(
                  resolvedId
                )
          );
        },

      deleteList:
        async (id) => {
          const resolvedId =
            await resolveStoredId(
              id
            );

          const boardId =
            get()
              .currentBoardId;

          const offline =
            await isOfflineNow();

          if (!offline) {
            try {
              await api.delete(
                `/lists/${resolvedId}`
              );

              const next =
                get()
                  .lists
                  .filter(
                    (list) =>
                      Number(
                        list.id
                      ) !==
                        Number(id) &&
                      Number(
                        list.id
                      ) !==
                        Number(
                          resolvedId
                        )
                  );

              set({
                lists:
                  next,
              });

              await saveLists(
                boardId,
                next
              );

              return;
            } catch (error) {
              if (
                !isNetworkError(
                  error
                )
              ) {
                throw error;
              }
            }
          }

          const next =
            get()
              .lists
              .filter(
                (list) =>
                  Number(
                    list.id
                  ) !==
                    Number(id) &&
                  Number(
                    list.id
                  ) !==
                    Number(
                      resolvedId
                    )
              );

          set({
            lists:
              next,
          });

          await saveLists(
            boardId,
            next
          );

          await queueMutation({
            method:
              "delete",

            url:
              `/lists/${resolvedId}`,

            data: null,

            entityType:
              "list",
          });
        },

      clearLists: () => {
        set({
          lists: [],

          currentBoardId:
            null,
        });
      },
    })
  );

export default useListStore;