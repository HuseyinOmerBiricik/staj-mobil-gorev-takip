import {
  useState,
} from "react";

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";

import Constants from "expo-constants";

import useThemeStore from "../store/themeStore";
import useSyncStore from "../store/syncStore";

import {
  useAppTheme,
} from "../theme/theme";

function formatSyncDate(
  value
) {
  if (!value) {
    return "Henüz senkronizasyon yapılmadı";
  }

  return new Date(
    value
  ).toLocaleString(
    "tr-TR"
  );
}

export default function SettingsScreen() {
  const [
    appearanceOpen,
    setAppearanceOpen,
  ] =
    useState(false);

  const [
    syncOpen,
    setSyncOpen,
  ] =
    useState(false);

  const [
    aboutOpen,
    setAboutOpen,
  ] =
    useState(false);

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

  const version =
    Constants.expoConfig
      ?.version ||
    "1.0.0";

  const ThemeOption = ({
    value,
    title,
    description,
  }) => {
    const selected =
      theme ===
      value;

    return (
      <TouchableOpacity
        style={[
          styles.themeOption,

          selected &&
            styles.themeOptionSelected,
        ]}
        onPress={() =>
          setTheme(
            value
          )
        }
      >
        <View
          style={{
            flex: 1,
          }}
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

  const SectionHeader = ({
    title,
    subtitle,
    open,
    onPress,
  }) => (
    <TouchableOpacity
      style={
        styles.sectionHeader
      }
      onPress={
        onPress
      }
    >
      <View
        style={{
          flex: 1,
        }}
      >
        <Text
          style={
            styles.sectionHeaderTitle
          }
        >
          {title}
        </Text>

        {subtitle ? (
          <Text
            style={
              styles.sectionHeaderSubtitle
            }
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      <Text
        style={
          styles.chevron
        }
      >
        {open
          ? "⌃"
          : "⌄"}
      </Text>
    </TouchableOpacity>
  );

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

      Alert.alert(
        "Senkronizasyon",
        state.pendingCount ===
        0
          ? "Tüm değişiklikler senkronize edildi."
          : state.lastError ||
              "Bazı değişiklikler bekliyor."
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
        Ayarlar
      </Text>

      <View
        style={
          styles.sectionCard
        }
      >
        <SectionHeader
          title="Görünüm"
          subtitle={
            theme ===
            "light"
              ? "Açık Tema"
              : theme ===
                "dark"
              ? "Karanlık Tema"
              : "Sistem Ayarı"
          }
          open={
            appearanceOpen
          }
          onPress={() =>
            setAppearanceOpen(
              !appearanceOpen
            )
          }
        />

        {appearanceOpen ? (
          <View
            style={
              styles.sectionContent
            }
          >
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
              description="Telefonun tema ayarını otomatik takip et."
            />
          </View>
        ) : null}
      </View>

      <View
        style={
          styles.sectionCard
        }
      >
        <SectionHeader
          title="Offline ve Senkronizasyon"
          subtitle={
            isConnected
              ? pendingCount >
                0
                ? `${pendingCount} değişiklik bekliyor`
                : "Tüm veriler güncel"
              : "Çevrimdışı mod"
          }
          open={
            syncOpen
          }
          onPress={() =>
            setSyncOpen(
              !syncOpen
            )
          }
        />

        {syncOpen ? (
          <View
            style={
              styles.sectionContent
            }
          >
            <View
              style={
                styles.connectionCard
              }
            >
              <View
                style={
                  styles.connectionHeader
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
                      styles.connectionTitle
                    }
                  >
                    {isConnected
                      ? "Çevrimiçi"
                      : "Çevrimdışı"}
                  </Text>

                  <Text
                    style={
                      styles.connectionDescription
                    }
                  >
                    {isConnected
                      ? "Bağlantı kullanılabilir."
                      : "Veriler cihaz önbelleğinden gösteriliyor."}
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.dataRow
                }
              >
                <Text
                  style={
                    styles.dataLabel
                  }
                >
                  Bekleyen değişiklik
                </Text>

                <Text
                  style={
                    styles.dataValue
                  }
                >
                  {
                    pendingCount
                  }
                </Text>
              </View>

              <View
                style={
                  styles.dataRow
                }
              >
                <Text
                  style={
                    styles.dataLabel
                  }
                >
                  Son senkronizasyon
                </Text>

                <Text
                  style={
                    styles.dataDate
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
                    pendingCount ===
                      0 ||
                    isSyncing
                  ) &&
                    styles.disabled,
                ]}
                disabled={
                  !isConnected ||
                  pendingCount ===
                    0 ||
                  isSyncing
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
          </View>
        ) : null}
      </View>

      <View
        style={
          styles.sectionCard
        }
      >
        <SectionHeader
          title="Uygulama ve Güvenlik"
          subtitle={`Sürüm ${version}`}
          open={
            aboutOpen
          }
          onPress={() =>
            setAboutOpen(
              !aboutOpen
            )
          }
        />

        {aboutOpen ? (
          <View
            style={
              styles.sectionContent
            }
          >
            <View
              style={
                styles.aboutRow
              }
            >
              <Text
                style={
                  styles.aboutLabel
                }
              >
                Uygulama
              </Text>

              <Text
                style={
                  styles.aboutValue
                }
              >
                Görev ve Proje Takip
              </Text>
            </View>

            <View
              style={
                styles.divider
              }
            />

            <View
              style={
                styles.aboutRow
              }
            >
              <Text
                style={
                  styles.aboutLabel
                }
              >
                Sürüm
              </Text>

              <Text
                style={
                  styles.aboutValue
                }
              >
                {version}
              </Text>
            </View>

            <View
              style={
                styles.divider
              }
            />

            <Text
              style={
                styles.securityTitle
              }
            >
              Veri Güvenliği
            </Text>

            <Text
              style={
                styles.securityText
              }
            >
              Oturum anahtarı cihazın SecureStore alanında tutulur. Offline veriler yalnızca uygulamanın yerel depolama alanında saklanır.
            </Text>

            <Text
              style={
                styles.securityTitle
              }
            >
              Offline Kullanım
            </Text>

            <Text
              style={
                styles.securityText
              }
            >
              Daha önce yüklenen panolar, görevler ve yorumlar internet bağlantısı olmadan görüntülenebilir. Bekleyen değişiklikler bağlantı geri geldiğinde senkronize edilir.
            </Text>
          </View>
        ) : null}
      </View>
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
        20,
      paddingTop: 56,
      paddingBottom: 50,
    },

    title: {
      color: colors.text,
      fontSize: 30,
      fontWeight: "700",
      marginBottom: 26,
    },

    sectionCard: {
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.card,
      borderRadius: 14,
      marginBottom: 12,
      overflow: "hidden",
    },

    sectionHeader: {
      minHeight: 72,
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection: "row",
      alignItems: "center",
    },

    sectionHeaderTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "700",
    },

    sectionHeaderSubtitle: {
      color:
        colors.secondaryText,
      fontSize: 11,
      marginTop: 4,
    },

    chevron: {
      color:
        colors.secondaryText,
      fontSize: 20,
      marginLeft: 12,
    },

    sectionContent: {
      borderTopWidth: 1,
      borderTopColor:
        colors.border,
      padding: 14,
    },

    themeOption: {
      minHeight: 72,
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.surface,
      borderRadius: 11,
      padding: 14,
      marginBottom: 9,
      flexDirection: "row",
      alignItems: "center",
    },

    themeOptionSelected: {
      borderColor:
        colors.primary,
      borderWidth: 2,
    },

    optionTitle: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "700",
    },

    optionDescription: {
      color:
        colors.secondaryText,
      fontSize: 11,
      lineHeight: 16,
      marginTop: 4,
    },

    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor:
        colors.border,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 12,
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

    connectionCard: {
      backgroundColor:
        colors.surface,
      borderRadius: 11,
      padding: 14,
    },

    connectionHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 14,
    },

    statusDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 9,
      marginTop: 4,
    },

    onlineDot: {
      backgroundColor:
        "#22c55e",
    },

    offlineDot: {
      backgroundColor:
        colors.danger,
    },

    connectionTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "700",
    },

    connectionDescription: {
      color:
        colors.secondaryText,
      fontSize: 11,
      marginTop: 3,
    },

    dataRow: {
      minHeight: 45,
      borderTopWidth: 1,
      borderTopColor:
        colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: 12,
    },

    dataLabel: {
      color:
        colors.secondaryText,
      fontSize: 11,
    },

    dataValue: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "700",
    },

    dataDate: {
      flex: 1,
      textAlign: "right",
      color: colors.text,
      fontSize: 10,
    },

    errorText: {
      color: colors.danger,
      fontSize: 11,
      marginTop: 8,
    },

    syncButton: {
      height: 44,
      backgroundColor:
        colors.primary,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 12,
    },

    syncButtonText: {
      color:
        colors.onPrimary,
      fontWeight: "700",
    },

    disabled: {
      opacity: 0.4,
    },

    aboutRow: {
      minHeight: 38,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    aboutLabel: {
      color:
        colors.secondaryText,
      fontSize: 11,
    },

    aboutValue: {
      color: colors.text,
      fontSize: 12,
      fontWeight: "600",
    },

    divider: {
      height: 1,
      backgroundColor:
        colors.border,
      marginVertical: 9,
    },

    securityTitle: {
      color: colors.text,
      fontSize: 13,
      fontWeight: "700",
      marginTop: 10,
    },

    securityText: {
      color:
        colors.secondaryText,
      fontSize: 11,
      lineHeight: 17,
      marginTop: 4,
      marginBottom: 8,
    },
  });
}