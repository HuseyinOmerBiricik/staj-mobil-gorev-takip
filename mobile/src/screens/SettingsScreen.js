import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";

import useThemeStore from "../store/themeStore";
import useSyncStore from "../store/syncStore";

import {
  useAppTheme,
} from "../theme/theme";

function formatSyncDate(
  value
) {
  if (!value) {
    return "Henüz senkronizasyon yapılmadı.";
  }

  return new Date(
    value
  ).toLocaleString(
    "tr-TR"
  );
}

export default function SettingsScreen() {
  const theme =
    useThemeStore(
      (state) =>
        state.theme
    );

  const setTheme =
    useThemeStore(
      (state) =>
        state.setTheme
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

  const isSyncing =
    useSyncStore(
      (state) =>
        state.isSyncing
    );

  const lastSyncAt =
    useSyncStore(
      (state) =>
        state.lastSyncAt
    );

  const lastError =
    useSyncStore(
      (state) =>
        state.lastError
    );

  const syncPending =
    useSyncStore(
      (state) =>
        state.syncPending
    );

  const {
    colors,
  } =
    useAppTheme();

  const styles =
    createStyles(
      colors
    );

  const ThemeOption = ({
    value,
    title,
    description,
  }) => {
    const selected =
      theme === value;

    return (
      <TouchableOpacity
        style={[
          styles.option,

          selected &&
            styles.optionSelected,
        ]}
        onPress={() =>
          setTheme(
            value
          )
        }
      >
        <View
          style={
            styles.optionText
          }
        >
          <Text
            style={
              styles.optionTitle
            }
          >
            {title}
          </Text>

          <Text
            style={
              styles.optionDescription
            }
          >
            {description}
          </Text>
        </View>

        <View
          style={[
            styles.radio,

            selected &&
              styles.radioSelected,
          ]}
        >
          {selected ? (
            <View
              style={
                styles.radioInner
              }
            />
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  const handleSync =
    async () => {
      if (
        !isConnected
      ) {
        Alert.alert(
          "Çevrimdışı",
          "Senkronizasyon için internet bağlantısı gereklidir."
        );

        return;
      }

      await syncPending();

      const state =
        useSyncStore.getState();

      if (
        state.pendingCount ===
        0
      ) {
        Alert.alert(
          "Senkronizasyon",
          "Bekleyen değişiklikler başarıyla senkronize edildi."
        );
      } else {
        Alert.alert(
          "Senkronizasyon",
          state.lastError ||
            "Bazı değişiklikler henüz senkronize edilemedi."
        );
      }
    };

  return (
    <ScrollView
      style={
        styles.container
      }
      contentContainerStyle={
        styles.content
      }
    >
      <Text
        style={
          styles.title
        }
      >
        Ayarlar
      </Text>

      <Text
        style={
          styles.sectionTitle
        }
      >
        Görünüm
      </Text>

      <ThemeOption
        value="light"
        title="Açık Tema"
        description="Uygulamayı her zaman açık temada kullan."
      />

      <ThemeOption
        value="dark"
        title="Karanlık Tema"
        description="Uygulamayı her zaman karanlık temada kullan."
      />

      <ThemeOption
        value="system"
        title="Sistem Ayarını Kullan"
        description="Telefonun açık veya karanlık tema ayarını takip et."
      />

      <Text
        style={
          styles.info
        }
      >
        Tema tercihiniz cihazda saklanır ve uygulama tekrar açıldığında korunur.
      </Text>

      <View
        style={
          styles.divider
        }
      />

      <Text
        style={
          styles.sectionTitle
        }
      >
        Offline ve Senkronizasyon
      </Text>

      <View
        style={
          styles.syncCard
        }
      >
        <View
          style={
            styles.statusRow
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

          <View
            style={{
              flex: 1,
            }}
          >
            <Text
              style={
                styles.statusTitle
              }
            >
              {isConnected
                ? "Çevrimiçi"
                : "Çevrimdışı"}
            </Text>

            <Text
              style={
                styles.statusDescription
              }
            >
              {isConnected
                ? "Sunucuya gönderilmeyi bekleyen değişiklikler otomatik olarak senkronize edilir."
                : "Değişiklikler cihazda saklanacak ve bağlantı geri geldiğinde gönderilecek."}
            </Text>
          </View>
        </View>

        <View
          style={
            styles.syncInfoRow
          }
        >
          <Text
            style={
              styles.syncInfoLabel
            }
          >
            Bekleyen değişiklik
          </Text>

          <Text
            style={
              styles.syncInfoValue
            }
          >
            {pendingCount}
          </Text>
        </View>

        <View
          style={
            styles.syncInfoRow
          }
        >
          <Text
            style={
              styles.syncInfoLabel
            }
          >
            Son senkronizasyon
          </Text>

          <Text
            style={
              styles.syncDate
            }
          >
            {formatSyncDate(
              lastSyncAt
            )}
          </Text>
        </View>

        {lastError ? (
          <Text
            style={
              styles.errorText
            }
          >
            {lastError}
          </Text>
        ) : null}

        <TouchableOpacity
          style={[
            styles.syncButton,

            (
              !isConnected ||
              isSyncing ||
              pendingCount ===
                0
            ) &&
              styles.disabledButton,
          ]}
          disabled={
            !isConnected ||
            isSyncing ||
            pendingCount ===
              0
          }
          onPress={
            handleSync
          }
        >
          {isSyncing ? (
            <ActivityIndicator
              color={
                colors.onPrimary
              }
            />
          ) : (
            <Text
              style={
                styles.syncButtonText
              }
            >
              {pendingCount >
              0
                ? "Şimdi Senkronize Et"
                : "Senkronizasyon Tamam"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <Text
        style={
          styles.offlineInfo
        }
      >
        Daha önce yüklenmiş panolar, listeler, görevler ve yorumlar internet olmadan görüntülenebilir. Çevrimdışı yapılan temel değişiklikler cihazda sıraya alınır.
      </Text>
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
      paddingHorizontal:
        24,

      paddingTop: 60,

      paddingBottom: 50,
    },

    title: {
      fontSize: 30,

      fontWeight:
        "700",

      color:
        colors.text,

      marginBottom:
        32,
    },

    sectionTitle: {
      fontSize: 15,

      fontWeight:
        "700",

      color:
        colors.text,

      marginBottom:
        12,
    },

    option: {
      minHeight: 78,

      borderWidth: 1,

      borderColor:
        colors.border,

      borderRadius: 12,

      padding: 16,

      marginBottom: 12,

      backgroundColor:
        colors.card,

      flexDirection:
        "row",

      alignItems:
        "center",
    },

    optionSelected: {
      borderColor:
        colors.primary,

      borderWidth: 2,
    },

    optionText: {
      flex: 1,

      paddingRight: 16,
    },

    optionTitle: {
      fontSize: 16,

      fontWeight:
        "700",

      color:
        colors.text,
    },

    optionDescription: {
      fontSize: 13,

      color:
        colors.secondaryText,

      marginTop: 5,

      lineHeight: 18,
    },

    radio: {
      width: 22,

      height: 22,

      borderRadius: 11,

      borderWidth: 2,

      borderColor:
        colors.border,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    radioSelected: {
      borderColor:
        colors.primary,
    },

    radioInner: {
      width: 10,

      height: 10,

      borderRadius: 5,

      backgroundColor:
        colors.primary,
    },

    info: {
      color:
        colors.secondaryText,

      fontSize: 12,

      lineHeight: 18,

      marginTop: 10,
    },

    divider: {
      height: 1,

      backgroundColor:
        colors.border,

      marginVertical:
        28,
    },

    syncCard: {
      borderWidth: 1,

      borderColor:
        colors.border,

      borderRadius: 14,

      backgroundColor:
        colors.card,

      padding: 16,
    },

    statusRow: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      marginBottom:
        18,
    },

    statusDot: {
      width: 12,

      height: 12,

      borderRadius: 6,

      marginTop: 4,

      marginRight: 10,
    },

    onlineDot: {
      backgroundColor:
        "#22c55e",
    },

    offlineDot: {
      backgroundColor:
        colors.danger,
    },

    statusTitle: {
      color:
        colors.text,

      fontSize: 16,

      fontWeight:
        "700",
    },

    statusDescription: {
      color:
        colors.secondaryText,

      fontSize: 12,

      lineHeight: 18,

      marginTop: 4,
    },

    syncInfoRow: {
      flexDirection:
        "row",

      justifyContent:
        "space-between",

      alignItems:
        "center",

      borderTopWidth: 1,

      borderTopColor:
        colors.border,

      paddingVertical:
        12,

      gap: 12,
    },

    syncInfoLabel: {
      color:
        colors.secondaryText,

      fontSize: 12,
    },

    syncInfoValue: {
      color:
        colors.text,

      fontSize: 16,

      fontWeight:
        "700",
    },

    syncDate: {
      color:
        colors.text,

      fontSize: 11,

      textAlign:
        "right",

      flex: 1,
    },

    errorText: {
      color:
        colors.danger,

      fontSize: 12,

      lineHeight: 18,

      marginTop: 8,
    },

    syncButton: {
      height: 48,

      backgroundColor:
        colors.primary,

      borderRadius: 10,

      alignItems:
        "center",

      justifyContent:
        "center",

      marginTop: 12,
    },

    syncButtonText: {
      color:
        colors.onPrimary,

      fontWeight:
        "700",
    },

    disabledButton: {
      opacity: 0.45,
    },

    offlineInfo: {
      color:
        colors.secondaryText,

      fontSize: 12,

      lineHeight: 18,

      marginTop: 12,
    },
  });
}