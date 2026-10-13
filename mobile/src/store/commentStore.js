import {
  create,
} from "zustand";

import api from "../services/api";

import useAuthStore from "./authStore";

import {
  cacheComments,
  getCachedComments,
  createTempId,
  resolveStoredId,
} from "../services/offlineStorage";

import {
  isNetworkError,
  isOfflineNow,
  queueMutation,
} from "./syncStore";

async function saveComments(
  taskId,
  comments
) {
  const resolvedTaskId =
    await resolveStoredId(
      taskId
    );

  await cacheComments(
    resolvedTaskId,
    comments
  );
}

const useCommentStore =
  create(
    (set, get) => ({
      commentsByTask:
        {},

      isLoading:
        false,

      isSaving:
        false,

      error:
        null,

      fetchComments:
        async (
          taskId
        ) => {
          const resolvedTaskId =
            await resolveStoredId(
              taskId
            );

          try {
            set({
              isLoading:
                true,

              error: null,
            });

            const response =
              await api.get(
                `/tasks/${resolvedTaskId}/comments`
              );

            set(
              (state) => ({
                commentsByTask: {
                  ...state
                    .commentsByTask,

                  [taskId]:
                    response.data,
                },

                error: null,
              })
            );

            await cacheComments(
              resolvedTaskId,
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
                await getCachedComments(
                  resolvedTaskId
                );

              set(
                (state) => ({
                  commentsByTask: {
                    ...state
                      .commentsByTask,

                    [taskId]:
                      cached,
                  },

                  error:
                    null,
                })
              );

              return cached;
            }

            set({
              error:
                error.response
                  ?.data
                  ?.message ||
                "Yorumlar yüklenemedi.",
            });

            throw error;
          } finally {
            set({
              isLoading:
                false,
            });
          }
        },

      addComment:
        async (
          taskId,
          content
        ) => {
          try {
            set({
              isSaving:
                true,

              error: null,
            });

            const resolvedTaskId =
              await resolveStoredId(
                taskId
              );

            const offline =
              await isOfflineNow();

            if (!offline) {
              try {
                const response =
                  await api.post(
                    `/tasks/${resolvedTaskId}/comments`,
                    {
                      content,
                    }
                  );

                const current =
                  get()
                    .commentsByTask[
                    taskId
                  ] || [];

                const next = [
                  ...current,
                  response.data,
                ];

                set(
                  (state) => ({
                    commentsByTask: {
                      ...state
                        .commentsByTask,

                      [taskId]:
                        next,
                    },
                  })
                );

                await saveComments(
                  taskId,
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

            const user =
              useAuthStore
                .getState()
                .user;

            const tempId =
              createTempId();

            const now =
              new Date().toISOString();

            const tempComment = {
              id: tempId,

              taskId,

              userId:
                user?.id,

              content,

              createdAt:
                now,

              updatedAt:
                now,

              user: user
                ? {
                    id:
                      user.id,

                    name:
                      user.name,

                    email:
                      user.email,
                  }
                : null,

              _offline:
                true,
            };

            const current =
              get()
                .commentsByTask[
                taskId
              ] || [];

            const next = [
              ...current,
              tempComment,
            ];

            set(
              (state) => ({
                commentsByTask: {
                  ...state
                    .commentsByTask,

                  [taskId]:
                    next,
                },
              })
            );

            await saveComments(
              taskId,
              next
            );

            await queueMutation({
              method:
                "post",

              url:
                `/tasks/${resolvedTaskId}/comments`,

              data: {
                content,
              },

              entityType:
                "comment",

              tempId,
            });

            return tempComment;
          } catch (error) {
            set({
              error:
                error.response
                  ?.data
                  ?.message ||
                "Yorum eklenemedi.",
            });

            throw error;
          } finally {
            set({
              isSaving:
                false,
            });
          }
        },

      updateComment:
        async (
          taskId,
          commentId,
          content
        ) => {
          try {
            set({
              isSaving:
                true,

              error: null,
            });

            const resolvedCommentId =
              await resolveStoredId(
                commentId
              );

            const offline =
              await isOfflineNow();

            if (!offline) {
              try {
                const response =
                  await api.put(
                    `/comments/${resolvedCommentId}`,
                    {
                      content,
                    }
                  );

                const current =
                  get()
                    .commentsByTask[
                    taskId
                  ] || [];

                const next =
                  current.map(
                    (comment) =>
                      Number(
                        comment.id
                      ) ===
                        Number(
                          commentId
                        ) ||
                      Number(
                        comment.id
                      ) ===
                        Number(
                          resolvedCommentId
                        )
                        ? response.data
                        : comment
                  );

                set(
                  (state) => ({
                    commentsByTask: {
                      ...state
                        .commentsByTask,

                      [taskId]:
                        next,
                    },
                  })
                );

                await saveComments(
                  taskId,
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
              get()
                .commentsByTask[
                taskId
              ] || [];

            const next =
              current.map(
                (comment) =>
                  Number(
                    comment.id
                  ) ===
                    Number(
                      commentId
                    ) ||
                  Number(
                    comment.id
                  ) ===
                    Number(
                      resolvedCommentId
                    )
                    ? {
                        ...comment,
                        content,
                        updatedAt:
                          new Date().toISOString(),
                        _offline:
                          true,
                      }
                    : comment
              );

            set(
              (state) => ({
                commentsByTask: {
                  ...state
                    .commentsByTask,

                  [taskId]:
                    next,
                },
              })
            );

            await saveComments(
              taskId,
              next
            );

            await queueMutation({
              method:
                "put",

              url:
                `/comments/${resolvedCommentId}`,

              data: {
                content,
              },

              entityType:
                "comment",
            });

            return next.find(
              (comment) =>
                Number(
                  comment.id
                ) ===
                  Number(
                    commentId
                  ) ||
                Number(
                  comment.id
                ) ===
                  Number(
                    resolvedCommentId
                  )
            );
          } finally {
            set({
              isSaving:
                false,
            });
          }
        },

      deleteComment:
        async (
          taskId,
          commentId
        ) => {
          try {
            set({
              isSaving:
                true,

              error: null,
            });

            const resolvedCommentId =
              await resolveStoredId(
                commentId
              );

            const offline =
              await isOfflineNow();

            if (!offline) {
              try {
                await api.delete(
                  `/comments/${resolvedCommentId}`
                );

                const current =
                  get()
                    .commentsByTask[
                    taskId
                  ] || [];

                const next =
                  current.filter(
                    (comment) =>
                      Number(
                        comment.id
                      ) !==
                        Number(
                          commentId
                        ) &&
                      Number(
                        comment.id
                      ) !==
                        Number(
                          resolvedCommentId
                        )
                  );

                set(
                  (state) => ({
                    commentsByTask: {
                      ...state
                        .commentsByTask,

                      [taskId]:
                        next,
                    },
                  })
                );

                await saveComments(
                  taskId,
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

            const current =
              get()
                .commentsByTask[
                taskId
              ] || [];

            const next =
              current.filter(
                (comment) =>
                  Number(
                    comment.id
                  ) !==
                    Number(
                      commentId
                    ) &&
                  Number(
                    comment.id
                  ) !==
                    Number(
                      resolvedCommentId
                    )
              );

            set(
              (state) => ({
                commentsByTask: {
                  ...state
                    .commentsByTask,

                  [taskId]:
                    next,
                },
              })
            );

            await saveComments(
              taskId,
              next
            );

            await queueMutation({
              method:
                "delete",

              url:
                `/comments/${resolvedCommentId}`,

              data: null,

              entityType:
                "comment",
            });
          } finally {
            set({
              isSaving:
                false,
            });
          }
        },

      clearComments:
        (
          taskId
        ) => {
          if (
            taskId ==
            null
          ) {
            set({
              commentsByTask:
                {},

              error:
                null,
            });

            return;
          }

          const next = {
            ...get()
              .commentsByTask,
          };

          delete next[
            taskId
          ];

          set({
            commentsByTask:
              next,
          });
        },
    })
  );

export default useCommentStore;