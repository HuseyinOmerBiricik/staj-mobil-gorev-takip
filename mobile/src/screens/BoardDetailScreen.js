import {
  useCallback,
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

import { useFocusEffect } from "@react-navigation/native";

import useListStore from "../store/listStore";

export default function BoardDetailScreen({
  route,
  navigation,
}) {
  const { board } = route.params;

  const lists = useListStore((state) => state.lists);
  const isLoading = useListStore((state) => state.isLoading);
  const fetchLists = useListStore((state) => state.fetchLists);
  const createList = useListStore((state) => state.createList);
  const updateList = useListStore((state) => state.updateList);
  const deleteList = useListStore((state) => state.deleteList);
  const clearLists = useListStore((state) => state.clearLists);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingList, setEditingList] = useState(null);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchLists(board.id);

      return () => {
        clearLists();
      };
    }, [board.id, fetchLists, clearLists])
  );

  const openCreateModal = () => {
    setEditingList(null);
    setTitle("");
    setModalVisible(true);
  };

  const openEditModal = (list) => {
    setEditingList(list);
    setTitle(list.title);
    setModalVisible(true);
  };

  const handleSave = async () => {
    const cleanTitle = title.trim();

    if (!cleanTitle) {
      Alert.alert("Hata", "Kolon başlığı zorunludur.");
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
        await createList(board.id, cleanTitle);
      }

      setModalVisible(false);
      setTitle("");
      setEditingList(null);
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Geri</Text>
        </TouchableOpacity>

        <Text style={styles.boardTitle}>
          {board.title}
        </Text>

        {board.description ? (
          <Text style={styles.boardDescription}>
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

      {isLoading && lists.length === 0 ? (
        <ActivityIndicator
          size="large"
          style={styles.loading}
        />
      ) : lists.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>
            Henüz kolon bulunmuyor.
          </Text>

          <Text style={styles.emptyText}>
            İlk kolonunuzu oluşturabilirsiniz.
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.board}
        >
          {lists.map((list) => (
            <View
              key={list.id}
              style={styles.column}
            >
              <View style={styles.columnHeader}>
                <Text style={styles.columnTitle}>
                  {list.title}
                </Text>

                <View style={styles.columnActions}>
                  <TouchableOpacity
                    onPress={() => openEditModal(list)}
                  >
                    <Text style={styles.edit}>Düzenle</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDelete(list)}
                  >
                    <Text style={styles.delete}>Sil</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.taskArea}>
                <Text style={styles.noTask}>
                  Henüz görev yok.
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
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
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
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
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.saveText}>
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
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
  },

  emptyText: {
    marginTop: 6,
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