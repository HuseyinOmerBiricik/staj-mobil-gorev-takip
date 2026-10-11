import { create } from "zustand";
import api from "../services/api";

const useBoardStore = create((set, get) => ({
  boards: [],
  isLoading: false,
  error: null,

  fetchBoards: async () => {
    try {
      set({
        isLoading: true,
        error: null,
      });

      const response = await api.get(
        "/boards"
      );

      set({
        boards: response.data,
        error: null,
      });
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          "Panolar yüklenemedi.",
      });

      throw error;
    } finally {
      set({
        isLoading: false,
      });
    }
  },

  createBoard: async (
    title,
    description
  ) => {
    const response = await api.post(
      "/boards",
      {
        title,
        description,
      }
    );

    set({
      boards: [
        response.data,
        ...get().boards,
      ],
    });

    return response.data;
  },

  updateBoard: async (
    id,
    title,
    description
  ) => {
    const response = await api.put(
      `/boards/${id}`,
      {
        title,
        description,
      }
    );

    set({
      boards: get().boards.map(
        (board) =>
          board.id === id
            ? response.data
            : board
      ),
    });

    return response.data;
  },

  deleteBoard: async (id) => {
    await api.delete(
      `/boards/${id}`
    );

    set({
      boards: get().boards.filter(
        (board) =>
          board.id !== id
      ),
    });
  },

  clearError: () => {
    set({
      error: null,
    });
  },
}));

export default useBoardStore;