import {
  useCallback,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";

import {
  useFocusEffect,
} from "@react-navigation/native";

import useAuthStore from "../store/authStore";
import useBoardStore from "../store/boardStore";
import useReminderStore from "../store/reminderStore";
import useSyncStore from "../store/syncStore";

import {
  useAppTheme,
} from "../theme/theme";

function formatDate(
  value
) {
  if (!value) {
    return "—";
  }

  return new Date(
    value
  ).toLocaleDateString(
    "tr-TR",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
}

export default function ProfileScreen() {
  const user =
    useAuthStore(
      (state) =>
        state.user
    );

  const logout =
    useAuthStore(
      (state) =>
        state.logout
    );

  const boards =
    useBoardStore(
      (state) =>
        state.boards
    );

  const fetchBoards =
    useBoardStore(
      (state) =>
        state.fetchBoards
    );

  const counts =
    useReminderStore(
      (state) =>
        state.counts
    );

  const fetchReminders =
    useReminderStore(
      (state) =>
        state.fetchReminders
    );

  const isConnected =
    useSyncStore(
      (state) =>
        state.isConnected
    );

  const pendingCount =
    useSyncStore(
      (state) =>
        state.pendingCount
    );

  const {
    colors,
  } =
    useAppTheme();

  const styles =
    createStyles(
      colors
    );

  useFocusEffect(
    useCallback(() => {
      fetchBoards()
        .catch(() => {});

      fetchReminders()
        .catch(() => {});
    }, [
      fetchBoards,
      fetchReminders,
    ])
  );

  const ownedBoards =
    boards.filter(
      (board) =>
        board.accessRole ===
          "owner" ||
        Number(
          board.ownerId
        ) ===
          Number(
            user?.id
          )
    ).length;

  const urgentTasks =
    counts.overdue +
    counts.today +
    counts.tomorrow;

  const initials =
    (
      user?.name ||
      "K"
    )
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) =>
          part[0]
            ?.toUpperCase()
      )
      .join("");

  const handleLogout =
    () => {
      Alert.alert(
        "Çıkış Yap",
        "Oturumunuzu kapatmak istediğinize emin misiniz?",
        [
          {
            text: "İptal",
            style:
              "cancel",
          },

          {
            text:
              "Çıkış Yap",

            style:
              "destructive",

            onPress:
              logout,
          },
        ]
      );
    };

  return (
    <ScrollView
      style={
        styles.container
      }
      contentContainerStyle={
        styles.content
      }
      showsVerticalScrollIndicator={
        false
      }
    >
      <Text
        style={
          styles.title
        }
      >
        Profil
      </Text>

      <View
        style={
          styles.profileHeader
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
            {initials}
          </Text>
        </View>

        <View
          style={{
            flex: 1,
          }}
        >
          <Text
            style={
              styles.name
            }
          >
            {user?.name ||
              "-"}
          </Text>

          <Text
            style={
              styles.email
            }
          >
            {user?.email ||
              "-"}
          </Text>

          <View
            style={
              styles.connectionRow
            }
          >
            <View
              style={[
                styles.statusDot,

                isConnected
                  ? styles.onlineDot
                  : styles.offlineDot,
              ]}
            />

            <Text
              style={
                styles.connectionText
              }
            >
              {isConnected
                ? "Çevrimiçi"
                : "Çevrimdışı"}
            </Text>
          </View>
        </View>
      </View>

      <Text
        style={
          styles.sectionTitle
        }
      >
        Özet
      </Text>

      <View
        style={
          styles.statsGrid
        }
      >
        <View
          style={
            styles.statCard
          }
        >
          <Text
            style={
              styles.statValue
            }
          >
            {boards.length}
          </Text>

          <Text
            style={
              styles.statLabel
            }
          >
            Toplam Pano
          </Text>
        </View>

        <View
          style={
            styles.statCard
          }
        >
          <Text
            style={
              styles.statValue
            }
          >
            {ownedBoards}
          </Text>

          <Text
            style={
              styles.statLabel
            }
          >
            Sahibi Olduğum
          </Text>
        </View>

        <View
          style={
            styles.statCard
          }
        >
          <Text
            style={
              styles.statValue
            }
          >
            {urgentTasks}
          </Text>

          <Text
            style={
              styles.statLabel
            }
          >
            Yaklaşan Görev
          </Text>
        </View>

        <View
          style={
            styles.statCard
          }
        >
          <Text
            style={
              styles.statValue
            }
          >
            {pendingCount}
          </Text>

          <Text
            style={
              styles.statLabel
            }
          >
            Bekleyen Sync
          </Text>
        </View>
      </View>

      <Text
        style={
          styles.sectionTitle
        }
      >
        Hesap Bilgileri
      </Text>

      <View
        style={
          styles.infoCard
        }
      >
        <View
          style={
            styles.infoRow
          }
        >
          <Text
            style={
              styles.infoLabel
            }
          >
            Ad Soyad
          </Text>

          <Text
            style={
              styles.infoValue
            }
          >
            {user?.name ||
              "-"}
          </Text>
        </View>

        <View
          style={
            styles.divider
          }
        />

        <View
          style={
            styles.infoRow
          }
        >
          <Text
            style={
              styles.infoLabel
            }
          >
            E-posta
          </Text>

          <Text
            style={
              styles.infoValue
            }
          >
            {user?.email ||
              "-"}
          </Text>
        </View>

        <View
          style={
            styles.divider
          }
        />

        <View
          style={
            styles.infoRow
          }
        >
          <Text
            style={
              styles.infoLabel
            }
          >
            Üyelik Tarihi
          </Text>

          <Text
            style={
              styles.infoValue
            }
          >
            {formatDate(
              user?.createdAt
            )}
          </Text>
        </View>
      </View>

      <Text
        style={
          styles.sectionTitle
        }
      >
        Hesap Güvenliği
      </Text>

      <View
        style={
          styles.securityCard
        }
      >
        <Text
          style={
            styles.securityTitle
          }
        >
          Şifre Kurtarma
        </Text>

        <Text
          style={
            styles.securityText
          }
        >
          Şifrenizi unutmanız durumunda giriş ekranındaki şifre sıfırlama akışını kullanabilirsiniz.
        </Text>
      </View>

      <TouchableOpacity
        style={
          styles.logoutButton
        }
        onPress={
          handleLogout
        }
      >
        <Text
          style={
            styles.logoutText
          }
        >
          Çıkış Yap
        </Text>
      </TouchableOpacity>
    </ScrollView>
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
    },

    content: {
      paddingHorizontal: 20,
      paddingTop: 56,
      paddingBottom: 50,
    },

    title: {
      fontSize: 30,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 26,
    },

    profileHeader: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor:
        colors.card,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 16,
      padding: 18,
      marginBottom: 28,
    },

    avatar: {
      width: 66,
      height: 66,
      borderRadius: 33,
      backgroundColor:
        colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 16,
    },

    avatarText: {
      color:
        colors.onPrimary,
      fontSize: 22,
      fontWeight: "700",
    },

    name: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "700",
    },

    email: {
      color:
        colors.secondaryText,
      fontSize: 13,
      marginTop: 3,
    },

    connectionRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 9,
    },

    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    },

    onlineDot: {
      backgroundColor:
        "#22c55e",
    },

    offlineDot: {
      backgroundColor:
        colors.danger,
    },

    connectionText: {
      color:
        colors.secondaryText,
      fontSize: 11,
    },

    sectionTitle: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "700",
      marginBottom: 10,
      marginTop: 4,
    },

    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 26,
    },

    statCard: {
      width: "48%",
      minHeight: 86,
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.card,
      borderRadius: 13,
      padding: 14,
      justifyContent: "center",
    },

    statValue: {
      color: colors.text,
      fontSize: 23,
      fontWeight: "700",
    },

    statLabel: {
      color:
        colors.secondaryText,
      fontSize: 11,
      marginTop: 4,
    },

    infoCard: {
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.card,
      borderRadius: 14,
      padding: 16,
      marginBottom: 26,
    },

    infoRow: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      gap: 14,
    },

    infoLabel: {
      color:
        colors.secondaryText,
      fontSize: 12,
    },

    infoValue: {
      flex: 1,
      color: colors.text,
      fontSize: 13,
      fontWeight: "600",
      textAlign: "right",
    },

    divider: {
      height: 1,
      backgroundColor:
        colors.border,
      marginVertical: 15,
    },

    securityCard: {
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.card,
      borderRadius: 14,
      padding: 16,
      marginBottom: 24,
    },

    securityTitle: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "700",
    },

    securityText: {
      color:
        colors.secondaryText,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 5,
    },

    logoutButton: {
      height: 50,
      borderWidth: 1,
      borderColor:
        colors.danger,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
    },

    logoutText: {
      color: colors.danger,
      fontSize: 15,
      fontWeight: "700",
    },
  });
}