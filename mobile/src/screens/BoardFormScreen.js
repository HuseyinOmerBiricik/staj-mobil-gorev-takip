import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";

import useBoardStore from "../store/boardStore";

export default function BoardFormScreen({ route, navigation }) {
  const board = route.params?.board;

  const createBoard = useBoardStore((state) => state.createBoard);
  const updateBoard = useBoardStore((state) => state.updateBoard);

  const [title, setTitle] = useState(board?.title || "");
  const [description, setDescription] = useState(
    board?.description || ""
  );

  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();

    if (cleanTitle.length < 2 || cleanTitle.length > 100) {
      Alert.alert(
        "Hata",
        "Pano başlığı 2-100 karakter arasında olmalıdır."
      );
      return;
    }

    if (cleanDescription.length > 500) {
      Alert.alert(
        "Hata",
        "Pano açıklaması en fazla 500 karakter olabilir."
      );
      return;
    }

    try {
      setLoading(true);

      if (board) {
        await updateBoard(
          board.id,
          cleanTitle,
          cleanDescription
        );
      } else {
        await createBoard(
          cleanTitle,
          cleanDescription
        );
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert(
        "Hata",
        error.response?.data?.message ||
          "İşlem sırasında bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {board ? "Panoyu Düzenle" : "Yeni Pano"}
      </Text>

      <Text style={styles.label}>Pano Başlığı</Text>

      <TextInput
        style={styles.input}
        placeholder="Pano başlığı"
        value={title}
        onChangeText={setTitle}
        maxLength={100}
      />

      <Text style={styles.label}>Açıklama</Text>

      <TextInput
        style={[styles.input, styles.description]}
        placeholder="Pano açıklaması"
        value={description}
        onChangeText={setDescription}
        multiline
        maxLength={500}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>
            {board ? "Değişiklikleri Kaydet" : "Pano Oluştur"}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 24,
    paddingTop: 60,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 32,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },

  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    minHeight: 52,
    marginBottom: 20,
  },

  description: {
    minHeight: 120,
    paddingTop: 14,
    textAlignVertical: "top",
  },

  button: {
    height: 52,
    backgroundColor: "#111827",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
  },
});