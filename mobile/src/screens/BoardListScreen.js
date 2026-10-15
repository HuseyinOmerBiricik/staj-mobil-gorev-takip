import {
  useCallback,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Modal,
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
  const user =
    useAuthStore(
      (state) =>
        state.user
    );

  const boards =
    useBoardStore(
      (state) =>
        state.boards
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

  const [
    selectedBoard,
    setSelectedBoard,
  ] = useState(null);

  const {
    colors,
  } = useAppTheme();

  const styles =
    createStyles(
      colors
    );

  useFocusEffect(
    useCallback(() => {
      const load =
        async () => {
          try {
            await fetchBoards();
          } catch (error) {
            Alert.alert(
              "Hata",
              error.response
                ?.data
                ?.message ||
                "Panolar alınamadı."
            );
          }
        };

      load();
    }, [
      fetchBoards,
    ])
  );

  const isOwner = (
    board
  ) => {
    return (
      board.accessRole ===
        "owner" ||
      Number(
        board.ownerId
      ) ===
        Number(
          user?.id
        )
    );
  };

  const closeMenu =
    () => {
      setSelectedBoard(
        null
      );
    };

  const openBoard =
    (board) => {
      navigation.navigate(
        "BoardDetail",
        {
          board,
        }
      );
    };

  const openMembers =
    (board) => {
      closeMenu();

      navigation.navigate(
        "BoardMembers",
        {
          board,
        }
      );
    };

  const openEdit =
    (board) => {
      closeMenu();

      navigation.navigate(
        "BoardForm",
        {
          board,
        }
      );
    };

  const handleDelete =
    (board) => {
      closeMenu();

      setTimeout(
        () => {
          Alert.alert(
            "Panoyu Sil",
            `"${board.title}" panosunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
            [
              {
                text:
                  "İptal",

                style:
                  "cancel",
              },

              {
                text:
                  "Sil",

                style:
                  "destructive",

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
                        error
                          .response
                          ?.data
                          ?.message ||
                          "Pano silinemedi."
                      );
                    }
                  },
              },
            ]
          );
        },
        150
      );
    };

  const renderBoard =
    ({
      item,
    }) => {
      const owner =
        isOwner(
          item
        );

      return (
        <TouchableOpacity
          style={
            styles.card
          }
          activeOpacity={
            0.82
          }
          onPress={() =>
            openBoard(
              item
            )
          }
        >
          <View
            style={
              styles.cardHeader
            }
          >
            <View
              style={
                styles.cardTitleArea
              }
            >
              <Text
                style={
                  styles.cardTitle
                }
                numberOfLines={
                  1
                }
              >
                {item.title}
              </Text>

              {item.description ? (
                <Text
                  style={
                    styles.cardDescription
                  }
                  numberOfLines={
                    2
                  }
                >
                  {
                    item.description
                  }
                </Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={
                styles.moreButton
              }
              onPress={() =>
                setSelectedBoard(
                  item
                )
              }
            >
              <Text
                style={
                  styles.moreText
                }
              >
                ⋮
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={
              styles.cardFooter
            }
          >
            <View
              style={[
                styles.roleBadge,

                owner &&
                  styles.ownerBadge,
              ]}
            >
              <Text
                style={[
                  styles.roleText,

                  owner &&
                    styles.ownerText,
                ]}
              >
                {owner
                  ? "Sahip"
                  : "Üye"}
              </Text>
            </View>

            <Text
              style={
                styles.openHint
              }
            >
              Panoyu aç ›
            </Text>
          </View>
        </TouchableOpacity>
      );
    };

  return (
    <View
      style={
        styles.container
      }
    >
      <View
        style={
          styles.header
        }
      >
        <Text
          style={
            styles.title
          }
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
      boards.length ===
        0 ? (
        <ActivityIndicator
          size="large"
          color={
            colors.text
          }
          style={
            styles.loading
          }
        />
      ) : (
        <FlatList
          data={
            boards
          }
          keyExtractor={(
            item
          ) =>
            String(
              item.id
            )
          }
          renderItem={
            renderBoard
          }
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            boards.length ===
            0
              ? styles.emptyContainer
              : styles.list
          }
          ListEmptyComponent={
            <View
              style={
                styles.empty
              }
            >
              <Text
                style={
                  styles.emptyTitle
                }
              >
                Henüz pano yok
              </Text>

              <Text
                style={
                  styles.emptyDescription
                }
              >
                İlk panonuzu oluşturarak başlayabilirsiniz.
              </Text>
            </View>
          }
        />
      )}

      <Modal
        visible={
          selectedBoard !==
          null
        }
        transparent
        animationType="fade"
        onRequestClose={
          closeMenu
        }
      >
        <TouchableOpacity
          style={
            styles.menuOverlay
          }
          activeOpacity={1}
          onPress={
            closeMenu
          }
        >
          <View
            style={
              styles.menuSheet
            }
          >
            <View
              style={
                styles.menuHandle
              }
            />

            <Text
              style={
                styles.menuTitle
              }
              numberOfLines={
                1
              }
            >
              {selectedBoard
                ?.title}
            </Text>

            <TouchableOpacity
              style={
                styles.menuItem
              }
              onPress={() =>
                openMembers(
                  selectedBoard
                )
              }
            >
              <Text
                style={
                  styles.menuItemIcon
                }
              >
                ♟
              </Text>

              <Text
                style={
                  styles.menuItemText
                }
              >
                Pano Üyeleri
              </Text>
            </TouchableOpacity>

            {selectedBoard &&
            isOwner(
              selectedBoard
            ) ? (
              <>
                <TouchableOpacity
                  style={
                    styles.menuItem
                  }
                  onPress={() =>
                    openEdit(
                      selectedBoard
                    )
                  }
                >
                  <Text
                    style={
                      styles.menuItemIcon
                    }
                  >
                    ✎
                  </Text>

                  <Text
                    style={
                      styles.menuItemText
                    }
                  >
                    Panoyu Düzenle
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    styles.menuDeleteItem,
                  ]}
                  onPress={() =>
                    handleDelete(
                      selectedBoard
                    )
                  }
                >
                  <Text
                    style={
                      styles.menuDeleteIcon
                    }
                  >
                    ⌫
                  </Text>

                  <Text
                    style={
                      styles.menuDeleteText
                    }
                  >
                    Panoyu Sil
                  </Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </TouchableOpacity>
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

      paddingHorizontal:
        20,

      paddingTop: 56,
    },

    header: {
      marginBottom:
        22,
    },

    title: {
      color:
        colors.text,

      fontSize: 30,

      fontWeight:
        "700",
    },

    welcome: {
      color:
        colors.secondaryText,

      fontSize: 14,

      marginTop: 5,
    },

    addButton: {
      height: 48,

      backgroundColor:
        colors.primary,

      borderRadius: 12,

      alignItems:
        "center",

      justifyContent:
        "center",

      marginBottom: 20,
    },

    addButtonText: {
      color:
        colors.onPrimary,

      fontWeight:
        "700",

      fontSize: 14,
    },

    list: {
      paddingBottom: 35,
    },

    card: {
      borderWidth: 1,

      borderColor:
        colors.border,

      backgroundColor:
        colors.card,

      borderRadius: 14,

      padding: 16,

      marginBottom: 12,
    },

    cardHeader: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",
    },

    cardTitleArea: {
      flex: 1,

      paddingRight: 10,
    },

    cardTitle: {
      color:
        colors.text,

      fontSize: 18,

      fontWeight:
        "700",
    },

    cardDescription: {
      color:
        colors.secondaryText,

      fontSize: 13,

      lineHeight: 19,

      marginTop: 6,
    },

    moreButton: {
      width: 38,

      height: 38,

      alignItems:
        "center",

      justifyContent:
        "center",

      borderRadius: 19,

      backgroundColor:
        colors.surface,
    },

    moreText: {
      color:
        colors.text,

      fontSize: 26,

      lineHeight: 28,

      marginTop: -5,
    },

    cardFooter: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      marginTop: 18,
    },

    roleBadge: {
      borderWidth: 1,

      borderColor:
        colors.border,

      borderRadius: 15,

      paddingHorizontal: 9,

      paddingVertical: 4,
    },

    ownerBadge: {
      backgroundColor:
        colors.primary,

      borderColor:
        colors.primary,
    },

    roleText: {
      color:
        colors.secondaryText,

      fontSize: 10,

      fontWeight:
        "700",
    },

    ownerText: {
      color:
        colors.onPrimary,
    },

    openHint: {
      color:
        colors.secondaryText,

      fontSize: 11,

      fontWeight:
        "600",
    },

    loading: {
      marginTop: 60,
    },

    emptyContainer: {
      flexGrow: 1,

      justifyContent:
        "center",
    },

    empty: {
      alignItems:
        "center",

      paddingBottom: 80,
    },

    emptyTitle: {
      color:
        colors.text,

      fontSize: 18,

      fontWeight:
        "700",
    },

    emptyDescription: {
      color:
        colors.secondaryText,

      textAlign:
        "center",

      marginTop: 6,
    },

    menuOverlay: {
      flex: 1,

      backgroundColor:
        colors.overlay,

      justifyContent:
        "flex-end",
    },

    menuSheet: {
      backgroundColor:
        colors.card,

      borderTopLeftRadius:
        22,

      borderTopRightRadius:
        22,

      borderWidth: 1,

      borderColor:
        colors.border,

      paddingHorizontal:
        20,

      paddingTop: 10,

      paddingBottom: 28,
    },

    menuHandle: {
      width: 42,

      height: 4,

      borderRadius: 2,

      backgroundColor:
        colors.border,

      alignSelf:
        "center",

      marginBottom: 17,
    },

    menuTitle: {
      color:
        colors.text,

      fontSize: 18,

      fontWeight:
        "700",

      marginBottom: 12,
    },

    menuItem: {
      minHeight: 54,

      flexDirection:
        "row",

      alignItems:
        "center",

      borderTopWidth: 1,

      borderTopColor:
        colors.border,
    },

    menuItemIcon: {
      color:
        colors.text,

      fontSize: 20,

      width: 34,
    },

    menuItemText: {
      color:
        colors.text,

      fontSize: 15,

      fontWeight:
        "600",
    },

    menuDeleteItem: {
      marginTop: 4,
    },

    menuDeleteIcon: {
      color:
        colors.danger,

      fontSize: 20,

      width: 34,
    },

    menuDeleteText: {
      color:
        colors.danger,

      fontSize: 15,

      fontWeight:
        "700",
    },
  });
}