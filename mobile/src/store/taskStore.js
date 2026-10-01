import { create } from "zustand";
import api from "../services/api";

const useTaskStore = create((set, get) => ({
  tasksByList: {},

  fetchTasks: async (listId) => {
    const response = await api.get(
      `/lists/${listId}/tasks`
    );

    set({
      tasksByList: {
        ...get().tasksByList,
        [listId]: response.data,
      },
    });

    return response.data;
  },

  createTask: async (listId, data) => {
    const response = await api.post(
      `/lists/${listId}/tasks`,
      data
    );

    const current =
      get().tasksByList[listId] || [];

    set({
      tasksByList: {
        ...get().tasksByList,
        [listId]: [...current, response.data],
      },
    });

    return response.data;
  },

  updateTask: async (taskId, listId, data) => {
    const response = await api.put(
      `/tasks/${taskId}`,
      data
    );

    const current =
      get().tasksByList[listId] || [];

    set({
      tasksByList: {
        ...get().tasksByList,
        [listId]: current.map((task) =>
          task.id === taskId
            ? response.data
            : task
        ),
      },
    });

    return response.data;
  },

  deleteTask: async (taskId, listId) => {
    await api.delete(`/tasks/${taskId}`);

    const current =
      get().tasksByList[listId] || [];

    set({
      tasksByList: {
        ...get().tasksByList,
        [listId]: current.filter(
          (task) => task.id !== taskId
        ),
      },
    });
  },

  clearTasks: () => {
    set({
      tasksByList: {},
    });
  },
}));

export default useTaskStore;