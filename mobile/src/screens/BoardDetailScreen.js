import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";

import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";

import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import {
  useFocusEffect,
} from "@react-navigation/native";

import useListStore from "../store/listStore";
import useTaskStore from "../store/taskStore";

import {
  useAppTheme,
} from "../theme/theme";

function measureView(ref) {
  return new Promise((resolve) => {
    if (!ref) {
      resolve(null);
      return;
    }

    ref.measureInWindow(
      (x, y, width, height) => {
        resolve({
          x,
          y,
          width,
          height,
        });
      }
    );
  });
}

function isInside(
  x,
  y,
  measurement
) {
  if (!measurement) {
    return false;
  }

  return (
    x >= measurement.x &&
    x <=
      measurement.x +
        measurement.width &&
    y >= measurement.y &&
    y <=
      measurement.y +
        measurement.height
  );
}

function ChoiceChip({
  label,
  selected,
  onPress,
  styles,
}) {
  return (
    <TouchableOpacity
      style={[
        styles.choiceChip,
        selected &&
          styles.choiceChipSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.choiceChipText,
          selected &&
            styles.choiceChipTextSelected,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function TaskCard({
  task,
  listId,
  boardId,
  navigation,
  taskRefs,
  dragX,
  dragY,
  startDrag,
  updateDrag,
  finishDrag,
  isDragging,
  dragEnabled,
  styles,
}) {
  const pressed =
    useSharedValue(false);

  const registerRef = (ref) => {
    if (
      !taskRefs.current[listId]
    ) {
      taskRefs.current[listId] =
        {};
    }

    taskRefs.current[
      listId
    ][task.id] = ref;
  };

  const gesture =
    Gesture.Pan()
      .activateAfterLongPress(280)

      .onStart((event) => {
        pressed.value = true;

        dragX.value =
          event.absoluteX;

        dragY.value =
          event.absoluteY;

        runOnJS(startDrag)(
          task,
          listId
        );
      })

      .onUpdate((event) => {
        dragX.value =
          event.absoluteX;

        dragY.value =
          event.absoluteY;

        runOnJS(updateDrag)(
          event.absoluteX,
          event.absoluteY
        );
      })

      .onEnd((event) => {
        runOnJS(finishDrag)(
          task,
          listId,
          event.absoluteX,
          event.absoluteY
        );
      })

      .onFinalize(() => {
        pressed.value = false;
      });

  const animatedStyle =
    useAnimatedStyle(() => ({
      transform: [
        {
          scale:
            pressed.value
              ? 0.97
              : 1,
        },
      ],
    }));

  const priorityLabel =
    task.priority === "high"
      ? "Yüksek"
      : task.priority === "low"
      ? "Düşük"
      : "Orta";

  const openTask = () => {
    if (isDragging) {
      return;
    }

    navigation.navigate(
      "TaskDetail",
      {
        task,
        listId,
        boardId,
      }
    );
  };

  const content = (
    <>
      <View
        style={
          styles.taskTopRow
        }
      >
        <Text
          style={
            styles.taskTitle
          }
          numberOfLines={2}
        >
          {task.title}
        </Text>

        {task._offline ? (
          <View
            style={
              styles.offlineBadge
            }
          >
            <Text
              style={
                styles.offlineBadgeText
              }
            >
              Bekliyor
            </Text>
          </View>
        ) : null}
      </View>

      <View
        style={
          styles.taskMetaRow
        }
      >
        <View
          style={
            styles.metaChip
          }
        >
          <Text
            style={
              styles.metaChipText
            }
          >
            {priorityLabel}
          </Text>
        </View>

        {task.dueDate ? (
          <View
            style={
              styles.metaChip
            }
          >
            <Text
              style={
                styles.metaChipText
              }
            >
              {new Date(
                task.dueDate
              ).toLocaleDateString(
                "tr-TR"
              )}
            </Text>
          </View>
        ) : null}
      </View>

      <Text
        style={
          styles.taskAssignee
        }
        numberOfLines={1}
      >
        {task.assignee?.name ||
          "Atanmamış"}
      </Text>

      {dragEnabled ? (
        <Text
          style={
            styles.dragHint
          }
        >
          Basılı tutup sürükle
        </Text>
      ) : null}
    </>
  );

  return (
    <View
      ref={registerRef}
      collapsable={false}
    >
      {dragEnabled ? (
        <GestureDetector
          gesture={gesture}
        >
          <Animated.View
            style={[
              styles.taskCard,

              isDragging &&
                styles.draggingSourceCard,

              animatedStyle,
            ]}
          >
            <TouchableOpacity
              onPress={
                openTask
              }
              activeOpacity={0.82}
            >
              {content}
            </TouchableOpacity>
          </Animated.View>
        </GestureDetector>
      ) : (
        <TouchableOpacity
          style={
            styles.taskCard
          }
          onPress={
            openTask
          }
          activeOpacity={0.82}
        >
          {content}
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function BoardDetailScreen({
  route,
  navigation,
}) {
  const { board } =
    route.params;

  const {
    colors,
  } = useAppTheme();

  const styles =
    createStyles(colors);

  const {
    width: screenWidth,
  } = useWindowDimensions();

  const rootRef =
    useRef(null);

  const boardScrollRef =
    useRef(null);

  const columnRefs =
    useRef({});

  const taskRefs =
    useRef({});

  const trashRef =
    useRef(null);

  const boardScrollX =
    useRef(0);

  const lastAutoScroll =
    useRef(0);

  const dragX =
    useSharedValue(-1000);

  const dragY =
    useSharedValue(-1000);

  const rootX =
    useSharedValue(0);

  const rootY =
    useSharedValue(0);

  const lists =
    useListStore(
      (state) => state.lists
    );

  const isLoading =
    useListStore(
      (state) =>
        state.isLoading
    );

  const fetchLists =
    useListStore(
      (state) =>
        state.fetchLists
    );

  const createList =
    useListStore(
      (state) =>
        state.createList
    );

  const updateList =
    useListStore(
      (state) =>
        state.updateList
    );

  const deleteList =
    useListStore(
      (state) =>
        state.deleteList
    );

  const clearLists =
    useListStore(
      (state) =>
        state.clearLists
    );

  const tasksByList =
    useTaskStore(
      (state) =>
        state.tasksByList
    );

  const fetchTasks =
    useTaskStore(
      (state) =>
        state.fetchTasks
    );

  const moveTask =
    useTaskStore(
      (state) =>
        state.moveTask
    );

  const deleteTask =
    useTaskStore(
      (state) =>
        state.deleteTask
    );

  const clearTasks =
    useTaskStore(
      (state) =>
        state.clearTasks
    );

  const [
    draggingTask,
    setDraggingTask,
  ] =
    useState(null);

  const [
    hoveredListId,
    setHoveredListId,
  ] =
    useState(null);

  const [
    trashHovered,
    setTrashHovered,
  ] =
    useState(false);

  const [
    modalVisible,
    setModalVisible,
  ] =
    useState(false);

  const [
    filterModalVisible,
    setFilterModalVisible,
  ] =
    useState(false);

  const [
    editingList,
    setEditingList,
  ] =
    useState(null);

  const [
    title,
    setTitle,
  ] =
    useState("");

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    searchText,
    setSearchText,
  ] =
    useState("");

  const [
    priorityFilter,
    setPriorityFilter,
  ] =
    useState("all");

  const [
    assigneeFilter,
    setAssigneeFilter,
  ] =
    useState("all");

  const filtersActive =
    searchText.trim() !== "" ||
    priorityFilter !== "all" ||
    assigneeFilter !== "all";

  const activeFilterCount =
    (priorityFilter !== "all"
      ? 1
      : 0) +
    (assigneeFilter !== "all"
      ? 1
      : 0);

  const assignees =
    useMemo(() => {
      const result = [];

      Object.values(
        tasksByList
      ).forEach((tasks) => {
        tasks.forEach(
          (task) => {
            if (
              task.assignee &&
              !result.some(
                (user) =>
                  Number(
                    user.id
                  ) ===
                  Number(
                    task
                      .assignee
                      .id
                  )
              )
            ) {
              result.push(
                task.assignee
              );
            }
          }
        );
      });

      result.sort(
        (a, b) =>
          a.name.localeCompare(
            b.name,
            "tr"
          )
      );

      return result;
    }, [
      tasksByList,
    ]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadBoard =
        async () => {
          try {
            const boardLists =
              await fetchLists(
                board.id
              );

            if (!active) {
              return;
            }

            await Promise.all(
              boardLists.map(
                (list) =>
                  fetchTasks(
                    list.id
                  )
              )
            );
          } catch (error) {
            if (active) {
              Alert.alert(
                "Hata",
                error.response?.data
                  ?.message ||
                  "Pano bilgileri yüklenemedi."
              );
            }
          }
        };

      loadBoard();

      return () => {
        active = false;

        clearLists();
        clearTasks();

        columnRefs.current =
          {};

        taskRefs.current =
          {};

        setDraggingTask(
          null
        );
      };
    }, [
      board.id,
      fetchLists,
      fetchTasks,
      clearLists,
      clearTasks,
    ])
  );

  const measureRoot =
    () => {
      if (!rootRef.current) {
        return;
      }

      rootRef.current.measureInWindow(
        (x, y) => {
          rootX.value = x;
          rootY.value = y;
        }
      );
    };

  const startDrag =
    (
      task,
      listId
    ) => {
      measureRoot();

      setDraggingTask({
        task,
        sourceListId:
          listId,
      });

      setHoveredListId(
        null
      );

      setTrashHovered(
        false
      );
    };

  const findHoveredTarget =
    async (
      absoluteX,
      absoluteY
    ) => {
      const trash =
        await measureView(
          trashRef.current
        );

      if (
        isInside(
          absoluteX,
          absoluteY,
          trash
        )
      ) {
        setTrashHovered(
          true
        );

        setHoveredListId(
          null
        );

        return;
      }

      setTrashHovered(
        false
      );

      for (
        const list of lists
      ) {
        const measurement =
          await measureView(
            columnRefs.current[
              list.id
            ]
          );

        if (
          isInside(
            absoluteX,
            absoluteY,
            measurement
          )
        ) {
          setHoveredListId(
            list.id
          );

          return;
        }
      }

      setHoveredListId(
        null
      );
    };

  const handleAutoScroll =
    (
      absoluteX
    ) => {
      if (
        !draggingTask
      ) {
        return;
      }

      const now =
        Date.now();

      if (
        now -
          lastAutoScroll.current <
        90
      ) {
        return;
      }

      const edgeSize =
        70;

      let nextX =
        boardScrollX.current;

      if (
        absoluteX >
        screenWidth -
          edgeSize
      ) {
        nextX += 70;
      } else if (
        absoluteX <
        edgeSize
      ) {
        nextX -= 70;
      } else {
        return;
      }

      nextX =
        Math.max(
          0,
          nextX
        );

      boardScrollX.current =
        nextX;

      boardScrollRef.current?.scrollTo(
        {
          x: nextX,
          animated:
            true,
        }
      );

      lastAutoScroll.current =
        now;
    };

  const updateDrag =
    (
      absoluteX,
      absoluteY
    ) => {
      handleAutoScroll(
        absoluteX
      );

      findHoveredTarget(
        absoluteX,
        absoluteY
      );
    };

  const calculateDropOrder =
    async (
      targetListId,
      draggedTaskId,
      absoluteY
    ) => {
      const targetTasks =
        tasksByList[
          targetListId
        ] || [];

      const filtered =
        targetTasks.filter(
          (item) =>
            Number(
              item.id
            ) !==
            Number(
              draggedTaskId
            )
        );

      let newOrder =
        filtered.length;

      const refs =
        taskRefs.current[
          targetListId
        ] || {};

      for (
        let index = 0;
        index <
        filtered.length;
        index++
      ) {
        const task =
          filtered[index];

        const measurement =
          await measureView(
            refs[task.id]
          );

        if (!measurement) {
          continue;
        }

        const middle =
          measurement.y +
          measurement.height /
            2;

        if (
          absoluteY <
          middle
        ) {
          newOrder =
            index;

          break;
        }
      }

      return newOrder;
    };

  const confirmTaskDelete =
    (
      task,
      listId
    ) => {
      Alert.alert(
        "Görevi Sil",
        `"${task.title}" görevini silmek istediğinize emin misiniz?`,
        [
          {
            text: "İptal",
            style: "cancel",
          },

          {
            text: "Sil",
            style:
              "destructive",

            onPress:
              async () => {
                try {
                  await deleteTask(
                    task.id,
                    listId
                  );
                } catch (
                  error
                ) {
                  Alert.alert(
                    "Hata",
                    error.response
                      ?.data
                      ?.message ||
                      "Görev silinemedi."
                  );
                }
              },
          },
        ]
      );
    };

  const finishDrag =
    async (
      task,
      sourceListId,
      absoluteX,
      absoluteY
    ) => {
      try {
        const trash =
          await measureView(
            trashRef.current
          );

        if (
          isInside(
            absoluteX,
            absoluteY,
            trash
          )
        ) {
          setDraggingTask(
            null
          );

          setTrashHovered(
            false
          );

          setHoveredListId(
            null
          );

          confirmTaskDelete(
            task,
            sourceListId
          );

          return;
        }

        let targetListId =
          null;

        for (
          const list of lists
        ) {
          const measurement =
            await measureView(
              columnRefs.current[
                list.id
              ]
            );

          if (
            isInside(
              absoluteX,
              absoluteY,
              measurement
            )
          ) {
            targetListId =
              list.id;

            break;
          }
        }

        if (
          targetListId ===
          null
        ) {
          return;
        }

        const newOrder =
          await calculateDropOrder(
            targetListId,
            task.id,
            absoluteY
          );

        const sourceTasks =
          tasksByList[
            sourceListId
          ] || [];

        const oldIndex =
          sourceTasks.findIndex(
            (item) =>
              Number(
                item.id
              ) ===
              Number(
                task.id
              )
          );

        if (
          Number(
            targetListId
          ) ===
            Number(
              sourceListId
            ) &&
          newOrder ===
            oldIndex
        ) {
          return;
        }

        await moveTask(
          task.id,
          sourceListId,
          targetListId,
          newOrder
        );
      } catch (error) {
        Alert.alert(
          "Hata",
          error.response?.data
            ?.message ||
            "Görev taşınamadı."
        );
      } finally {
        setDraggingTask(
          null
        );

        setHoveredListId(
          null
        );

        setTrashHovered(
          false
        );

        dragX.value =
          -1000;

        dragY.value =
          -1000;
      }
    };

  const ghostStyle =
    useAnimatedStyle(
      () => ({
        transform: [
          {
            translateX:
              dragX.value -
              rootX.value -
              125,
          },

          {
            translateY:
              dragY.value -
              rootY.value -
              65,
          },

          {
            scale:
              withSpring(
                draggingTask
                  ? 1.04
                  : 1
              ),
          },
        ],
      }),
      [
        draggingTask,
      ]
    );

  const openCreateModal =
    () => {
      setEditingList(
        null
      );

      setTitle("");

      setModalVisible(
        true
      );
    };

  const openEditModal =
    (list) => {
      setEditingList(
        list
      );

      setTitle(
        list.title
      );

      setModalVisible(
        true
      );
    };

  const closeModal =
    () => {
      if (saving) {
        return;
      }

      setModalVisible(
        false
      );

      setEditingList(
        null
      );

      setTitle("");
    };

  const handleSave =
    async () => {
      const cleanTitle =
        title.trim();

      if (!cleanTitle) {
        Alert.alert(
          "Hata",
          "Kolon başlığı zorunludur."
        );

        return;
      }

      if (
        cleanTitle.length >
        50
      ) {
        Alert.alert(
          "Hata",
          "Kolon başlığı en fazla 50 karakter olabilir."
        );

        return;
      }

      try {
        setSaving(
          true
        );

        if (
          editingList
        ) {
          await updateList(
            editingList.id,
            {
              title:
                cleanTitle,
            }
          );
        } else {
          await createList(
            board.id,
            cleanTitle
          );
        }

        setModalVisible(
          false
        );

        setEditingList(
          null
        );

        setTitle("");
      } catch (error) {
        Alert.alert(
          "Hata",
          error.response?.data
            ?.message ||
            "İşlem başarısız."
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  const handleDeleteList =
    (list) => {
      Alert.alert(
        "Kolonu Sil",
        `"${list.title}" kolonunu ve içindeki görevleri silmek istediğinize emin misiniz?`,
        [
          {
            text: "İptal",
            style: "cancel",
          },

          {
            text: "Sil",
            style:
              "destructive",

            onPress:
              async () => {
                try {
                  await deleteList(
                    list.id
                  );
                } catch (
                  error
                ) {
                  Alert.alert(
                    "Hata",
                    error.response
                      ?.data
                      ?.message ||
                      "Kolon silinemedi."
                  );
                }
              },
          },
        ]
      );
    };

  const filterTasks =
    (tasks) => {
      const cleanSearch =
        searchText
          .trim()
          .toLocaleLowerCase(
            "tr-TR"
          );

      return tasks.filter(
        (task) => {
          const searchable =
            `${
              task.title || ""
            } ${
              task.description ||
              ""
            }`
              .toLocaleLowerCase(
                "tr-TR"
              );

          const searchMatch =
            cleanSearch ===
              "" ||
            searchable.includes(
              cleanSearch
            );

          const priorityMatch =
            priorityFilter ===
              "all" ||
            task.priority ===
              priorityFilter;

          let assigneeMatch =
            true;

          if (
            assigneeFilter ===
            "unassigned"
          ) {
            assigneeMatch =
              !task.assigneeId;
          } else if (
            assigneeFilter !==
            "all"
          ) {
            assigneeMatch =
              Number(
                task.assigneeId
              ) ===
              Number(
                assigneeFilter
              );
          }

          return (
            searchMatch &&
            priorityMatch &&
            assigneeMatch
          );
        }
      );
    };

  const clearFilters =
    () => {
      setSearchText("");

      setPriorityFilter(
        "all"
      );

      setAssigneeFilter(
        "all"
      );
    };

  return (
    <View
      ref={rootRef}
      collapsable={false}
      onLayout={
        measureRoot
      }
      style={
        styles.container
      }
    >
      <View
        style={
          styles.header
        }
      >
        <View
          style={
            styles.titleRow
          }
        >
          <TouchableOpacity
            style={
              styles.backButton
            }
            onPress={() =>
              navigation.goBack()
            }
          >
            <Text
              style={
                styles.backText
              }
            >
              ‹
            </Text>
          </TouchableOpacity>

          <View
            style={
              styles.titleArea
            }
          >
            <Text
              style={
                styles.boardTitle
              }
              numberOfLines={1}
            >
              {board.title}
            </Text>

            {board.description ? (
              <Text
                style={
                  styles.boardDescription
                }
                numberOfLines={1}
              >
                {
                  board.description
                }
              </Text>
            ) : null}
          </View>
        </View>

        <View
          style={
            styles.actionRow
          }
        >
          <TouchableOpacity
            style={
              styles.primaryAction
            }
            onPress={
              openCreateModal
            }
          >
            <Text
              style={
                styles.primaryActionText
              }
            >
              + Kolon
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={
              styles.secondaryAction
            }
            onPress={() =>
              navigation.navigate(
                "BoardMembers",
                {
                  board,
                }
              )
            }
          >
            <Text
              style={
                styles.secondaryActionText
              }
            >
              Üyeler
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={
            styles.searchRow
          }
        >
          <TextInput
            style={
              styles.searchInput
            }
            placeholder="Görev ara..."
            placeholderTextColor={
              colors.secondaryText
            }
            value={
              searchText
            }
            onChangeText={
              setSearchText
            }
          />

          <TouchableOpacity
            style={[
              styles.filterButton,

              activeFilterCount >
                0 &&
                styles.filterButtonActive,
            ]}
            onPress={() =>
              setFilterModalVisible(
                true
              )
            }
          >
            <Text
              style={[
                styles.filterButtonText,

                activeFilterCount >
                  0 &&
                  styles.filterButtonTextActive,
              ]}
            >
              Filtre
              {activeFilterCount >
              0
                ? ` ${activeFilterCount}`
                : ""}
            </Text>
          </TouchableOpacity>
        </View>

        {filtersActive ? (
          <View
            style={
              styles.filterStatus
            }
          >
            <Text
              style={
                styles.filterStatusText
              }
            >
              Filtre aktif · sürükle bırak kapalı
            </Text>

            <TouchableOpacity
              onPress={
                clearFilters
              }
            >
              <Text
                style={
                  styles.clearText
                }
              >
                Temizle
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text
            style={
              styles.dragInfo
            }
          >
            Göreve basılı tutup istediğin kolona sürükleyebilirsin.
          </Text>
        )}
      </View>

      {isLoading &&
      lists.length ===
        0 ? (
        <View
          style={
            styles.center
          }
        >
          <ActivityIndicator
            size="large"
            color={
              colors.text
            }
          />
        </View>
      ) : lists.length ===
        0 ? (
        <View
          style={
            styles.center
          }
        >
          <Text
            style={
              styles.emptyTitle
            }
          >
            Henüz kolon yok
          </Text>
        </View>
      ) : (
        <View
          style={
            styles.boardArea
          }
        >
          <ScrollView
            ref={
              boardScrollRef
            }
            horizontal
            scrollEnabled={
              !draggingTask
            }
            showsHorizontalScrollIndicator={
              false
            }
            onScroll={(
              event
            ) => {
              boardScrollX.current =
                event.nativeEvent
                  .contentOffset.x;
            }}
            scrollEventThrottle={
              16
            }
            contentContainerStyle={
              styles.boardContent
            }
          >
            {lists.map(
              (list) => {
                const listTasks =
                  tasksByList[
                    list.id
                  ] || [];

                const visibleTasks =
                  filterTasks(
                    listTasks
                  );

                const isHovered =
                  Number(
                    hoveredListId
                  ) ===
                  Number(
                    list.id
                  );

                return (
                  <View
                    key={
                      list.id
                    }
                    ref={(
                      ref
                    ) => {
                      columnRefs.current[
                        list.id
                      ] =
                        ref;
                    }}
                    collapsable={
                      false
                    }
                    style={[
                      styles.column,

                      isHovered &&
                        styles.columnHovered,
                    ]}
                  >
                    <View
                      style={
                        styles.columnHeader
                      }
                    >
                      <View
                        style={
                          styles.columnTitleRow
                        }
                      >
                        <Text
                          style={
                            styles.columnTitle
                          }
                          numberOfLines={
                            1
                          }
                        >
                          {
                            list.title
                          }
                        </Text>

                        <View
                          style={
                            styles.countBadge
                          }
                        >
                          <Text
                            style={
                              styles.countText
                            }
                          >
                            {
                              visibleTasks.length
                            }
                          </Text>
                        </View>
                      </View>

                      <View
                        style={
                          styles.columnActions
                        }
                      >
                        <TouchableOpacity
                          onPress={() =>
                            openEditModal(
                              list
                            )
                          }
                        >
                          <Text
                            style={
                              styles.columnEdit
                            }
                          >
                            Düzenle
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() =>
                            handleDeleteList(
                              list
                            )
                          }
                        >
                          <Text
                            style={
                              styles.columnDelete
                            }
                          >
                            Sil
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <ScrollView
                      style={
                        styles.taskScroll
                      }
                      nestedScrollEnabled
                      scrollEnabled={
                        !draggingTask
                      }
                      showsVerticalScrollIndicator={
                        false
                      }
                    >
                      {visibleTasks.map(
                        (task) => (
                          <TaskCard
                            key={
                              task.id
                            }
                            task={
                              task
                            }
                            listId={
                              list.id
                            }
                            boardId={
                              board.id
                            }
                            navigation={
                              navigation
                            }
                            taskRefs={
                              taskRefs
                            }
                            dragX={
                              dragX
                            }
                            dragY={
                              dragY
                            }
                            startDrag={
                              startDrag
                            }
                            updateDrag={
                              updateDrag
                            }
                            finishDrag={
                              finishDrag
                            }
                            isDragging={
                              Number(
                                draggingTask
                                  ?.task
                                  ?.id
                              ) ===
                              Number(
                                task.id
                              )
                            }
                            dragEnabled={
                              !filtersActive
                            }
                            styles={
                              styles
                            }
                          />
                        )
                      )}

                      {visibleTasks.length ===
                      0 ? (
                        <View
                          style={
                            styles.noTask
                          }
                        >
                          <Text
                            style={
                              styles.noTaskText
                            }
                          >
                            {filtersActive
                              ? "Eşleşen görev yok."
                              : "Henüz görev yok."}
                          </Text>
                        </View>
                      ) : null}
                    </ScrollView>

                    <TouchableOpacity
                      style={
                        styles.addTaskButton
                      }
                      onPress={() =>
                        navigation.navigate(
                          "TaskForm",
                          {
                            listId:
                              list.id,

                            boardId:
                              board.id,
                          }
                        )
                      }
                    >
                      <Text
                        style={
                          styles.addTaskText
                        }
                      >
                        + Görev Ekle
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              }
            )}
          </ScrollView>
        </View>
      )}

      {draggingTask ? (
        <>
          <View
            pointerEvents="none"
            style={
              styles.dragBanner
            }
          >
            <Text
              style={
                styles.dragBannerText
              }
            >
              Kolonun üzerine bırak · silmek için çöpe sürükle
            </Text>
          </View>

          <Animated.View
            pointerEvents="none"
            style={[
              styles.dragGhost,
              ghostStyle,
            ]}
          >
            <Text
              style={
                styles.dragGhostTitle
              }
              numberOfLines={2}
            >
              {
                draggingTask
                  .task.title
              }
            </Text>

            <Text
              style={
                styles.dragGhostMeta
              }
            >
              {draggingTask
                  .task
                  .assignee
                  ?.name ||
                "Atanmamış"}
            </Text>
          </Animated.View>

          <View
            pointerEvents="none"
            style={
              styles.trashWrapper
            }
          >
            <View
              ref={
                trashRef
              }
              collapsable={
                false
              }
              style={[
                styles.trashZone,

                trashHovered &&
                  styles.trashZoneHovered,
              ]}
            >
              <Text
                style={
                  styles.trashIcon
                }
              >
                🗑
              </Text>

              <Text
                style={
                  styles.trashText
                }
              >
                Görevi Sil
              </Text>
            </View>
          </View>
        </>
      ) : null}

      <Modal
        visible={
          filterModalVisible
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setFilterModalVisible(
            false
          )
        }
      >
        <View
          style={
            styles.filterOverlay
          }
        >
          <View
            style={
              styles.filterSheet
            }
          >
            <Text
              style={
                styles.sheetTitle
              }
            >
              Filtreler
            </Text>

            <Text
              style={
                styles.filterSectionTitle
              }
            >
              Öncelik
            </Text>

            <View
              style={
                styles.chips
              }
            >
              {[
                [
                  "all",
                  "Tümü",
                ],
                [
                  "low",
                  "Düşük",
                ],
                [
                  "medium",
                  "Orta",
                ],
                [
                  "high",
                  "Yüksek",
                ],
              ].map(
                ([
                  value,
                  label,
                ]) => (
                  <ChoiceChip
                    key={
                      value
                    }
                    label={
                      label
                    }
                    selected={
                      priorityFilter ===
                      value
                    }
                    onPress={() =>
                      setPriorityFilter(
                        value
                      )
                    }
                    styles={
                      styles
                    }
                  />
                )
              )}
            </View>

            <Text
              style={
                styles.filterSectionTitle
              }
            >
              Atanan Kişi
            </Text>

            <ScrollView
              style={{
                maxHeight:
                  220,
              }}
            >
              <View
                style={
                  styles.chips
                }
              >
                <ChoiceChip
                  label="Tümü"
                  selected={
                    assigneeFilter ===
                    "all"
                  }
                  onPress={() =>
                    setAssigneeFilter(
                      "all"
                    )
                  }
                  styles={
                    styles
                  }
                />

                <ChoiceChip
                  label="Atanmamış"
                  selected={
                    assigneeFilter ===
                    "unassigned"
                  }
                  onPress={() =>
                    setAssigneeFilter(
                      "unassigned"
                    )
                  }
                  styles={
                    styles
                  }
                />

                {assignees.map(
                  (user) => (
                    <ChoiceChip
                      key={
                        user.id
                      }
                      label={
                        user.name
                      }
                      selected={
                        assigneeFilter ===
                        String(
                          user.id
                        )
                      }
                      onPress={() =>
                        setAssigneeFilter(
                          String(
                            user.id
                          )
                        )
                      }
                      styles={
                        styles
                      }
                    />
                  )
                )}
              </View>
            </ScrollView>

            <View
              style={
                styles.filterFooter
              }
            >
              <TouchableOpacity
                style={
                  styles.resetButton
                }
                onPress={
                  clearFilters
                }
              >
                <Text
                  style={
                    styles.resetText
                  }
                >
                  Temizle
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  styles.applyButton
                }
                onPress={() =>
                  setFilterModalVisible(
                    false
                  )
                }
              >
                <Text
                  style={
                    styles.applyText
                  }
                >
                  Uygula
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={
          modalVisible
        }
        transparent
        animationType="fade"
        onRequestClose={
          closeModal
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={
              styles.modal
            }
          >
            <Text
              style={
                styles.modalTitle
              }
            >
              {editingList
                ? "Kolonu Düzenle"
                : "Yeni Kolon"}
            </Text>

            <TextInput
              style={
                styles.input
              }
              value={
                title
              }
              onChangeText={
                setTitle
              }
              placeholder="Kolon başlığı"
              placeholderTextColor={
                colors.secondaryText
              }
              maxLength={50}
            />

            <View
              style={
                styles.modalActions
              }
            >
              <TouchableOpacity
                style={
                  styles.cancelButton
                }
                onPress={
                  closeModal
                }
              >
                <Text
                  style={
                    styles.cancelText
                  }
                >
                  İptal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  styles.saveButton
                }
                onPress={
                  handleSave
                }
              >
                {saving ? (
                  <ActivityIndicator
                    color={
                      colors.onPrimary
                    }
                  />
                ) : (
                  <Text
                    style={
                      styles.saveText
                    }
                  >
                    Kaydet
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function createStyles(
  colors
) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        colors.background,
    },

    header: {
      paddingTop: 48,
      paddingHorizontal: 16,
      paddingBottom: 8,
    },

    titleRow: {
      flexDirection: "row",
      alignItems: "center",
    },

    backButton: {
      width: 42,
      height: 42,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 12,
      backgroundColor:
        colors.card,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },

    backText: {
      color: colors.text,
      fontSize: 30,
      lineHeight: 30,
    },

    titleArea: {
      flex: 1,
    },

    boardTitle: {
      color: colors.text,
      fontSize: 25,
      fontWeight: "700",
    },

    boardDescription: {
      color:
        colors.secondaryText,
      fontSize: 12,
      marginTop: 2,
    },

    actionRow: {
      flexDirection: "row",
      gap: 8,
      marginTop: 14,
    },

    primaryAction: {
      flex: 1,
      height: 43,
      backgroundColor:
        colors.primary,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },

    primaryActionText: {
      color:
        colors.onPrimary,
      fontWeight: "700",
    },

    secondaryAction: {
      flex: 1,
      height: 43,
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.card,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },

    secondaryActionText: {
      color: colors.text,
      fontWeight: "700",
    },

    searchRow: {
      flexDirection: "row",
      gap: 8,
      marginTop: 10,
    },

    searchInput: {
      flex: 1,
      height: 44,
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.input,
      color: colors.text,
      borderRadius: 10,
      paddingHorizontal: 13,
    },

    filterButton: {
      minWidth: 78,
      height: 44,
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.card,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },

    filterButtonActive: {
      backgroundColor:
        colors.primary,
      borderColor:
        colors.primary,
    },

    filterButtonText: {
      color: colors.text,
      fontWeight: "700",
    },

    filterButtonTextActive: {
      color:
        colors.onPrimary,
    },

    filterStatus: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      marginTop: 6,
    },

    filterStatusText: {
      color:
        colors.secondaryText,
      fontSize: 10,
    },

    clearText: {
      color: colors.text,
      fontSize: 10,
      fontWeight: "700",
    },

    dragInfo: {
      color:
        colors.secondaryText,
      fontSize: 10,
      marginTop: 6,
    },

    boardArea: {
      flex: 1,
      minHeight: 0,
    },

    boardContent: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      gap: 12,
      alignItems: "stretch",
    },

    column: {
      width: 286,
      alignSelf: "stretch",
      backgroundColor:
        colors.surface,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 14,
      padding: 12,
    },

    columnHovered: {
      borderWidth: 2,
      borderColor:
        colors.primary,
    },

    columnHeader: {
      marginBottom: 10,
    },

    columnTitleRow: {
      flexDirection: "row",
      alignItems: "center",
    },

    columnTitle: {
      flex: 1,
      color: colors.text,
      fontSize: 18,
      fontWeight: "700",
    },

    countBadge: {
      minWidth: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor:
        colors.card,
      borderWidth: 1,
      borderColor:
        colors.border,
      alignItems: "center",
      justifyContent: "center",
    },

    countText: {
      color:
        colors.secondaryText,
      fontSize: 11,
      fontWeight: "700",
    },

    columnActions: {
      flexDirection: "row",
      gap: 18,
      marginTop: 8,
    },

    columnEdit: {
      color: colors.text,
      fontSize: 11,
      fontWeight: "700",
    },

    columnDelete: {
      color: colors.danger,
      fontSize: 11,
      fontWeight: "700",
    },

    taskScroll: {
      flex: 1,
      minHeight: 0,
    },

    taskCard: {
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.card,
      borderRadius: 12,
      padding: 12,
      marginBottom: 9,
    },

    draggingSourceCard: {
      opacity: 0.22,
    },

    taskTopRow: {
      flexDirection: "row",
      alignItems:
        "flex-start",
    },

    taskTitle: {
      flex: 1,
      color: colors.text,
      fontSize: 15,
      fontWeight: "700",
    },

    offlineBadge: {
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 10,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },

    offlineBadgeText: {
      color:
        colors.secondaryText,
      fontSize: 8,
    },

    taskMetaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 5,
      marginTop: 10,
    },

    metaChip: {
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.surface,
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },

    metaChipText: {
      color:
        colors.secondaryText,
      fontSize: 10,
      fontWeight: "600",
    },

    taskAssignee: {
      color:
        colors.secondaryText,
      fontSize: 11,
      marginTop: 8,
    },

    dragHint: {
      color:
        colors.secondaryText,
      fontSize: 9,
      marginTop: 10,
    },

    noTask: {
      height: 90,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor:
        colors.border,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },

    noTaskText: {
      color:
        colors.secondaryText,
      fontSize: 12,
    },

    addTaskButton: {
      height: 43,
      flexShrink: 0,
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.card,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
    },

    addTaskText: {
      color: colors.text,
      fontWeight: "700",
      fontSize: 13,
    },

    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },

    emptyTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "700",
    },

    dragGhost: {
      position: "absolute",
      left: 0,
      top: 0,
      width: 250,
      minHeight: 100,
      zIndex: 10000,
      elevation: 10000,
      borderWidth: 2,
      borderColor:
        colors.primary,
      backgroundColor:
        colors.card,
      borderRadius: 14,
      padding: 14,
      justifyContent: "center",
    },

    dragGhostTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "700",
    },

    dragGhostMeta: {
      color:
        colors.secondaryText,
      fontSize: 11,
      marginTop: 8,
    },

    dragBanner: {
      position: "absolute",
      top: 8,
      left: 30,
      right: 30,
      minHeight: 38,
      zIndex: 10001,
      elevation: 10001,
      backgroundColor:
        colors.card,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 12,
    },

    dragBannerText: {
      color: colors.text,
      fontSize: 10,
      fontWeight: "700",
      textAlign: "center",
    },

    trashWrapper: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 14,
      alignItems: "center",
      zIndex: 10002,
      elevation: 10002,
    },

    trashZone: {
      width: 180,
      height: 58,
      borderWidth: 2,
      borderColor:
        colors.danger,
      backgroundColor:
        colors.card,
      borderRadius: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },

    trashZoneHovered: {
      transform: [
        {
          scale: 1.08,
        },
      ],
    },

    trashIcon: {
      fontSize: 20,
    },

    trashText: {
      color: colors.danger,
      fontSize: 13,
      fontWeight: "700",
    },

    filterOverlay: {
      flex: 1,
      backgroundColor:
        colors.overlay,
      justifyContent: "flex-end",
    },

    filterSheet: {
      backgroundColor:
        colors.card,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      borderWidth: 1,
      borderColor:
        colors.border,
      padding: 20,
      paddingBottom: 28,
    },

    sheetTitle: {
      color: colors.text,
      fontSize: 22,
      fontWeight: "700",
      marginBottom: 20,
    },

    filterSectionTitle: {
      color: colors.text,
      fontSize: 13,
      fontWeight: "700",
      marginBottom: 9,
    },

    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 20,
    },

    choiceChip: {
      height: 36,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 18,
      backgroundColor:
        colors.surface,
      paddingHorizontal: 13,
      justifyContent: "center",
    },

    choiceChipSelected: {
      backgroundColor:
        colors.primary,
      borderColor:
        colors.primary,
    },

    choiceChipText: {
      color: colors.text,
      fontSize: 12,
      fontWeight: "600",
    },

    choiceChipTextSelected: {
      color:
        colors.onPrimary,
    },

    filterFooter: {
      flexDirection: "row",
      gap: 10,
    },

    resetButton: {
      flex: 1,
      height: 46,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },

    resetText: {
      color: colors.text,
      fontWeight: "700",
    },

    applyButton: {
      flex: 1,
      height: 46,
      backgroundColor:
        colors.primary,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },

    applyText: {
      color:
        colors.onPrimary,
      fontWeight: "700",
    },

    modalOverlay: {
      flex: 1,
      backgroundColor:
        colors.overlay,
      justifyContent: "center",
      padding: 24,
    },

    modal: {
      backgroundColor:
        colors.card,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 14,
      padding: 20,
    },

    modalTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 18,
    },

    input: {
      height: 50,
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.input,
      color: colors.text,
      borderRadius: 10,
      paddingHorizontal: 14,
    },

    modalActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 10,
      marginTop: 18,
    },

    cancelButton: {
      height: 44,
      paddingHorizontal: 18,
      justifyContent: "center",
    },

    cancelText: {
      color: colors.text,
    },

    saveButton: {
      minWidth: 90,
      height: 44,
      backgroundColor:
        colors.primary,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
    },

    saveText: {
      color:
        colors.onPrimary,
      fontWeight: "700",
    },
  });
}