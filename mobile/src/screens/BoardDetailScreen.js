import { useCallback, useState } from "react";

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

import { useFocusEffect } from "@react-navigation/native";

import useListStore from "../store/listStore";
import useTaskStore from "../store/taskStore";

export default function BoardDetailScreen({
  route,
  navigation,
}) {
  const { board } = route.params;

  // Kolon store
  const lists = useListStore((state) => state.lists);

  const isLoading = useListStore(
    (state) => state.isLoading
  );

  const fetchLists = useListStore(
    (state) => state.fetchLists
  );

  const createList = useListStore(
    (state) => state.createList
  );

  const updateList = useListStore(
    (state) => state.updateList
  );

  const deleteList = useListStore(
    (state) => state.deleteList
  );

  const clearLists = useListStore(
    (state) => state.clearLists
  );

  // Görev store
  const tasksByList = useTaskStore(
    (state) => state.tasksByList
  );

  const fetchTasks = useTaskStore(
    (state) => state.fetchTasks
  );

  const clearTasks = useTaskStore(
    (state) => state.clearTasks
  );

  // Kolon modal state
  const [modalVisible, setModalVisible] =
    useState(false);

  const [editingList, setEditingList] =
    useState(null);

  const [title, setTitle] = useState("");

  const [saving, setSaving] = useState(false);

  // Pano açıldığında kolonları ve görevleri getir
  useFocusEffect(
    useCallback(() => {
      const loadBoard = async () => {
        try {
          const boardLists = await fetchLists(
            board.id
          );

          await Promise.all(
            boardLists.map((list) =>
              fetchTasks(list.id)
            )
          );
        } catch (error) {
          Alert.alert(
            "Hata",
            "Pano bilgileri yüklenemedi."
          );
        }
      };

      loadBoard();

      return () => {
        clearLists();
        clearTasks();
      };
    }, [
      board.id,
      fetchLists,
      fetchTasks,
      clearLists,
      clearTasks,
    ])
  );

  // Yeni kolon modalını aç
  const openCreateModal = () => {
    setEditingList(null);
    setTitle("");
    setModalVisible(true);
  };

  // Kolon düzenleme modalını aç
  const openEditModal = (list) => {
    setEditingList(list);
    setTitle(list.title);
    setModalVisible(true);
  };

  // Modalı kapat
  const closeModal = () => {
    if (saving) {
      return;
    }

    setModalVisible(false);
    setEditingList(null);
    setTitle("");
  };

  // Kolon oluştur / güncelle
  const handleSave = async () => {
    const cleanTitle = title.trim();

    if (!cleanTitle) {
      Alert.alert(
        "Hata",
        "Kolon başlığı zorunludur."
      );

      return;
    }

    if (cleanTitle.length > 50) {
      Alert.alert(
        "Hata",
        "Kolon başlığı en fazla 50 karakter olabilir."
      );

      return;
    }

    try {
      setSaving(true);

      if (editingList) {
        await updateList(editingList.id, {
          title: cleanTitle,
        });
      } else {
        await createList(
          board.id,
          cleanTitle
        );
      }

      setModalVisible(false);
      setEditingList(null);
      setTitle("");
    } catch (error) {
      Alert.alert(
        "Hata",
        error.response?.data?.message ||
          "İşlem sırasında bir hata oluştu."
      );
    } finally {
      setSaving(false);
    }
  };

  // Kolon sil
  const handleDelete = (list) => {
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

          onPress: async () => {
            try {
              await deleteList(list.id);
            } catch (error) {
              Alert.alert(
                "Hata",
                error.response?.data?.message ||
                  "Kolon silinemedi."
              );
            }
          },
        },
      ]
    );
  };

  // Öncelik metni
  const getPriorityLabel = (priority) => {
    if (priority === "low") {
      return "Düşük";
    }

    if (priority === "high") {
      return "Yüksek";
    }

    return "Orta";
  };

  return (
    <View style={styles.container}>
      {/* Pano üst alanı */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.back}>
            ‹ Geri
          </Text>
        </TouchableOpacity>

        <Text style={styles.boardTitle}>
          {board.title}
        </Text>

        {board.description ? (
          <Text
            style={styles.boardDescription}
          >
            {board.description}
          </Text>
        ) : null}

        <TouchableOpacity
          style={styles.addButton}
          onPress={openCreateModal}
        >
          <Text style={styles.addButtonText}>
            + Kolon Ekle
          </Text>
        </TouchableOpacity>
      </View>

      {/* Loading */}
      {isLoading && lists.length === 0 ? (
        <ActivityIndicator
          size="large"
          style={styles.loading}
        />
      ) : lists.length === 0 ? (
        // Boş pano
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>
            Henüz kolon bulunmuyor.
          </Text>

          <Text style={styles.emptyText}>
            İlk kolonunuzu oluşturabilirsiniz.
          </Text>
        </View>
      ) : (
        // Kanban kolonları
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.board}
        >
          {lists.map((list) => {
            const listTasks =
              tasksByList[list.id] || [];

            return (
              <View
                key={list.id}
                style={styles.column}
              >
                {/* Kolon başlığı */}
                <View
                  style={styles.columnHeader}
                >
                  <Text
                    style={styles.columnTitle}
                  >
                    {list.title}
                  </Text>

                  <View
                    style={styles.columnActions}
                  >
                    <TouchableOpacity
                      onPress={() =>
                        openEditModal(list)
                      }
                    >
                      <Text
                        style={styles.edit}
                      >
                        Düzenle
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() =>
                        handleDelete(list)
                      }
                    >
                      <Text
                        style={styles.delete}
                      >
                        Sil
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Görevler */}
                <View style={styles.taskArea}>
                  {listTasks.map((task) => (
                    <TouchableOpacity
                      key={task.id}
                      style={styles.taskCard}
                      onPress={() =>
                        navigation.navigate(
                          "TaskDetail",
                          {
                            task,
                            listId: list.id,
                          }
                        )
                      }
                    >
                      <Text
                        style={styles.taskTitle}
                      >
                        {task.title}
                      </Text>

                      <Text
                        style={
                          styles.taskPriority
                        }
                      >
                        Öncelik:{" "}
                        {getPriorityLabel(
                          task.priority
                        )}
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

                      {task.assignee ? (
                        <Text
                          style={
                            styles.taskAssignee
                          }
                        >
                          Atanan:{" "}
                          {task.assignee.name}
                        </Text>
                      ) : (
                        <Text
                          style={
                            styles.taskAssignee
                          }
                        >
                          Atanmamış
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}

                  {listTasks.length === 0 ? (
                    <Text
                      style={styles.noTask}
                    >
                      Henüz görev yok.
                    </Text>
                  ) : null}

                  {/* Görev ekle */}
                  <TouchableOpacity
                    style={
                      styles.addTaskButton
                    }
                    onPress={() =>
                      navigation.navigate(
                        "TaskForm",
                        {
                          listId: list.id,
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
          })}
        </ScrollView>
      )}

      {/* Kolon oluştur / düzenle modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              {editingList
                ? "Kolonu Düzenle"
                : "Yeni Kolon"}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Kolon başlığı"
              value={title}
              onChangeText={setTitle}
              maxLength={50}
              autoFocus
              editable={!saving}
            />

            <Text style={styles.counter}>
              {title.length}/50
            </Text>

            <View
              style={styles.modalActions}
            >
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeModal}
                disabled={saving}
              >
                <Text>İptal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator
                    color="#ffffff"
                  />
                ) : (
                  <Text
                    style={styles.saveText}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
  },

  back: {
    fontSize: 16,
    marginBottom: 16,
  },

  boardTitle: {
    fontSize: 28,
    fontWeight: "700",
  },

  boardDescription: {
    marginTop: 6,
    fontSize: 14,
  },

  addButton: {
    height: 46,
    backgroundColor: "#111827",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },

  addButtonText: {
    color: "#ffffff",
    fontWeight: "600",
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
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },

  emptyText: {
    marginTop: 6,
    textAlign: "center",
  },

  board: {
    padding: 20,
    gap: 16,
  },

  column: {
    width: 290,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 14,
  },

  columnHeader: {
    marginBottom: 16,
  },

  columnTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  columnActions: {
    flexDirection: "row",
    gap: 20,
    marginTop: 10,
  },

  edit: {
    fontSize: 13,
    fontWeight: "600",
  },

  delete: {
    fontSize: 13,
    fontWeight: "600",
  },

  taskArea: {
    minHeight: 100,
  },

  noTask: {
    fontSize: 13,
    marginBottom: 10,
  },

  taskCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },

  taskTitle: {
    fontSize: 15,
    fontWeight: "600",
  },

  taskPriority: {
    fontSize: 12,
    marginTop: 8,
  },

  taskDate: {
    fontSize: 12,
    marginTop: 4,
  },

  taskAssignee: {
    fontSize: 12,
    marginTop: 4,
  },

  addTaskButton: {
    minHeight: 42,
    borderWidth: 1,
    borderColor: "#9ca3af",
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  addTaskText: {
    fontWeight: "600",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 24,
  },

  modal: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 20,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
  },

  counter: {
    textAlign: "right",
    fontSize: 12,
    marginTop: 5,
  },

  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 20,
  },

  cancelButton: {
    height: 46,
    paddingHorizontal: 18,
    justifyContent: "center",
  },

  saveButton: {
    minWidth: 90,
    height: 46,
    backgroundColor: "#111827",
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },

  saveText: {
    color: "#ffffff",
    fontWeight: "600",
  },
});