import { create } from "zustand";

import api from "../services/api";

const useCommentStore = create(
  (set, get) => ({
    commentsByTask: {},

    isLoading: false,
    isSaving: false,

    error: null,

    fetchComments: async (
      taskId
    ) => {
      try {
        set({
          isLoading: true,
          error: null,
        });

        const response =
          await api.get(
            `/tasks/${taskId}/comments`
          );

        set((state) => ({
          commentsByTask: {
            ...state.commentsByTask,

            [taskId]:
              response.data,
          },

          error: null,
        }));

        return response.data;
      } catch (error) {
        set({
          error:
            error.response?.data
              ?.message ||
            "Yorumlar yüklenemedi.",
        });

        throw error;
      } finally {
        set({
          isLoading: false,
        });
      }
    },

    addComment: async (
      taskId,
      content
    ) => {
      try {
        set({
          isSaving: true,
          error: null,
        });

        const response =
          await api.post(
            `/tasks/${taskId}/comments`,
            {
              content,
            }
          );

        set((state) => ({
          commentsByTask: {
            ...state.commentsByTask,

            [taskId]: [
              ...(
                state
                  .commentsByTask[
                  taskId
                ] || []
              ),

              response.data,
            ],
          },
        }));

        return response.data;
      } catch (error) {
        set({
          error:
            error.response?.data
              ?.message ||
            "Yorum eklenemedi.",
        });

        throw error;
      } finally {
        set({
          isSaving: false,
        });
      }
    },

    updateComment: async (
      taskId,
      commentId,
      content
    ) => {
      try {
        set({
          isSaving: true,
          error: null,
        });

        const response =
          await api.put(
            `/comments/${commentId}`,
            {
              content,
            }
          );

        set((state) => ({
          commentsByTask: {
            ...state.commentsByTask,

            [taskId]: (
              state
                .commentsByTask[
                taskId
              ] || []
            ).map((comment) =>
              comment.id ===
              commentId
                ? response.data
                : comment
            ),
          },
        }));

        return response.data;
      } catch (error) {
        set({
          error:
            error.response?.data
              ?.message ||
            "Yorum güncellenemedi.",
        });

        throw error;
      } finally {
        set({
          isSaving: false,
        });
      }
    },

    deleteComment: async (
      taskId,
      commentId
    ) => {
      try {
        set({
          isSaving: true,
          error: null,
        });

        await api.delete(
          `/comments/${commentId}`
        );

        set((state) => ({
          commentsByTask: {
            ...state.commentsByTask,

            [taskId]: (
              state
                .commentsByTask[
                taskId
              ] || []
            ).filter(
              (comment) =>
                comment.id !==
                commentId
            ),
          },
        }));
      } catch (error) {
        set({
          error:
            error.response?.data
              ?.message ||
            "Yorum silinemedi.",
        });

        throw error;
      } finally {
        set({
          isSaving: false,
        });
      }
    },

    clearComments: (
      taskId
    ) => {
      if (taskId == null) {
        set({
          commentsByTask: {},
          error: null,
        });

        return;
      }

      const next = {
        ...get().commentsByTask,
      };

      delete next[taskId];

      set({
        commentsByTask: next,
      });
    },
  })
);

export default useCommentStore;