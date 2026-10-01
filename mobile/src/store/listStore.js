import { create } from "zustand";
import api from "../services/api";

const useListStore = create((set, get) => ({
  lists: [],
  isLoading: false,

  fetchLists: async (boardId) => {
    try {
      set({ isLoading: true });

      const response = await api.get(
        `/boards/${boardId}/lists`
      );

      set({
        lists: response.data,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  createList: async (boardId, title) => {
    const response = await api.post(
      `/boards/${boardId}/lists`,
      {
        title,
      }
    );

    set({
      lists: [...get().lists, response.data].sort(
        (a, b) => a.order - b.order
      ),
    });

    return response.data;
  },

  updateList: async (id, data) => {
    const response = await api.put(`/lists/${id}`, data);

    set({
      lists: get()
        .lists.map((list) =>
          list.id === id ? response.data : list
        )
        .sort((a, b) => a.order - b.order),
    });

    return response.data;
  },

  deleteList: async (id) => {
    await api.delete(`/lists/${id}`);

    set({
      lists: get().lists.filter((list) => list.id !== id),
    });
  },

  clearLists: () => {
    set({
      lists: [],
    });
  },
}));

export default useListStore;