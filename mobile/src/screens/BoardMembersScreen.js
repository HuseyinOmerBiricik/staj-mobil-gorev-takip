import {
  useCallback,
  useState,
} from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";

import {
  useFocusEffect,
} from "@react-navigation/native";

import useAuthStore from "../store/authStore";
import useBoardMemberStore from "../store/boardMemberStore";

import {
  useAppTheme,
} from "../theme/theme";

export default function BoardMembersScreen({
  route,
  navigation,
}) {
  const { board } =
    route.params;

  const user = useAuthStore(
    (state) => state.user
  );

  const members =
    useBoardMemberStore(
      (state) => state.members
    );

  const isLoading =
    useBoardMemberStore(
      (state) => state.isLoading
    );

  const isSaving =
    useBoardMemberStore(
      (state) => state.isSaving
    );

  const fetchMembers =
    useBoardMemberStore(
      (state) =>
        state.fetchMembers
    );

  const inviteMember =
    useBoardMemberStore(
      (state) =>
        state.inviteMember
    );

  const removeMember =
    useBoardMemberStore(
      (state) =>
        state.removeMember
    );

  const leaveBoard =
    useBoardMemberStore(
      (state) =>
        state.leaveBoard
    );

  const clearBoardMembers =
    useBoardMemberStore(
      (state) =>
        state.clearBoardMembers
    );

  const [email, setEmail] =
    useState("");

  const { colors } =
    useAppTheme();

  const styles =
    createStyles(colors);

  const isOwner =
    board.accessRole ===
      "owner" ||
    Number(board.ownerId) ===
      Number(user?.id);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          await fetchMembers(
            board.id
          );
        } catch (error) {
          Alert.alert(
            "Hata",
            error.response?.data
              ?.message ||
              "Pano üyeleri alınamadı."
          );
        }
      };

      load();

      return () => {
        clearBoardMembers();
      };
    }, [
      board.id,
      fetchMembers,
      clearBoardMembers,
    ])
  );

  const handleInvite =
    async () => {
      const cleanEmail =
        email
          .trim()
          .toLowerCase();

      if (!cleanEmail) {
        Alert.alert(
          "Hata",
          "E-posta adresi girin."
        );

        return;
      }

      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        !emailRegex.test(
          cleanEmail
        )
      ) {
        Alert.alert(
          "Hata",
          "Geçerli bir e-posta adresi girin."
        );

        return;
      }

      try {
        const added =
          await inviteMember(
            board.id,
            cleanEmail
          );

        setEmail("");

        Alert.alert(
          "Başarılı",
          `${added.user.name} panoya eklendi.`
        );
      } catch (error) {
        Alert.alert(
          "Davet Hatası",
          error.response?.data
            ?.message ||
            "Kullanıcı davet edilemedi."
        );
      }
    };

  const handleRemove = (
    member
  ) => {
    Alert.alert(
      "Üyeyi Çıkar",
      `${member.user.name} kullanıcısını bu panodan çıkarmak istediğinize emin misiniz?`,
      [
        {
          text: "İptal",
          style: "cancel",
        },
        {
          text: "Çıkar",
          style: "destructive",

          onPress:
            async () => {
              try {
                await removeMember(
                  board.id,
                  member.user.id
                );
              } catch (
                error
              ) {
                Alert.alert(
                  "Hata",
                  error.response
                    ?.data
                    ?.message ||
                    "Kullanıcı çıkarılamadı."
                );
              }
            },
        },
      ]
    );
  };

  const handleLeave = () => {
    Alert.alert(
      "Panodan Ayrıl",
      `"${board.title}" panosundan ayrılmak istediğinize emin misiniz?`,
      [
        {
          text: "İptal",
          style: "cancel",
        },
        {
          text: "Ayrıl",
          style: "destructive",

          onPress:
            async () => {
              try {
                await leaveBoard(
                  board.id
                );

                navigation.popToTop();
              } catch (
                error
              ) {
                Alert.alert(
                  "Hata",
                  error.response
                    ?.data
                    ?.message ||
                    "Panodan ayrılamadı."
                );
              }
            },
        },
      ]
    );
  };

  const renderMember = ({
    item,
  }) => {
    const owner =
      item.isOwner ||
      item.role === "owner";

    return (
      <View
        style={
          styles.memberCard
        }
      >
        <View
          style={
            styles.memberInfo
          }
        >
          <View
            style={
              styles.avatar
            }
          >
            <Text
              style={
                styles.avatarText
              }
            >
              {item.user.name
                ?.charAt(0)
                ?.toUpperCase() ||
                "?"}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <View
              style={
                styles.nameRow
              }
            >
              <Text
                style={
                  styles.memberName
                }
              >
                {item.user.name}
              </Text>

              {owner ? (
                <View
                  style={
                    styles.ownerBadge
                  }
                >
                  <Text
                    style={
                      styles.ownerBadgeText
                    }
                  >
                    Sahip
                  </Text>
                </View>
              ) : (
                <View
                  style={
                    styles.memberBadge
                  }
                >
                  <Text
                    style={
                      styles.memberBadgeText
                    }
                  >
                    Üye
                  </Text>
                </View>
              )}
            </View>

            <Text
              style={
                styles.memberEmail
              }
            >
              {item.user.email}
            </Text>
          </View>
        </View>

        {isOwner &&
        !owner ? (
          <TouchableOpacity
            style={
              styles.removeButton
            }
            disabled={isSaving}
            onPress={() =>
              handleRemove(item)
            }
          >
            <Text
              style={
                styles.removeText
              }
            >
              Çıkar
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <View
      style={styles.container}
    >
      <TouchableOpacity
        onPress={() =>
          navigation.goBack()
        }
      >
        <Text style={styles.back}>
          ‹ Geri
        </Text>
      </TouchableOpacity>

      <Text style={styles.title}>
        Pano Üyeleri
      </Text>

      <Text
        style={styles.boardName}
      >
        {board.title}
      </Text>

      {isOwner ? (
        <View
          style={
            styles.inviteCard
          }
        >
          <Text
            style={
              styles.inviteTitle
            }
          >
            Kullanıcı Davet Et
          </Text>

          <Text
            style={
              styles.inviteInfo
            }
          >
            Sistemde kayıtlı kullanıcının e-posta adresini girin.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="kullanici@email.com"
            placeholderTextColor={
              colors.secondaryText
            }
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isSaving}
          />

          <TouchableOpacity
            style={[
              styles.inviteButton,
              isSaving &&
                styles.disabled,
            ]}
            onPress={
              handleInvite
            }
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator
                color={
                  colors.onPrimary
                }
              />
            ) : (
              <Text
                style={
                  styles.inviteButtonText
                }
              >
                Davet Et
              </Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View
          style={
            styles.memberNotice
          }
        >
          <Text
            style={
              styles.memberNoticeText
            }
          >
            Bu panoya üye olarak erişiyorsunuz.
          </Text>
        </View>
      )}

      <Text
        style={styles.listTitle}
      >
        Üyeler
      </Text>

      {isLoading &&
      members.length === 0 ? (
        <ActivityIndicator
          size="large"
          color={colors.text}
          style={{ marginTop: 30 }}
        />
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) =>
            String(item.id)
          }
          renderItem={
            renderMember
          }
          contentContainerStyle={
            styles.list
          }
          ListEmptyComponent={
            <Text
              style={
                styles.emptyText
              }
            >
              Üye bulunamadı.
            </Text>
          }
        />
      )}

      {!isOwner ? (
        <TouchableOpacity
          style={
            styles.leaveButton
          }
          onPress={
            handleLeave
          }
          disabled={isSaving}
        >
          <Text
            style={
              styles.leaveText
            }
          >
            Panodan Ayrıl
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 56,
      paddingHorizontal: 20,
      backgroundColor:
        colors.background,
    },

    back: {
      color: colors.text,
      fontSize: 16,
      marginBottom: 18,
    },

    title: {
      color: colors.text,
      fontSize: 28,
      fontWeight: "700",
    },

    boardName: {
      color:
        colors.secondaryText,
      fontSize: 14,
      marginTop: 4,
      marginBottom: 22,
    },

    inviteCard: {
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
    },

    inviteTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: "700",
    },

    inviteInfo: {
      color:
        colors.secondaryText,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 5,
      marginBottom: 14,
    },

    input: {
      height: 50,
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.input,
      color: colors.text,
      borderRadius: 9,
      paddingHorizontal: 13,
      marginBottom: 10,
    },

    inviteButton: {
      height: 48,
      backgroundColor:
        colors.primary,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
    },

    inviteButtonText: {
      color:
        colors.onPrimary,
      fontWeight: "700",
    },

    disabled: {
      opacity: 0.6,
    },

    memberNotice: {
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.card,
      borderRadius: 10,
      padding: 14,
      marginBottom: 24,
    },

    memberNoticeText: {
      color:
        colors.secondaryText,
    },

    listTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 12,
    },

    list: {
      paddingBottom: 120,
    },

    memberCard: {
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.card,
      borderRadius: 11,
      padding: 14,
      marginBottom: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    memberInfo: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
    },

    avatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor:
        colors.surface,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },

    avatarText: {
      color: colors.text,
      fontWeight: "800",
      fontSize: 17,
    },

    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 8,
    },

    memberName: {
      color: colors.text,
      fontWeight: "700",
      fontSize: 15,
    },

    memberEmail: {
      color:
        colors.secondaryText,
      fontSize: 12,
      marginTop: 4,
    },

    ownerBadge: {
      backgroundColor:
        colors.primary,
      borderRadius: 20,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },

    ownerBadgeText: {
      color:
        colors.onPrimary,
      fontSize: 10,
      fontWeight: "700",
    },

    memberBadge: {
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 20,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },

    memberBadgeText: {
      color:
        colors.secondaryText,
      fontSize: 10,
      fontWeight: "600",
    },

    removeButton: {
      marginLeft: 10,
      paddingVertical: 8,
      paddingHorizontal: 10,
    },

    removeText: {
      color: colors.danger,
      fontWeight: "700",
      fontSize: 12,
    },

    emptyText: {
      color:
        colors.secondaryText,
      textAlign: "center",
      marginTop: 30,
    },

    leaveButton: {
      position: "absolute",
      left: 20,
      right: 20,
      bottom: 24,
      height: 50,
      borderWidth: 1,
      borderColor:
        colors.danger,
      backgroundColor:
        colors.background,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },

    leaveText: {
      color: colors.danger,
      fontWeight: "700",
    },
  });
}