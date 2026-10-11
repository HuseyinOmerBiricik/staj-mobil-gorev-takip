import { create } from "zustand";

import api from "../services/api";

const useUserStore = create((set) => ({
  users: [],
  isLoading: false,
  error: null,

  fetchUsers: async () => {
    try {
      set({
        isLoading: true,
        error: null,
      });

      const response = await api.get("/users");

      set({
        users: response.data,
        error: null,
      });

      return response.data;
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          "Kullanıcılar yüklenemedi.",
      });

      throw error;
    } finally {
      set({
        isLoading: false,
      });
    }
  },

  clearUsers: () => {
    set({
      users: [],
      error: null,
      isLoading: false,
    });
  },
}));

export default useUserStore;