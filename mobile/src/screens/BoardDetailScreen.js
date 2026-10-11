import {
  useCallback,
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

function ThemeSelect({
  label,
  value,
  options,
  onChange,
  styles,
}) {
  const [visible, setVisible] =
    useState(false);

  const selectedOption =
    options.find(
      (option) =>
        option.value === value
    );

  return (
    <>
      <Text
        style={styles.filterLabel}
      >
        {label}
      </Text>

      <TouchableOpacity
        style={
          styles.selectButton
        }
        onPress={() =>
          setVisible(true)
        }
        activeOpacity={0.8}
      >
        <Text
          style={
            styles.selectButtonText
          }
          numberOfLines={1}
        >
          {selectedOption?.label ||
            "Seçiniz"}
        </Text>

        <Text
          style={
            styles.selectArrow
          }
        >
          ▼
        </Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setVisible(false)
        }
      >
        <View
          style={
            styles.selectOverlay
          }
        >
          <View
            style={
              styles.selectModal
            }
          >
            <Text
              style={
                styles.selectModalTitle
              }
            >
              {label}
            </Text>

            <ScrollView
              style={
                styles.selectOptionsContainer
              }
              showsVerticalScrollIndicator
            >
              {options.map(
                (option) => {
                  const selected =
                    option.value ===
                    value;

                  return (
                    <TouchableOpacity
                      key={String(
                        option.value
                      )}
                      style={[
                        styles.selectOption,
                        selected &&
                          styles.selectOptionSelected,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => {
                        onChange(
                          option.value
                        );

                        setVisible(
                          false
                        );
                      }}
                    >
                      <Text
                        style={[
                          styles.selectOptionText,
                          selected &&
                            styles.selectOptionTextSelected,
                        ]}
                      >
                        {
                          option.label
                        }
                      </Text>

                      {selected ? (
                        <Text
                          style={
                            styles.checkText
                          }
                        >
                          ✓
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                }
              )}
            </ScrollView>

            <TouchableOpacity
              style={
                styles.selectCancel
              }
              onPress={() =>
                setVisible(false)
              }
            >
              <Text
                style={
                  styles.selectCancelText
                }
              >
                İptal
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

function measureView(ref) {
  return new Promise(
    (resolve) => {
      if (!ref) {
        resolve(null);
        return;
      }

      ref.measureInWindow(
        (
          x,
          y,
          width,
          height
        ) => {
          resolve({
            x,
            y,
            width,
            height,
          });
        }
      );
    }
  );
}

function DraggableTaskCard({
  task,
  listId,
  boardId,
  taskIndex,
  tasksByList,
  columnRefs,
  taskRefs,
  moveTask,
  navigation,
  dragEnabled,
  styles,
}) {
  const translateX =
    useSharedValue(0);

  const translateY =
    useSharedValue(0);

  const dragging =
    useSharedValue(false);

  const handleDrop = async (
    absoluteX,
    absoluteY
  ) => {
    try {
      const columnIds =
        Object.keys(
          columnRefs.current
        );

      let targetListId = null;

      for (
        const id of columnIds
      ) {
        const measurement =
          await measureView(
            columnRefs.current[
              id
            ]
          );

        if (!measurement) {
          continue;
        }

        const insideX =
          absoluteX >=
            measurement.x &&
          absoluteX <=
            measurement.x +
              measurement.width;

        const insideY =
          absoluteY >=
            measurement.y &&
          absoluteY <=
            measurement.y +
              measurement.height;

        if (
          insideX &&
          insideY
        ) {
          targetListId =
            Number(id);

          break;
        }
      }

      if (
        targetListId === null
      ) {
        return;
      }

      const targetTasks =
        tasksByList[
          targetListId
        ] || [];

      const refs =
        taskRefs.current[
          targetListId
        ] || {};

      const otherTasks =
        targetTasks.filter(
          (item) =>
            item.id !== task.id
        );

      let newOrder =
        otherTasks.length;

      for (
        let index = 0;
        index <
        otherTasks.length;
        index++
      ) {
        const targetTask =
          otherTasks[index];

        const measurement =
          await measureView(
            refs[
              targetTask.id
            ]
          );

        if (!measurement) {
          continue;
        }

        const middle =
          measurement.y +
          measurement.height /
            2;

        if (
          absoluteY < middle
        ) {
          newOrder = index;
          break;
        }
      }

      if (
        targetListId ===
          listId &&
        newOrder === taskIndex
      ) {
        return;
      }

      await moveTask(
        task.id,
        listId,
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
    }
  };

  const gesture =
    Gesture.Pan()
      .activateAfterLongPress(
        250
      )
      .onBegin(() => {
        dragging.value =
          true;
      })
      .onUpdate((event) => {
        translateX.value =
          event.translationX;

        translateY.value =
          event.translationY;
      })
      .onEnd((event) => {
        runOnJS(handleDrop)(
          event.absoluteX,
          event.absoluteY
        );

        translateX.value =
          withSpring(0);

        translateY.value =
          withSpring(0);

        dragging.value =
          false;
      })
      .onFinalize(() => {
        translateX.value =
          withSpring(0);

        translateY.value =
          withSpring(0);

        dragging.value =
          false;
      });

  const animatedStyle =
    useAnimatedStyle(
      () => ({
        transform: [
          {
            translateX:
              translateX.value,
          },
          {
            translateY:
              translateY.value,
          },
        ],

        zIndex:
          dragging.value
            ? 1000
            : 1,

        elevation:
          dragging.value
            ? 12
            : 0,

        opacity:
          dragging.value
            ? 0.9
            : 1,
      })
    );

  const registerRef = (
    ref
  ) => {
    if (
      !taskRefs.current[
        listId
      ]
    ) {
      taskRefs.current[
        listId
      ] = {};
    }

    taskRefs.current[
      listId
    ][task.id] = ref;
  };

  const getPriorityLabel =
    () => {
      if (
        task.priority ===
        "low"
      ) {
        return "Düşük";
      }

      if (
        task.priority ===
        "high"
      ) {
        return "Yüksek";
      }

      return "Orta";
    };

  const openTask = () => {
    navigation.navigate(
      "TaskDetail",
      {
        task,
        listId,
        boardId,
      }
    );
  };

  const renderContent =
    () => (
      <>
        <Text
          style={
            styles.taskTitle
          }
        >
          {task.title}
        </Text>

        <Text
          style={
            styles.taskPriority
          }
        >
          Öncelik:{" "}
          {getPriorityLabel()}
        </Text>

        {task.dueDate ? (
          <Text
            style={
              styles.taskDate
            }
          >
            Son tarih:{" "}
            {new Date(
              task.dueDate
            ).toLocaleDateString(
              "tr-TR"
            )}
          </Text>
        ) : null}

        <Text
          style={
            styles.taskAssignee
          }
        >
          {task.assignee
            ? `Atanan: ${task.assignee.name}`
            : "Atanmamış"}
        </Text>

        {dragEnabled ? (
          <Text
            style={
              styles.dragHint
            }
          >
            Basılı tutup sürükleyin
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
            style={
              animatedStyle
            }
          >
            <TouchableOpacity
              style={
                styles.taskCard
              }
              activeOpacity={0.85}
              onPress={
                openTask
              }
            >
              {renderContent()}
            </TouchableOpacity>
          </Animated.View>
        </GestureDetector>
      ) : (
        <TouchableOpacity
          style={
            styles.taskCard
          }
          activeOpacity={0.85}
          onPress={openTask}
        >
          {renderContent()}
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

  const { colors } =
    useAppTheme();

  const styles =
    createStyles(colors);

  const columnRefs =
    useRef({});

  const taskRefs =
    useRef({});

  const lists = useListStore(
    (state) =>
      state.lists
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

  const clearTasks =
    useTaskStore(
      (state) =>
        state.clearTasks
    );

  const [
    modalVisible,
    setModalVisible,
  ] = useState(false);

  const [
    editingList,
    setEditingList,
  ] = useState(null);

  const [
    title,
    setTitle,
  ] = useState("");

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    searchText,
    setSearchText,
  ] = useState("");

  const [
    priorityFilter,
    setPriorityFilter,
  ] = useState("all");

  const [
    assigneeFilter,
    setAssigneeFilter,
  ] = useState("all");

  const filtersActive =
    searchText.trim() !==
      "" ||
    priorityFilter !==
      "all" ||
    assigneeFilter !==
      "all";

  const assignees = [];

  Object.values(
    tasksByList
  ).forEach((tasks) => {
    tasks.forEach(
      (task) => {
        if (
          task.assignee &&
          !assignees.some(
            (user) =>
              user.id ===
              task.assignee.id
          )
        ) {
          assignees.push(
            task.assignee
          );
        }
      }
    );
  });

  assignees.sort(
    (a, b) =>
      a.name.localeCompare(
        b.name,
        "tr"
      )
  );

  const priorityOptions = [
    {
      label:
        "Tüm öncelikler",
      value: "all",
    },
    {
      label: "Düşük",
      value: "low",
    },
    {
      label: "Orta",
      value: "medium",
    },
    {
      label: "Yüksek",
      value: "high",
    },
  ];

  const assigneeOptions = [
    {
      label: "Tüm kişiler",
      value: "all",
    },
    {
      label: "Atanmamış",
      value: "unassigned",
    },

    ...assignees.map(
      (user) => ({
        label: user.name,
        value: String(
          user.id
        ),
      })
    ),
  ];

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
                error.response
                  ?.data
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
      };
    }, [
      board.id,
      fetchLists,
      fetchTasks,
      clearLists,
      clearTasks,
    ])
  );

  const openCreateModal =
    () => {
      setEditingList(null);
      setTitle("");
      setModalVisible(true);
    };

  const openEditModal = (
    list
  ) => {
    setEditingList(list);
    setTitle(list.title);
    setModalVisible(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setModalVisible(false);
    setEditingList(null);
    setTitle("");
  };

  const handleSave = async () => {
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
      setSaving(true);

      if (editingList) {
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

      setEditingList(null);
      setTitle("");
    } catch (error) {
      Alert.alert(
        "Hata",
        error.response?.data
          ?.message ||
          "İşlem sırasında bir hata oluştu."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (
    list
  ) => {
    Alert.alert(
      "Kolonu Sil",
      `"${list.title}" kolonunu silmek istediğinize emin misiniz? Bu kolondaki görevler de silinecektir.`,
      [
        {
          text: "İptal",
          style: "cancel",
        },

        {
          text: "Sil",
          style: "destructive",

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

  const filterTasks = (
    tasks
  ) => {
    const cleanSearch =
      searchText
        .trim()
        .toLocaleLowerCase(
          "tr-TR"
        );

    return tasks.filter(
      (task) => {
        const taskTitle =
          task.title || "";

        const taskDescription =
          task.description ||
          "";

        const matchesSearch =
          cleanSearch ===
            "" ||
          taskTitle
            .toLocaleLowerCase(
              "tr-TR"
            )
            .includes(
              cleanSearch
            ) ||
          taskDescription
            .toLocaleLowerCase(
              "tr-TR"
            )
            .includes(
              cleanSearch
            );

        const matchesPriority =
          priorityFilter ===
            "all" ||
          task.priority ===
            priorityFilter;

        let matchesAssignee =
          true;

        if (
          assigneeFilter ===
          "unassigned"
        ) {
          matchesAssignee =
            !task.assigneeId;
        } else if (
          assigneeFilter !==
          "all"
        ) {
          matchesAssignee =
            task.assigneeId ===
            Number(
              assigneeFilter
            );
        }

        return (
          matchesSearch &&
          matchesPriority &&
          matchesAssignee
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
      style={styles.container}
    >
      <View
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() =>
            navigation.goBack()
          }
        >
          <Text
            style={styles.back}
          >
            ‹ Geri
          </Text>
        </TouchableOpacity>

        <Text
          style={
            styles.boardTitle
          }
        >
          {board.title}
        </Text>

        {board.description ? (
          <Text
            style={
              styles.boardDescription
            }
          >
            {board.description}
          </Text>
        ) : null}

        <TouchableOpacity
          style={
            styles.addButton
          }
          onPress={
            openCreateModal
          }
        >
          <Text
            style={
              styles.addButtonText
            }
          >
            + Kolon Ekle
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={
            styles.membersButton
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
              styles.membersButtonText
            }
          >
            Pano Üyeleri
          </Text>
        </TouchableOpacity>

        <View
          style={
            styles.filterPanel
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
            value={searchText}
            onChangeText={
              setSearchText
            }
          />

          <ThemeSelect
            label="Öncelik"
            value={
              priorityFilter
            }
            options={
              priorityOptions
            }
            onChange={
              setPriorityFilter
            }
            styles={styles}
          />

          <ThemeSelect
            label="Atanan Kişi"
            value={
              assigneeFilter
            }
            options={
              assigneeOptions
            }
            onChange={
              setAssigneeFilter
            }
            styles={styles}
          />

          {filtersActive ? (
            <>
              <TouchableOpacity
                style={
                  styles.clearFilterButton
                }
                onPress={
                  clearFilters
                }
              >
                <Text
                  style={
                    styles.clearFilterText
                  }
                >
                  Filtreleri Temizle
                </Text>
              </TouchableOpacity>

              <Text
                style={
                  styles.dragDisabledText
                }
              >
                Arama veya filtre açıkken görev taşıma devre dışıdır.
              </Text>
            </>
          ) : null}
        </View>
      </View>

      {isLoading &&
      lists.length === 0 ? (
        <ActivityIndicator
          size="large"
          color={colors.text}
          style={styles.loading}
        />
      ) : lists.length ===
        0 ? (
        <View
          style={styles.empty}
        >
          <Text
            style={
              styles.emptyTitle
            }
          >
            Henüz kolon bulunmuyor.
          </Text>

          <Text
            style={
              styles.emptyText
            }
          >
            İlk kolonunuzu oluşturabilirsiniz.
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.board
          }
          keyboardShouldPersistTaps="handled"
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

              return (
                <View
                  key={list.id}
                  ref={(ref) => {
                    columnRefs.current[
                      list.id
                    ] = ref;
                  }}
                  collapsable={
                    false
                  }
                  style={
                    styles.column
                  }
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
                      >
                        {list.title}
                      </Text>

                      <Text
                        style={
                          styles.taskCount
                        }
                      >
                        {
                          visibleTasks.length
                        }
                        /
                        {
                          listTasks.length
                        }
                      </Text>
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
                            styles.edit
                          }
                        >
                          Düzenle
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() =>
                          handleDelete(
                            list
                          )
                        }
                      >
                        <Text
                          style={
                            styles.delete
                          }
                        >
                          Sil
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View
                    style={
                      styles.taskArea
                    }
                  >
                    {visibleTasks.map(
                      (task) => {
                        const realIndex =
                          listTasks.findIndex(
                            (
                              item
                            ) =>
                              item.id ===
                              task.id
                          );

                        return (
                          <DraggableTaskCard
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
                            taskIndex={
                              realIndex
                            }
                            tasksByList={
                              tasksByList
                            }
                            columnRefs={
                              columnRefs
                            }
                            taskRefs={
                              taskRefs
                            }
                            moveTask={
                              moveTask
                            }
                            navigation={
                              navigation
                            }
                            dragEnabled={
                              !filtersActive
                            }
                            styles={
                              styles
                            }
                          />
                        );
                      }
                    )}

                    {visibleTasks.length ===
                    0 ? (
                      <Text
                        style={
                          styles.noTask
                        }
                      >
                        {filtersActive
                          ? "Filtrelere uygun görev bulunamadı."
                          : "Henüz görev yok."}
                      </Text>
                    ) : null}

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
                </View>
              );
            }
          )}
        </ScrollView>
      )}

      <Modal
        visible={modalVisible}
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
            style={styles.modal}
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
              placeholder="Kolon başlığı"
              placeholderTextColor={
                colors.secondaryText
              }
              value={title}
              onChangeText={
                setTitle
              }
              maxLength={50}
              autoFocus
              editable={!saving}
            />

            <Text
              style={
                styles.counter
              }
            >
              {title.length}/50
            </Text>

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
                disabled={saving}
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
                disabled={saving}
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

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        colors.background,
    },

    header: {
      paddingTop: 56,
      paddingHorizontal: 20,
    },

    back: {
      color: colors.text,
      fontSize: 16,
      marginBottom: 16,
    },

    boardTitle: {
      color: colors.text,
      fontSize: 28,
      fontWeight: "700",
    },

    boardDescription: {
      color:
        colors.secondaryText,
      marginTop: 6,
      fontSize: 14,
    },

    addButton: {
      height: 46,
      backgroundColor:
        colors.primary,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 20,
    },

    addButtonText: {
      color:
        colors.onPrimary,
      fontWeight: "600",
    },

    membersButton: {
      height: 44,
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.card,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 10,
    },

    membersButtonText: {
      color: colors.text,
      fontWeight: "600",
    },

    filterPanel: {
      marginTop: 18,
      marginBottom: 4,
    },

    searchInput: {
      minHeight: 48,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      backgroundColor:
        colors.input,
      color: colors.text,
      marginBottom: 12,
    },

    filterLabel: {
      color: colors.text,
      fontSize: 12,
      fontWeight: "600",
      marginBottom: 6,
    },

    selectButton: {
      minHeight: 50,
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.input,
      borderRadius: 10,
      paddingHorizontal: 14,
      marginBottom: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    selectButtonText: {
      flex: 1,
      color: colors.text,
      fontSize: 14,
      paddingRight: 12,
    },

    selectArrow: {
      color:
        colors.secondaryText,
      fontSize: 11,
    },

    selectOverlay: {
      flex: 1,
      backgroundColor:
        colors.overlay,
      justifyContent: "center",
      padding: 24,
    },

    selectModal: {
      maxHeight: "75%",
      backgroundColor:
        colors.card,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 14,
      padding: 18,
    },

    selectModalTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 14,
    },

    selectOptionsContainer: {
      flexGrow: 0,
    },

    selectOption: {
      minHeight: 52,
      borderBottomWidth: 1,
      borderBottomColor:
        colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      paddingHorizontal: 8,
    },

    selectOptionSelected: {
      backgroundColor:
        colors.surface,
    },

    selectOptionText: {
      flex: 1,
      color: colors.text,
      fontSize: 15,
      paddingRight: 12,
    },

    selectOptionTextSelected: {
      fontWeight: "700",
    },

    checkText: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "700",
    },

    selectCancel: {
      height: 46,
      marginTop: 14,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
    },

    selectCancelText: {
      color: colors.text,
      fontWeight: "600",
    },

    clearFilterButton: {
      minHeight: 42,
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.card,
      borderRadius: 9,
      justifyContent: "center",
      alignItems: "center",
    },

    clearFilterText: {
      color: colors.text,
      fontWeight: "600",
    },

    dragDisabledText: {
      color:
        colors.secondaryText,
      fontSize: 11,
      marginTop: 8,
    },

    loading: {
      marginTop: 80,
    },

    empty: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 30,
    },

    emptyTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "600",
      textAlign: "center",
    },

    emptyText: {
      color:
        colors.secondaryText,
      marginTop: 6,
      textAlign: "center",
    },

    board: {
      padding: 20,
      gap: 16,
    },

    column: {
      width: 290,
      backgroundColor:
        colors.surface,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 12,
      padding: 14,
    },

    columnHeader: {
      marginBottom: 16,
    },

    columnTitleRow: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
    },

    columnTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "700",
      flex: 1,
    },

    taskCount: {
      color:
        colors.secondaryText,
      fontSize: 12,
      marginLeft: 8,
    },

    columnActions: {
      flexDirection: "row",
      gap: 20,
      marginTop: 10,
    },

    edit: {
      color: colors.text,
      fontSize: 13,
      fontWeight: "600",
    },

    delete: {
      color: colors.danger,
      fontSize: 13,
      fontWeight: "600",
    },

    taskArea: {
      minHeight: 100,
    },

    noTask: {
      color:
        colors.secondaryText,
      fontSize: 13,
      marginBottom: 10,
    },

    taskCard: {
      backgroundColor:
        colors.card,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 10,
      padding: 12,
      marginBottom: 10,
    },

    taskTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "600",
    },

    taskPriority: {
      color:
        colors.secondaryText,
      fontSize: 12,
      marginTop: 8,
    },

    taskDate: {
      color:
        colors.secondaryText,
      fontSize: 12,
      marginTop: 4,
    },

    taskAssignee: {
      color:
        colors.secondaryText,
      fontSize: 12,
      marginTop: 4,
    },

    dragHint: {
      color:
        colors.secondaryText,
      fontSize: 10,
      marginTop: 10,
    },

    addTaskButton: {
      minHeight: 42,
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.card,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 10,
    },

    addTaskText: {
      color: colors.text,
      fontWeight: "600",
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
      marginBottom: 20,
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

    counter: {
      color:
        colors.secondaryText,
      textAlign: "right",
      fontSize: 12,
      marginTop: 5,
    },

    modalActions: {
      flexDirection: "row",
      justifyContent:
        "flex-end",
      gap: 12,
      marginTop: 20,
    },

    cancelButton: {
      height: 46,
      paddingHorizontal: 18,
      justifyContent: "center",
    },

    cancelText: {
      color: colors.text,
    },

    saveButton: {
      minWidth: 90,
      height: 46,
      backgroundColor:
        colors.primary,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 18,
    },

    saveText: {
      color:
        colors.onPrimary,
      fontWeight: "600",
    },
  });
}