import { create } from "zustand";
import api from "../services/api";

const useBoardMemberStore = create(
  (set, get) => ({
    members: [],
    assignableUsers: [],

    isLoading: false,
    isSaving: false,
    error: null,

    fetchMembers: async (boardId) => {
      try {
        set({
          isLoading: true,
          error: null,
        });

        const response =
          await api.get(
            `/boards/${boardId}/members`
          );

        set({
          members: response.data,
        });

        return response.data;
      } catch (error) {
        const message =
          error.response?.data
            ?.message ||
          "Pano üyeleri alınamadı.";

        set({
          error: message,
        });

        throw error;
      } finally {
        set({
          isLoading: false,
        });
      }
    },

    inviteMember: async (
      boardId,
      email
    ) => {
      try {
        set({
          isSaving: true,
          error: null,
        });

        const response =
          await api.post(
            `/boards/${boardId}/members`,
            {
              email:
                email
                  .trim()
                  .toLowerCase(),
            }
          );

        set({
          members: [
            ...get().members,
            response.data,
          ],
        });

        return response.data;
      } catch (error) {
        const message =
          error.response?.data
            ?.message ||
          "Kullanıcı davet edilemedi.";

        set({
          error: message,
        });

        throw error;
      } finally {
        set({
          isSaving: false,
        });
      }
    },

    removeMember: async (
      boardId,
      userId
    ) => {
      try {
        set({
          isSaving: true,
          error: null,
        });

        await api.delete(
          `/boards/${boardId}/members/${userId}`
        );

        set({
          members:
            get().members.filter(
              (member) =>
                member.user.id !==
                userId
            ),
        });
      } catch (error) {
        const message =
          error.response?.data
            ?.message ||
          "Kullanıcı panodan çıkarılamadı.";

        set({
          error: message,
        });

        throw error;
      } finally {
        set({
          isSaving: false,
        });
      }
    },

    leaveBoard: async (
      boardId
    ) => {
      try {
        set({
          isSaving: true,
          error: null,
        });

        await api.delete(
          `/boards/${boardId}/leave`
        );
      } catch (error) {
        set({
          error:
            error.response?.data
              ?.message ||
            "Panodan ayrılamadı.",
        });

        throw error;
      } finally {
        set({
          isSaving: false,
        });
      }
    },

    fetchAssignableUsers:
      async (boardId) => {
        try {
          const response =
            await api.get(
              `/boards/${boardId}/assignable-users`
            );

          set({
            assignableUsers:
              response.data,
          });

          return response.data;
        } catch (error) {
          set({
            assignableUsers: [],
          });

          throw error;
        }
      },

    clearBoardMembers: () => {
      set({
        members: [],
        assignableUsers: [],
        error: null,
      });
    },
  })
);

export default useBoardMemberStore;