import {
  create,
} from "zustand";

import api from "../services/api";

import {
  cacheBoards,
  getCachedBoards,
  createTempId,
  resolveStoredId,
} from "../services/offlineStorage";

import {
  isNetworkError,
  isOfflineNow,
  queueMutation,
} from "./syncStore";

const useBoardStore =
  create(
    (set, get) => ({
      boards: [],

      isLoading: false,

      error: null,

      fetchBoards:
        async () => {
          try {
            set({
              isLoading:
                true,

              error: null,
            });

            const response =
              await api.get(
                "/boards"
              );

            await cacheBoards(
              response.data
            );

            set({
              boards:
                response.data,

              error: null,
            });

            return response.data;
          } catch (error) {
            if (
              isNetworkError(
                error
              )
            ) {
              const cached =
                await getCachedBoards();

              set({
                boards:
                  cached,

                error: null,
              });

              return cached;
            }

            set({
              error:
                error.response
                  ?.data
                  ?.message ||
                "Panolar yüklenemedi.",
            });

            throw error;
          } finally {
            set({
              isLoading:
                false,
            });
          }
        },

      createBoard:
        async (
          title,
          description
        ) => {
          const data = {
            title,
            description,
          };

          const offline =
            await isOfflineNow();

          if (!offline) {
            try {
              const response =
                await api.post(
                  "/boards",
                  data
                );

              const next = [
                response.data,
                ...get().boards,
              ];

              set({
                boards: next,
              });

              await cacheBoards(
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

          const tempId =
            createTempId();

          const now =
            new Date().toISOString();

          const tempBoard = {
            id: tempId,

            title,

            description:
              description ||
              null,

            accessRole:
              "owner",

            createdAt:
              now,

            updatedAt:
              now,

            _offline:
              true,
          };

          const next = [
            tempBoard,
            ...get().boards,
          ];

          set({
            boards: next,
          });

          await cacheBoards(
            next
          );

          await queueMutation({
            method: "post",

            url: "/boards",

            data,

            entityType:
              "board",

            tempId,
          });

          return tempBoard;
        },

      updateBoard:
        async (
          id,
          title,
          description
        ) => {
          const resolvedId =
            await resolveStoredId(
              id
            );

          const data = {
            title,
            description,
          };

          const offline =
            await isOfflineNow();

          if (!offline) {
            try {
              const response =
                await api.put(
                  `/boards/${resolvedId}`,
                  data
                );

              const next =
                get().boards.map(
                  (board) =>
                    Number(
                      board.id
                    ) ===
                      Number(id) ||
                    Number(
                      board.id
                    ) ===
                      Number(
                        resolvedId
                      )
                      ? response.data
                      : board
                );

              set({
                boards:
                  next,
              });

              await cacheBoards(
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

          const now =
            new Date().toISOString();

          const next =
            get().boards.map(
              (board) =>
                Number(
                  board.id
                ) ===
                  Number(id) ||
                Number(
                  board.id
                ) ===
                  Number(
                    resolvedId
                  )
                  ? {
                      ...board,
                      title,
                      description:
                        description ||
                        null,
                      updatedAt:
                        now,
                      _offline:
                        true,
                    }
                  : board
            );

          set({
            boards:
              next,
          });

          await cacheBoards(
            next
          );

          await queueMutation({
            method: "put",

            url:
              `/boards/${resolvedId}`,

            data,

            entityType:
              "board",
          });

          return next.find(
            (board) =>
              Number(
                board.id
              ) ===
                Number(id) ||
              Number(
                board.id
              ) ===
                Number(
                  resolvedId
                )
          );
        },

      deleteBoard:
        async (id) => {
          const resolvedId =
            await resolveStoredId(
              id
            );

          const offline =
            await isOfflineNow();

          if (!offline) {
            try {
              await api.delete(
                `/boards/${resolvedId}`
              );

              const next =
                get().boards.filter(
                  (board) =>
                    Number(
                      board.id
                    ) !==
                      Number(id) &&
                    Number(
                      board.id
                    ) !==
                      Number(
                        resolvedId
                      )
                );

              set({
                boards:
                  next,
              });

              await cacheBoards(
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
            get().boards.filter(
              (board) =>
                Number(
                  board.id
                ) !==
                  Number(id) &&
                Number(
                  board.id
                ) !==
                  Number(
                    resolvedId
                  )
            );

          set({
            boards:
              next,
          });

          await cacheBoards(
            next
          );

          await queueMutation({
            method:
              "delete",

            url:
              `/boards/${resolvedId}`,

            data: null,

            entityType:
              "board",
          });
        },

      clearError: () => {
        set({
          error: null,
        });
      },
    })
  );

export default useBoardStore;