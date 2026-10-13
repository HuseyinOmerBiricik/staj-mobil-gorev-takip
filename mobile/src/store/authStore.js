import {
  create,
} from "zustand";

import * as SecureStore from "expo-secure-store";

import api, {
  setUnauthorizedHandler,
} from "../services/api";

import {
  cacheUser,
  getCachedUser,
  clearOfflineData,
} from "../services/offlineStorage";

import useSyncStore, {
  isNetworkError,
} from "./syncStore";

const useAuthStore =
  create(
    (set) => ({
      user: null,

      isLoading: true,

      login: async (
        email,
        password
      ) => {
        const response =
          await api.post(
            "/auth/login",
            {
              email,
              password,
            }
          );

        const {
          token,
          user,
        } =
          response.data;

        await SecureStore.setItemAsync(
          "token",
          token
        );

        await cacheUser(
          user
        );

        set({
          user,
          isLoading:
            false,
        });

        return user;
      },

      checkAuth:
        async () => {
          const token =
            await SecureStore.getItemAsync(
              "token"
            );

          if (!token) {
            set({
              user: null,
              isLoading:
                false,
            });

            return;
          }

          try {
            const response =
              await api.get(
                "/auth/me"
              );

            await cacheUser(
              response.data
            );

            set({
              user:
                response.data,

              isLoading:
                false,
            });
          } catch (error) {
            if (
              isNetworkError(
                error
              )
            ) {
              const cachedUser =
                await getCachedUser();

              set({
                user:
                  cachedUser,

                isLoading:
                  false,
              });

              return;
            }

            await SecureStore.deleteItemAsync(
              "token"
            );

            set({
              user: null,
              isLoading:
                false,
            });
          }
        },

      logout:
        async () => {
          await SecureStore.deleteItemAsync(
            "token"
          );

          await clearOfflineData();

          await useSyncStore
            .getState()
            .refreshPendingCount();

          set({
            user: null,
            isLoading:
              false,
          });
        },
    })
  );

setUnauthorizedHandler(
  () => {
    useAuthStore.setState({
      user: null,
      isLoading: false,
    });
  }
);

export default useAuthStore;