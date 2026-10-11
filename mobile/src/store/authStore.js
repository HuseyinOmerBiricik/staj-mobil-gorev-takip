import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

import api, {
  setUnauthorizedHandler,
} from "../services/api";

const useAuthStore = create((set) => ({
  user: null,
  isLoading: true,

  login: async (email, password) => {
    const response = await api.post(
      "/auth/login",
      {
        email,
        password,
      }
    );

    const { token, user } = response.data;

    await SecureStore.setItemAsync(
      "token",
      token
    );

    set({
      user,
      isLoading: false,
    });

    return user;
  },

  checkAuth: async () => {
    try {
      const token =
        await SecureStore.getItemAsync(
          "token"
        );

      if (!token) {
        set({
          user: null,
          isLoading: false,
        });

        return;
      }

      const response =
        await api.get("/auth/me");

      set({
        user: response.data,
        isLoading: false,
      });
    } catch (error) {
      await SecureStore.deleteItemAsync(
        "token"
      );

      set({
        user: null,
        isLoading: false,
      });
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(
      "token"
    );

    set({
      user: null,
      isLoading: false,
    });
  },
}));

setUnauthorizedHandler(() => {
  useAuthStore.setState({
    user: null,
    isLoading: false,
  });
});

export default useAuthStore;