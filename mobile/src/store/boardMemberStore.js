import {
  create,
} from "zustand";

import api from "../services/api";

import {
  cacheBoardMembers,
  getCachedBoardMembers,
  cacheAssignableUsers,
  getCachedAssignableUsers,
  resolveStoredId,
} from "../services/offlineStorage";

import {
  isNetworkError,
} from "./syncStore";

const useBoardMemberStore =
  create(
    (set, get) => ({
      members: [],

      assignableUsers:
        [],

      isLoading:
        false,

      isSaving:
        false,

      error:
        null,

      fetchMembers:
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

              error: null,
            });

            const response =
              await api.get(
                `/boards/${resolvedBoardId}/members`
              );

            set({
              members:
                response.data,
            });

            await cacheBoardMembers(
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
                await getCachedBoardMembers(
                  resolvedBoardId
                );

              set({
                members:
                  cached,

                error:
                  null,
              });

              return cached;
            }

            const message =
              error.response
                ?.data
                ?.message ||
              "Pano üyeleri alınamadı.";

            set({
              error:
                message,
            });

            throw error;
          } finally {
            set({
              isLoading:
                false,
            });
          }
        },

      inviteMember:
        async (
          boardId,
          email
        ) => {
          try {
            set({
              isSaving:
                true,

              error: null,
            });

            const resolvedBoardId =
              await resolveStoredId(
                boardId
              );

            const response =
              await api.post(
                `/boards/${resolvedBoardId}/members`,
                {
                  email:
                    email
                      .trim()
                      .toLowerCase(),
                }
              );

            const next = [
              ...get()
                .members,

              response.data,
            ];

            set({
              members:
                next,
            });

            await cacheBoardMembers(
              resolvedBoardId,
              next
            );

            return response.data;
          } catch (error) {
            const message =
              isNetworkError(
                error
              )
                ? "Üye eklemek için internet bağlantısı gereklidir."
                : error
                    .response
                    ?.data
                    ?.message ||
                  "Kullanıcı davet edilemedi.";

            set({
              error:
                message,
            });

            const wrapped =
              new Error(
                message
              );

            wrapped.response =
              error.response;

            throw wrapped;
          } finally {
            set({
              isSaving:
                false,
            });
          }
        },

      removeMember:
        async (
          boardId,
          userId
        ) => {
          try {
            set({
              isSaving:
                true,

              error: null,
            });

            const resolvedBoardId =
              await resolveStoredId(
                boardId
              );

            await api.delete(
              `/boards/${resolvedBoardId}/members/${userId}`
            );

            const next =
              get()
                .members
                .filter(
                  (member) =>
                    member.user
                      .id !==
                    userId
                );

            set({
              members:
                next,
            });

            await cacheBoardMembers(
              resolvedBoardId,
              next
            );
          } catch (error) {
            const message =
              isNetworkError(
                error
              )
                ? "Üye çıkarmak için internet bağlantısı gereklidir."
                : error
                    .response
                    ?.data
                    ?.message ||
                  "Kullanıcı panodan çıkarılamadı.";

            set({
              error:
                message,
            });

            throw error;
          } finally {
            set({
              isSaving:
                false,
            });
          }
        },

      leaveBoard:
        async (
          boardId
        ) => {
          try {
            set({
              isSaving:
                true,

              error: null,
            });

            const resolvedBoardId =
              await resolveStoredId(
                boardId
              );

            await api.delete(
              `/boards/${resolvedBoardId}/leave`
            );
          } catch (error) {
            set({
              error:
                isNetworkError(
                  error
                )
                  ? "Panodan ayrılmak için internet bağlantısı gereklidir."
                  : error
                      .response
                      ?.data
                      ?.message ||
                    "Panodan ayrılamadı.",
            });

            throw error;
          } finally {
            set({
              isSaving:
                false,
            });
          }
        },

      fetchAssignableUsers:
        async (
          boardId
        ) => {
          const resolvedBoardId =
            await resolveStoredId(
              boardId
            );

          try {
            const response =
              await api.get(
                `/boards/${resolvedBoardId}/assignable-users`
              );

            set({
              assignableUsers:
                response.data,
            });

            await cacheAssignableUsers(
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
                await getCachedAssignableUsers(
                  resolvedBoardId
                );

              set({
                assignableUsers:
                  cached,
              });

              return cached;
            }

            set({
              assignableUsers:
                [],
            });

            throw error;
          }
        },

      clearBoardMembers:
        () => {
          set({
            members: [],

            assignableUsers:
              [],

            error: null,
          });
        },
    })
  );

export default useBoardMemberStore;