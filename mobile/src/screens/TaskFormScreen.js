import { useState } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";

import useAuthStore from "../store/authStore";
import useTaskStore from "../store/taskStore";

export default function TaskFormScreen({
  route,
  navigation,
}) {
  const { listId, task } = route.params;

  const user = useAuthStore((state) => state.user);

  const createTask = useTaskStore(
    (state) => state.createTask
  );

  const updateTask = useTaskStore(
    (state) => state.updateTask
  );

  const [title, setTitle] = useState(
    task?.title || ""
  );

  const [description, setDescription] = useState(
    task?.description || ""
  );

  const [priority, setPriority] = useState(
    task?.priority || "medium"
  );

  const [dueDate, setDueDate] = useState(
    task?.dueDate
      ? new Date(task.dueDate)
      : null
  );

  const [assigneeId, setAssigneeId] = useState(
    task?.assigneeId || null
  );

  const [showDatePicker, setShowDatePicker] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();

    if (
      cleanTitle.length < 2 ||
      cleanTitle.length > 150
    ) {
      Alert.alert(
        "Hata",
        "Görev başlığı 2-150 karakter arasında olmalıdır."
      );

      return;
    }

    if (cleanDescription.length > 1000) {
      Alert.alert(
        "Hata",
        "Görev açıklaması en fazla 1000 karakter olabilir."
      );

      return;
    }

    try {
      setLoading(true);

      const data = {
        title: cleanTitle,
        description: cleanDescription,
        priority,
        dueDate: dueDate
          ? dueDate.toISOString()
          : null,
        assigneeId,
      };

      if (task) {
        await updateTask(
          task.id,
          listId,
          data
        );
      } else {
        await createTask(
          listId,
          data
        );
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert(
        "Hata",
        error.response?.data?.message ||
          "Görev kaydedilemedi."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);

    if (event.type === "dismissed") {
      return;
    }

    if (selectedDate) {
      setDueDate(selectedDate);
    }
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
        {task
          ? "Görevi Düzenle"
          : "Yeni Görev"}
      </Text>

      <Text style={styles.label}>
        Başlık
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Görev başlığı girin"
        value={title}
        onChangeText={setTitle}
        maxLength={150}
      />

      <Text style={styles.label}>
        Açıklama
      </Text>

      <TextInput
        style={[
          styles.input,
          styles.description,
        ]}
        placeholder="Görev açıklaması"
        multiline
        value={description}
        onChangeText={setDescription}
        maxLength={1000}
      />

      <Text style={styles.counter}>
        {description.length}/1000
      </Text>

      <Text style={styles.label}>
        Öncelik
      </Text>

      <View style={styles.priorityRow}>
        {[
          ["low", "Düşük"],
          ["medium", "Orta"],
          ["high", "Yüksek"],
        ].map(([value, label]) => (
          <TouchableOpacity
            key={value}
            style={[
              styles.priorityButton,
              priority === value &&
                styles.selected,
            ]}
            onPress={() =>
              setPriority(value)
            }
          >
            <Text
              style={
                priority === value
                  ? styles.selectedText
                  : null
              }
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>
        Son Tarih
      </Text>

      <TouchableOpacity
        style={styles.input}
        onPress={() =>
          setShowDatePicker(true)
        }
      >
        <Text>
          {dueDate
            ? dueDate.toLocaleDateString("tr-TR")
            : "Tarih seçilmedi"}
        </Text>
      </TouchableOpacity>

      {dueDate ? (
        <TouchableOpacity
          onPress={() => setDueDate(null)}
        >
          <Text style={styles.removeDate}>
            Tarihi kaldır
          </Text>
        </TouchableOpacity>
      ) : null}

      {showDatePicker ? (
        <DateTimePicker
          value={dueDate || new Date()}
          mode="date"
          minimumDate={new Date()}
          onChange={handleDateChange}
        />
      ) : null}

      <Text style={styles.label}>
        Atanan Kişi
      </Text>

      <View style={styles.assigneeRow}>
        <TouchableOpacity
          style={[
            styles.assigneeButton,
            assigneeId === null &&
              styles.selected,
          ]}
          onPress={() =>
            setAssigneeId(null)
          }
        >
          <Text
            style={
              assigneeId === null
                ? styles.selectedText
                : null
            }
          >
            Atanmamış
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.assigneeButton,
            assigneeId === user?.id &&
              styles.selected,
          ]}
          onPress={() =>
            setAssigneeId(user.id)
          }
        >
          <Text
            style={
              assigneeId === user?.id
                ? styles.selectedText
                : null
            }
          >
            {user?.name}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.saveText}>
            {task
              ? "Değişiklikleri Kaydet"
              : "Görev Oluştur"}
          </Text>
        )}
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
    paddingBottom: 50,
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

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },

  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: "center",
    marginBottom: 18,
  },

  description: {
    minHeight: 120,
    paddingTop: 14,
    textAlignVertical: "top",
    marginBottom: 4,
  },

  counter: {
    textAlign: "right",
    fontSize: 12,
    marginBottom: 20,
  },

  priorityRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 22,
  },

  priorityButton: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  selected: {
    backgroundColor: "#111827",
  },

  selectedText: {
    color: "#ffffff",
    fontWeight: "600",
  },

  removeDate: {
    marginTop: -8,
    marginBottom: 20,
  },

  assigneeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 28,
  },

  assigneeButton: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  saveButton: {
    height: 52,
    backgroundColor: "#111827",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  saveText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});