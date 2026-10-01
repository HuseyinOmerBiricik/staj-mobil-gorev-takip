import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";

import useTaskStore from "../store/taskStore";

const priorityLabels = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
};

export default function TaskDetailScreen({
  route,
  navigation,
}) {
  const { task, listId } = route.params;

  const tasks = useTaskStore(
    (state) => state.tasksByList[listId] || []
  );

  const deleteTask = useTaskStore(
    (state) => state.deleteTask
  );

  const currentTask =
    tasks.find((item) => item.id === task.id) ||
    task;

  const handleDelete = () => {
    Alert.alert(
      "Görevi Sil",
      `"${currentTask.title}" görevini silmek istediğinize emin misiniz?`,
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
              await deleteTask(
                currentTask.id,
                listId
              );

              navigation.goBack();
            } catch (error) {
              Alert.alert(
                "Hata",
                error.response?.data?.message ||
                  "Görev silinemedi."
              );
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <TouchableOpacity
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.back}>
          ‹ Geri
        </Text>
      </TouchableOpacity>

      <Text style={styles.title}>
        {currentTask.title}
      </Text>

      <Text style={styles.sectionTitle}>
        Açıklama
      </Text>

      <Text style={styles.value}>
        {currentTask.description ||
          "Açıklama bulunmuyor."}
      </Text>

      <Text style={styles.sectionTitle}>
        Öncelik
      </Text>

      <Text style={styles.value}>
        {priorityLabels[currentTask.priority]}
      </Text>

      <Text style={styles.sectionTitle}>
        Son Tarih
      </Text>

      <Text style={styles.value}>
        {currentTask.dueDate
          ? new Date(
              currentTask.dueDate
            ).toLocaleDateString("tr-TR")
          : "Belirtilmedi"}
      </Text>

      <Text style={styles.sectionTitle}>
        Atanan Kişi
      </Text>

      <Text style={styles.value}>
        {currentTask.assignee?.name ||
          "Atanmamış"}
      </Text>

      <TouchableOpacity
        style={styles.editButton}
        onPress={() =>
          navigation.navigate("TaskForm", {
            listId,
            task: currentTask,
          })
        }
      >
        <Text style={styles.editText}>
          Görevi Düzenle
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDelete}
      >
        <Text style={styles.deleteText}>
          Görevi Sil
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  content: {
    padding: 24,
    paddingTop: 56,
  },

  back: {
    fontSize: 16,
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 30,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 18,
    marginBottom: 6,
  },

  value: {
    fontSize: 16,
  },

  editButton: {
    height: 50,
    backgroundColor: "#111827",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
  },

  editText: {
    color: "#ffffff",
    fontWeight: "600",
  },

  deleteButton: {
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },

  deleteText: {
    fontWeight: "600",
  },
});