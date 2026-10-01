import { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";

import { useFocusEffect } from "@react-navigation/native";

import useAuthStore from "../store/authStore";
import useBoardStore from "../store/boardStore";

export default function BoardListScreen({ navigation }) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const boards = useBoardStore((state) => state.boards);
  const isLoading = useBoardStore((state) => state.isLoading);
  const fetchBoards = useBoardStore((state) => state.fetchBoards);
  const deleteBoard = useBoardStore((state) => state.deleteBoard);

  useFocusEffect(
    useCallback(() => {
      fetchBoards();
    }, [fetchBoards])
  );

  const handleDelete = (board) => {
    Alert.alert(
      "Panoyu Sil",
      `"${board.title}" panosunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
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
              await deleteBoard(board.id);
            } catch (error) {
              Alert.alert(
                "Hata",
                error.response?.data?.message ||
                  "Pano silinemedi."
              );
            }
          },
        },
      ]
    );
  };

  const renderBoard = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.title}</Text>

      {item.description ? (
        <Text style={styles.cardDescription}>
          {item.description}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("BoardForm", {
              board: item,
            })
          }
        >
          <Text style={styles.edit}>Düzenle</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleDelete(item)}
        >
          <Text style={styles.delete}>Sil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Panolarım</Text>

          <Text style={styles.welcome}>
            Hoş geldin, {user?.name}
          </Text>
        </View>

        <TouchableOpacity onPress={logout}>
          <Text style={styles.logout}>Çıkış</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("BoardForm")}
      >
        <Text style={styles.addButtonText}>
          + Yeni Pano
        </Text>
      </TouchableOpacity>

      {isLoading && boards.length === 0 ? (
        <ActivityIndicator
          size="large"
          style={styles.loading}
        />
      ) : (
        <FlatList
          data={boards}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderBoard}
          contentContainerStyle={
            boards.length === 0
              ? styles.emptyContainer
              : styles.list
          }
          ListEmptyComponent={
            <View>
              <Text style={styles.emptyTitle}>
                Henüz pano bulunmuyor.
              </Text>

              <Text style={styles.emptyDescription}>
                İlk panonuzu oluşturabilirsiniz.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingTop: 60,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
  },

  welcome: {
    fontSize: 14,
    marginTop: 4,
  },

  logout: {
    fontWeight: "600",
    marginTop: 8,
  },

  addButton: {
    height: 48,
    backgroundColor: "#111827",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 28,
    marginBottom: 20,
  },

  addButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },

  list: {
    paddingBottom: 30,
  },

  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  cardDescription: {
    marginTop: 6,
    fontSize: 14,
  },

  actions: {
    flexDirection: "row",
    marginTop: 18,
    gap: 24,
  },

  edit: {
    fontWeight: "600",
  },

  delete: {
    fontWeight: "600",
  },

  loading: {
    marginTop: 50,
  },

  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },

  emptyDescription: {
    marginTop: 6,
    textAlign: "center",
  },
});