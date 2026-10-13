import {
  create,
} from "zustand";

import api from "../services/api";

function getStartOfDay(
  value
) {
  const date =
    new Date(value);

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}

function getReminderStatus(
  dueDate
) {
  const today =
    getStartOfDay(
      new Date()
    );

  const due =
    getStartOfDay(
      dueDate
    );

  const difference =
    Math.round(
      (
        due.getTime() -
        today.getTime()
      ) /
        86400000
    );

  if (difference < 0) {
    return {
      status:
        "overdue",

      dayDifference:
        difference,
    };
  }

  if (difference === 0) {
    return {
      status:
        "today",

      dayDifference: 0,
    };
  }

  if (difference === 1) {
    return {
      status:
        "tomorrow",

      dayDifference: 1,
    };
  }

  return {
    status:
      "upcoming",

    dayDifference:
      difference,
  };
}

function prepareReminders(
  tasks
) {
  return tasks.map(
    (task) => {
      const info =
        getReminderStatus(
          task.dueDate
        );

      return {
        ...task,

        reminderStatus:
          info.status,

        dayDifference:
          info.dayDifference,
      };
    }
  );
}

function calculateCounts(
  reminders
) {
  const counts = {
    total:
      reminders.length,

    overdue: 0,

    today: 0,

    tomorrow: 0,

    upcoming: 0,
  };

  reminders.forEach(
    (task) => {
      if (
        counts[
          task.reminderStatus
        ] !== undefined
      ) {
        counts[
          task.reminderStatus
        ] += 1;
      }
    }
  );

  return counts;
}

const useReminderStore =
  create(
    (set) => ({
      reminders: [],

      counts: {
        total: 0,
        overdue: 0,
        today: 0,
        tomorrow: 0,
        upcoming: 0,
      },

      isLoading: false,

      error: null,

      fetchReminders:
        async () => {
          try {
            set({
              isLoading: true,
              error: null,
            });

            const response =
              await api.get(
                "/reminders"
              );

            const reminders =
              prepareReminders(
                response.data
              );

            const counts =
              calculateCounts(
                reminders
              );

            set({
              reminders,
              counts,
              error: null,
            });

            return {
              reminders,
              counts,
            };
          } catch (error) {
            const message =
              error.response
                ?.data
                ?.message ||
              "Hatırlatmalar yüklenemedi.";

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

      clearReminders:
        () => {
          set({
            reminders: [],

            counts: {
              total: 0,
              overdue: 0,
              today: 0,
              tomorrow: 0,
              upcoming: 0,
            },

            error: null,
          });
        },
    })
  );

export default useReminderStore;