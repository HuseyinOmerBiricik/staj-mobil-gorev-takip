import {
  create,
} from "zustand";

import api from "../services/api";

import {
  cacheTasks,
  getCachedTasks,
  createTempId,
  resolveStoredId,
} from "../services/offlineStorage";

import {
  isNetworkError,
  isOfflineNow,
  queueMutation,
} from "./syncStore";

async function saveTasks(
  listId,
  tasks
) {
  const resolvedListId =
    await resolveStoredId(
      listId
    );

  await cacheTasks(
    resolvedListId,
    tasks
  );
}

function reorderTasks(
  tasks
) {
  return tasks.map(
    (task, index) => ({
      ...task,
      order: index,
    })
  );
}

const useTaskStore =
  create(
    (set, get) => ({
      tasksByList:
        {},

      fetchTasks:
        async (
          listId
        ) => {
          const resolvedListId =
            await resolveStoredId(
              listId
            );

          try {
            const response =
              await api.get(
                `/lists/${resolvedListId}/tasks`
              );

            set({
              tasksByList: {
                ...get()
                  .tasksByList,

                [listId]:
                  response.data,
              },
            });

            await cacheTasks(
              resolvedListId,
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
                await getCachedTasks(
                  resolvedListId
                );

              set({
                tasksByList: {
                  ...get()
                    .tasksByList,

                  [listId]:
                    cached,
                },
              });

              return cached;
            }

            throw error;
          }
        },

      createTask:
        async (
          listId,
          data
        ) => {
          const resolvedListId =
            await resolveStoredId(
              listId
            );

          const offline =
            await isOfflineNow();

          if (!offline) {
            try {
              const response =
                await api.post(
                  `/lists/${resolvedListId}/tasks`,
                  data
                );

              const current =
                get()
                  .tasksByList[
                  listId
                ] || [];

              const next = [
                ...current,
                response.data,
              ];

              set({
                tasksByList: {
                  ...get()
                    .tasksByList,

                  [listId]:
                    next,
                },
              });

              await saveTasks(
                listId,
                next
              );

              return response.data;
            } catch (error) {
              if (
                !isNetworkError(
                  error
                )
              ) {
                throw error;
              }
            }
          }

          const current =
            get()
              .tasksByList[
              listId
            ] || [];

          const tempId =
            createTempId();

          const now =
            new Date().toISOString();

          const tempTask = {
            id: tempId,

            listId,

            title:
              data.title,

            description:
              data.description ||
              null,

            assigneeId:
              data.assigneeId ??
              null,

            assignee:
              null,

            priority:
              data.priority ||
              "medium",

            dueDate:
              data.dueDate ||
              null,

            order:
              current.length,

            createdAt:
              now,

            updatedAt:
              now,

            _offline:
              true,
          };

          const next = [
            ...current,
            tempTask,
          ];

          set({
            tasksByList: {
              ...get()
                .tasksByList,

              [listId]:
                next,
            },
          });

          await saveTasks(
            listId,
            next
          );

          await queueMutation({
            method: "post",

            url:
              `/lists/${resolvedListId}/tasks`,

            data,

            entityType:
              "task",

            tempId,
          });

          return tempTask;
        },

      updateTask:
        async (
          taskId,
          listId,
          data
        ) => {
          const resolvedTaskId =
            await resolveStoredId(
              taskId
            );

          const offline =
            await isOfflineNow();

          if (!offline) {
            try {
              const response =
                await api.put(
                  `/tasks/${resolvedTaskId}`,
                  data
                );

              const current =
                get()
                  .tasksByList[
                  listId
                ] || [];

              const next =
                current.map(
                  (task) =>
                    Number(
                      task.id
                    ) ===
                      Number(
                        taskId
                      ) ||
                    Number(
                      task.id
                    ) ===
                      Number(
                        resolvedTaskId
                      )
                      ? response.data
                      : task
                );

              set({
                tasksByList: {
                  ...get()
                    .tasksByList,

                  [listId]:
                    next,
                },
              });

              await saveTasks(
                listId,
                next
              );

              return response.data;
            } catch (error) {
              if (
                !isNetworkError(
                  error
                )
              ) {
                throw error;
              }
            }
          }

          const current =
            get()
              .tasksByList[
              listId
            ] || [];

          const next =
            current.map(
              (task) => {
                const match =
                  Number(
                    task.id
                  ) ===
                    Number(
                      taskId
                    ) ||
                  Number(
                    task.id
                  ) ===
                    Number(
                      resolvedTaskId
                    );

                if (!match) {
                  return task;
                }

                return {
                  ...task,
                  ...data,

                  assignee:
                    data.assigneeId ===
                    task.assigneeId
                      ? task.assignee
                      : null,

                  updatedAt:
                    new Date().toISOString(),

                  _offline:
                    true,
                };
              }
            );

          set({
            tasksByList: {
              ...get()
                .tasksByList,

              [listId]:
                next,
            },
          });

          await saveTasks(
            listId,
            next
          );

          await queueMutation({
            method: "put",

            url:
              `/tasks/${resolvedTaskId}`,

            data,

            entityType:
              "task",
          });

          return next.find(
            (task) =>
              Number(
                task.id
              ) ===
                Number(
                  taskId
                ) ||
              Number(
                task.id
              ) ===
                Number(
                  resolvedTaskId
                )
          );
        },

      deleteTask:
        async (
          taskId,
          listId
        ) => {
          const resolvedTaskId =
            await resolveStoredId(
              taskId
            );

          const offline =
            await isOfflineNow();

          if (!offline) {
            try {
              await api.delete(
                `/tasks/${resolvedTaskId}`
              );

              const current =
                get()
                  .tasksByList[
                  listId
                ] || [];

              const next =
                current.filter(
                  (task) =>
                    Number(
                      task.id
                    ) !==
                      Number(
                        taskId
                      ) &&
                    Number(
                      task.id
                    ) !==
                      Number(
                        resolvedTaskId
                      )
                );

              set({
                tasksByList: {
                  ...get()
                    .tasksByList,

                  [listId]:
                    next,
                },
              });

              await saveTasks(
                listId,
                next
              );

              return;
            } catch (error) {
              if (
                !isNetworkError(
                  error
                )
              ) {
                throw error;
              }
            }
          }

          const current =
            get()
              .tasksByList[
              listId
            ] || [];

          const next =
            current.filter(
              (task) =>
                Number(
                  task.id
                ) !==
                  Number(
                    taskId
                  ) &&
                Number(
                  task.id
                ) !==
                  Number(
                    resolvedTaskId
                  )
            );

          set({
            tasksByList: {
              ...get()
                .tasksByList,

              [listId]:
                next,
            },
          });

          await saveTasks(
            listId,
            next
          );

          await queueMutation({
            method:
              "delete",

            url:
              `/tasks/${resolvedTaskId}`,

            data: null,

            entityType:
              "task",
          });
        },

      moveTask:
        async (
          taskId,
          sourceListId,
          targetListId,
          order
        ) => {
          const resolvedTaskId =
            await resolveStoredId(
              taskId
            );

          const resolvedTargetListId =
            await resolveStoredId(
              targetListId
            );

          const offline =
            await isOfflineNow();

          if (!offline) {
            try {
              await api.patch(
                `/tasks/${resolvedTaskId}/move`,
                {
                  targetListId:
                    resolvedTargetListId,

                  newOrder:
                    order,
                }
              );
            } catch (error) {
              if (
                !isNetworkError(
                  error
                )
              ) {
                throw error;
              }

              await queueMutation({
                method:
                  "patch",

                url:
                  `/tasks/${resolvedTaskId}/move`,

                data: {
                  targetListId:
                    resolvedTargetListId,

                  newOrder:
                    order,
                },

                entityType:
                  "task",
              });
            }
          } else {
            await queueMutation({
              method:
                "patch",

              url:
                `/tasks/${resolvedTaskId}/move`,

              data: {
                targetListId:
                  resolvedTargetListId,

                newOrder:
                  order,
              },

              entityType:
                "task",
            });
          }

          const all =
            get()
              .tasksByList;

          const source =
            [
              ...(
                all[
                  sourceListId
                ] || []
              ),
            ];

          const target =
            sourceListId ===
            targetListId
              ? source
              : [
                  ...(
                    all[
                      targetListId
                    ] || []
                  ),
                ];

          const taskIndex =
            source.findIndex(
              (task) =>
                Number(
                  task.id
                ) ===
                  Number(
                    taskId
                  ) ||
                Number(
                  task.id
                ) ===
                  Number(
                    resolvedTaskId
                  )
            );

          if (
            taskIndex ===
            -1
          ) {
            return;
          }

          const [
            movingTask,
          ] =
            source.splice(
              taskIndex,
              1
            );

          if (
            sourceListId ===
            targetListId
          ) {
            const safeOrder =
              Math.max(
                0,
                Math.min(
                  Number(
                    order
                  ),
                  source.length
                )
              );

            source.splice(
              safeOrder,
              0,
              {
                ...movingTask,

                listId:
                  targetListId,
              }
            );

            const reordered =
              reorderTasks(
                source
              );

            set({
              tasksByList: {
                ...all,

                [sourceListId]:
                  reordered,
              },
            });

            await saveTasks(
              sourceListId,
              reordered
            );

            return;
          }

          const safeOrder =
            Math.max(
              0,
              Math.min(
                Number(
                  order
                ),
                target.length
              )
            );

          target.splice(
            safeOrder,
            0,
            {
              ...movingTask,

              listId:
                targetListId,
            }
          );

          const sourceNext =
            reorderTasks(
              source
            );

          const targetNext =
            reorderTasks(
              target
            );

          set({
            tasksByList: {
              ...all,

              [sourceListId]:
                sourceNext,

              [targetListId]:
                targetNext,
            },
          });

          await Promise.all([
            saveTasks(
              sourceListId,
              sourceNext
            ),

            saveTasks(
              targetListId,
              targetNext
            ),
          ]);
        },

      clearTasks:
        () => {
          set({
            tasksByList:
              {},
          });
        },
    })
  );

export default useTaskStore;