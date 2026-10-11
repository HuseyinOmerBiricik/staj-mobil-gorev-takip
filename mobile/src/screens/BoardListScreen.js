import {
  useCallback,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";

import {
  useFocusEffect,
} from "@react-navigation/native";

import useAuthStore from "../store/authStore";
import useBoardStore from "../store/boardStore";

import {
  useAppTheme,
} from "../theme/theme";

export default function BoardListScreen({
  navigation,
}) {
  const user = useAuthStore(
    (state) => state.user
  );

  const boards = useBoardStore(
    (state) => state.boards
  );

  const isLoading =
    useBoardStore(
      (state) =>
        state.isLoading
    );

  const fetchBoards =
    useBoardStore(
      (state) =>
        state.fetchBoards
    );

  const deleteBoard =
    useBoardStore(
      (state) =>
        state.deleteBoard
    );

  const { colors } =
    useAppTheme();

  const styles =
    createStyles(colors);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          await fetchBoards();
        } catch (error) {
          Alert.alert(
            "Hata",
            error.response?.data
              ?.message ||
              "Panolar alınamadı."
          );
        }
      };

      load();
    }, [fetchBoards])
  );

  const handleDelete = (
    board
  ) => {
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

          onPress:
            async () => {
              try {
                await deleteBoard(
                  board.id
                );
              } catch (
                error
              ) {
                Alert.alert(
                  "Hata",
                  error.response
                    ?.data
                    ?.message ||
                    "Pano silinemedi."
                );
              }
            },
        },
      ]
    );
  };

  const renderBoard = ({
    item,
  }) => {
    const isOwner =
      item.accessRole ===
        "owner" ||
      Number(item.ownerId) ===
        Number(user?.id);

    return (
      <View
        style={styles.card}
      >
        <View
          style={
            styles.cardHeader
          }
        >
          <Text
            style={
              styles.cardTitle
            }
          >
            {item.title}
          </Text>

          <View
            style={[
              styles.roleBadge,
              isOwner &&
                styles.ownerBadge,
            ]}
          >
            <Text
              style={[
                styles.roleText,
                isOwner &&
                  styles.ownerText,
              ]}
            >
              {isOwner
                ? "Sahip"
                : "Üye"}
            </Text>
          </View>
        </View>

        {item.description ? (
          <Text
            style={
              styles.cardDescription
            }
          >
            {item.description}
          </Text>
        ) : null}

        {!isOwner &&
        item.owner?.name ? (
          <Text
            style={
              styles.ownerInfo
            }
          >
            Pano sahibi:{" "}
            {item.owner.name}
          </Text>
        ) : null}

        <View
          style={styles.actions}
        >
          <TouchableOpacity
            onPress={() =>
              navigation.navigate(
                "BoardDetail",
                {
                  board: item,
                }
              )
            }
          >
            <Text
              style={styles.open}
            >
              Aç
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              navigation.navigate(
                "BoardMembers",
                {
                  board: item,
                }
              )
            }
          >
            <Text
              style={
                styles.members
              }
            >
              Üyeler
            </Text>
          </TouchableOpacity>

          {isOwner ? (
            <>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate(
                    "BoardForm",
                    {
                      board: item,
                    }
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
                    item
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
            </>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View
      style={styles.container}
    >
      <View style={styles.header}>
        <View>
          <Text
            style={styles.title}
          >
            Panolarım
          </Text>

          <Text
            style={
              styles.welcome
            }
          >
            Hoş geldin,{" "}
            {user?.name}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={
          styles.addButton
        }
        onPress={() =>
          navigation.navigate(
            "BoardForm"
          )
        }
      >
        <Text
          style={
            styles.addButtonText
          }
        >
          + Yeni Pano
        </Text>
      </TouchableOpacity>

      {isLoading &&
      boards.length === 0 ? (
        <ActivityIndicator
          size="large"
          color={colors.text}
          style={styles.loading}
        />
      ) : (
        <FlatList
          data={boards}
          keyExtractor={(item) =>
            String(item.id)
          }
          renderItem={
            renderBoard
          }
          contentContainerStyle={
            boards.length === 0
              ? styles.emptyContainer
              : styles.list
          }
          ListEmptyComponent={
            <View>
              <Text
                style={
                  styles.emptyTitle
                }
              >
                Henüz pano bulunmuyor.
              </Text>

              <Text
                style={
                  styles.emptyDescription
                }
              >
                İlk panonuzu oluşturabilirsiniz.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        colors.background,
      paddingHorizontal: 20,
      paddingTop: 56,
    },

    header: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "flex-start",
    },

    title: {
      color: colors.text,
      fontSize: 30,
      fontWeight: "700",
    },

    welcome: {
      color:
        colors.secondaryText,
      fontSize: 14,
      marginTop: 4,
    },

    addButton: {
      height: 48,
      backgroundColor:
        colors.primary,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 28,
      marginBottom: 20,
    },

    addButtonText: {
      color:
        colors.onPrimary,
      fontWeight: "600",
    },

    list: {
      paddingBottom: 30,
    },

    card: {
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 14,
    },

    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: 10,
    },

    cardTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "700",
      flex: 1,
    },

    cardDescription: {
      color:
        colors.secondaryText,
      marginTop: 7,
      fontSize: 14,
    },

    ownerInfo: {
      color:
        colors.secondaryText,
      fontSize: 11,
      marginTop: 10,
    },

    roleBadge: {
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 20,
      paddingHorizontal: 9,
      paddingVertical: 4,
    },

    roleText: {
      color:
        colors.secondaryText,
      fontSize: 10,
      fontWeight: "700",
    },

    ownerBadge: {
      backgroundColor:
        colors.primary,
      borderColor:
        colors.primary,
    },

    ownerText: {
      color:
        colors.onPrimary,
    },

    actions: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: 18,
      gap: 20,
    },

    open: {
      color: colors.text,
      fontWeight: "700",
    },

    members: {
      color: colors.text,
      fontWeight: "600",
    },

    edit: {
      color: colors.text,
      fontWeight: "600",
    },

    delete: {
      color: colors.danger,
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
      color: colors.text,
      fontSize: 18,
      fontWeight: "600",
      textAlign: "center",
    },

    emptyDescription: {
      color:
        colors.secondaryText,
      marginTop: 6,
      textAlign: "center",
    },
  });
}