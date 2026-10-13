import {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";

import {
  useFocusEffect,
} from "@react-navigation/native";

import useReminderStore from "../store/reminderStore";

import {
  useAppTheme,
} from "../theme/theme";

const FILTERS = [
  {
    value: "all",
    label: "Tümü",
  },

  {
    value:
      "overdue",
    label:
      "Geciken",
  },

  {
    value:
      "today",
    label:
      "Bugün",
  },

  {
    value:
      "tomorrow",
    label:
      "Yarın",
  },

  {
    value:
      "upcoming",
    label:
      "Yaklaşan",
  },
];

const PRIORITY_LABELS = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
};

const STATUS_LABELS = {
  overdue: "Gecikti",
  today: "Bugün",
  tomorrow: "Yarın",
  upcoming: "Yaklaşan",
};

function formatDate(
  value
) {
  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  return date.toLocaleDateString(
    "tr-TR",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
}

function getRemainingText(
  task
) {
  if (
    task.reminderStatus ===
    "overdue"
  ) {
    const days =
      Math.abs(
        task.dayDifference
      );

    return `${days} gün gecikti`;
  }

  if (
    task.reminderStatus ===
    "today"
  ) {
    return "Son gün bugün";
  }

  if (
    task.reminderStatus ===
    "tomorrow"
  ) {
    return "1 gün kaldı";
  }

  return `${task.dayDifference} gün kaldı`;
}

export default function ReminderScreen({
  navigation,
}) {
  const reminders =
    useReminderStore(
      (state) =>
        state.reminders
    );

  const counts =
    useReminderStore(
      (state) =>
        state.counts
    );

  const isLoading =
    useReminderStore(
      (state) =>
        state.isLoading
    );

  const error =
    useReminderStore(
      (state) =>
        state.error
    );

  const fetchReminders =
    useReminderStore(
      (state) =>
        state.fetchReminders
    );

  const [
    selectedFilter,
    setSelectedFilter,
  ] =
    useState("all");

  const {
    colors,
  } = useAppTheme();

  const styles =
    createStyles(
      colors
    );

  const loadReminders =
    useCallback(
      async () => {
        try {
          await fetchReminders();
        } catch (error) {
          Alert.alert(
            "Hata",
            error.response
              ?.data
              ?.message ||
              "Hatırlatmalar yüklenemedi."
          );
        }
      },
      [
        fetchReminders,
      ]
    );

  useFocusEffect(
    useCallback(() => {
      loadReminders();
    }, [
      loadReminders,
    ])
  );

  const filteredReminders =
    useMemo(() => {
      if (
        selectedFilter ===
        "all"
      ) {
        return reminders;
      }

      return reminders.filter(
        (task) =>
          task.reminderStatus ===
          selectedFilter
      );
    }, [
      reminders,
      selectedFilter,
    ]);

  const openTask =
    (task) => {
      navigation.navigate(
        "BoardsTab",
        {
          screen:
            "TaskDetail",

          params: {
            task,

            listId:
              task.listId,

            boardId:
              task.list
                ?.board
                ?.id,
          },
        }
      );
    };

  const renderSummary =
    () => {
      return (
        <View
          style={
            styles.summaryContainer
          }
        >
          <View
            style={[
              styles.summaryCard,
              counts.overdue >
                0 &&
                styles.urgentCard,
            ]}
          >
            <Text
              style={
                styles.summaryNumber
              }
            >
              {
                counts.overdue
              }
            </Text>

            <Text
              style={
                styles.summaryLabel
              }
            >
              Geciken
            </Text>
          </View>

          <View
            style={[
              styles.summaryCard,
              counts.today >
                0 &&
                styles.todayCard,
            ]}
          >
            <Text
              style={
                styles.summaryNumber
              }
            >
              {
                counts.today
              }
            </Text>

            <Text
              style={
                styles.summaryLabel
              }
            >
              Bugün
            </Text>
          </View>

          <View
            style={
              styles.summaryCard
            }
          >
            <Text
              style={
                styles.summaryNumber
              }
            >
              {
                counts.tomorrow
              }
            </Text>

            <Text
              style={
                styles.summaryLabel
              }
            >
              Yarın
            </Text>
          </View>
        </View>
      );
    };

  const renderFilters =
    () => {
      return (
        <View
          style={
            styles.filters
          }
        >
          {FILTERS.map(
            (filter) => {
              const selected =
                selectedFilter ===
                filter.value;

              let count = 0;

              if (
                filter.value ===
                "all"
              ) {
                count =
                  counts.total;
              } else {
                count =
                  counts[
                    filter
                      .value
                  ] || 0;
              }

              return (
                <TouchableOpacity
                  key={
                    filter.value
                  }
                  style={[
                    styles.filterButton,

                    selected &&
                      styles.filterButtonSelected,
                  ]}
                  onPress={() =>
                    setSelectedFilter(
                      filter.value
                    )
                  }
                >
                  <Text
                    style={[
                      styles.filterText,

                      selected &&
                        styles.filterTextSelected,
                    ]}
                  >
                    {filter.label}{" "}
                    ({count})
                  </Text>
                </TouchableOpacity>
              );
            }
          )}
        </View>
      );
    };

  const renderReminder =
    ({
      item,
    }) => {
      const isUrgent =
        item.reminderStatus ===
          "overdue" ||
        item.reminderStatus ===
          "today";

      return (
        <TouchableOpacity
          style={[
            styles.card,

            isUrgent &&
              styles.urgentTaskCard,
          ]}
          activeOpacity={
            0.8
          }
          onPress={() =>
            openTask(item)
          }
        >
          <View
            style={
              styles.cardHeader
            }
          >
            <Text
              style={
                styles.taskTitle
              }
              numberOfLines={
                2
              }
            >
              {item.title}
            </Text>

            <View
              style={[
                styles.statusBadge,

                item.reminderStatus ===
                  "overdue" &&
                  styles.overdueBadge,

                item.reminderStatus ===
                  "today" &&
                  styles.todayBadge,
              ]}
            >
              <Text
                style={
                  styles.statusText
                }
              >
                {
                  STATUS_LABELS[
                    item
                      .reminderStatus
                  ]
                }
              </Text>
            </View>
          </View>

          {item.description ? (
            <Text
              style={
                styles.description
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

          <View
            style={
              styles.infoBlock
            }
          >
            <Text
              style={
                styles.infoText
              }
            >
              Pano:{" "}
              <Text
                style={
                  styles.infoStrong
                }
              >
                {item.list
                  ?.board
                  ?.title ||
                  "-"}
              </Text>
            </Text>

            <Text
              style={
                styles.infoText
              }
            >
              Kolon:{" "}
              <Text
                style={
                  styles.infoStrong
                }
              >
                {item.list
                  ?.title ||
                  "-"}
              </Text>
            </Text>

            <Text
              style={
                styles.infoText
              }
            >
              Son tarih:{" "}
              <Text
                style={
                  styles.infoStrong
                }
              >
                {formatDate(
                  item.dueDate
                )}
              </Text>
            </Text>

            <Text
              style={
                styles.infoText
              }
            >
              Öncelik:{" "}
              <Text
                style={
                  styles.infoStrong
                }
              >
                {PRIORITY_LABELS[
                  item.priority
                ] ||
                  "Orta"}
              </Text>
            </Text>

            <Text
              style={
                styles.infoText
              }
            >
              Atanan:{" "}
              <Text
                style={
                  styles.infoStrong
                }
              >
                {item.assignee
                  ?.name ||
                  "Atanmamış"}
              </Text>
            </Text>
          </View>

          <View
            style={
              styles.cardFooter
            }
          >
            <Text
              style={[
                styles.remaining,

                isUrgent &&
                  styles.remainingUrgent,
              ]}
            >
              {getRemainingText(
                item
              )}
            </Text>

            <Text
              style={
                styles.openText
              }
            >
              Görevi Aç ›
            </Text>
          </View>
        </TouchableOpacity>
      );
    };

  if (
    isLoading &&
    reminders.length ===
      0
  ) {
    return (
      <View
        style={
          styles.center
        }
      >
        <ActivityIndicator
          size="large"
          color={
            colors.text
          }
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Hatırlatmalar yükleniyor...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={
        styles.container
      }
    >
      <Text
        style={
          styles.title
        }
      >
        Hatırlatmalar
      </Text>

      <Text
        style={
          styles.subtitle
        }
      >
        Son tarihi yaklaşan ve geciken görevlerinizi takip edin.
      </Text>

      {renderSummary()}

      {renderFilters()}

      {error ? (
        <View
          style={
            styles.errorBox
          }
        >
          <Text
            style={
              styles.errorText
            }
          >
            {error}
          </Text>

          <TouchableOpacity
            onPress={
              loadReminders
            }
          >
            <Text
              style={
                styles.retryText
              }
            >
              Tekrar dene
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <FlatList
        data={
          filteredReminders
        }
        keyExtractor={(
          item
        ) =>
          String(
            item.id
          )
        }
        renderItem={
          renderReminder
        }
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={
              isLoading
            }
            onRefresh={
              loadReminders
            }
            tintColor={
              colors.text
            }
          />
        }
        contentContainerStyle={
          filteredReminders.length ===
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
              Hatırlatma bulunmuyor.
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              Bu kategoride son tarihli görev bulunmuyor.
            </Text>
          </View>
        }
      />
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

      paddingTop: 56,

      paddingHorizontal:
        18,
    },

    center: {
      flex: 1,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        colors.background,

      padding: 24,
    },

    loadingText: {
      color:
        colors.secondaryText,

      marginTop: 12,
    },

    title: {
      color:
        colors.text,

      fontSize: 30,

      fontWeight:
        "700",
    },

    subtitle: {
      color:
        colors.secondaryText,

      fontSize: 13,

      marginTop: 5,

      marginBottom:
        18,
    },

    summaryContainer: {
      flexDirection:
        "row",

      gap: 8,

      marginBottom:
        16,
    },

    summaryCard: {
      flex: 1,

      minHeight: 72,

      borderWidth: 1,

      borderColor:
        colors.border,

      borderRadius: 12,

      backgroundColor:
        colors.card,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    urgentCard: {
      borderColor:
        colors.danger,

      borderWidth: 2,
    },

    todayCard: {
      borderColor:
        colors.primary,

      borderWidth: 2,
    },

    summaryNumber: {
      color:
        colors.text,

      fontSize: 23,

      fontWeight:
        "700",
    },

    summaryLabel: {
      color:
        colors.secondaryText,

      fontSize: 11,

      marginTop: 3,
    },

    filters: {
      flexDirection:
        "row",

      flexWrap: "wrap",

      gap: 7,

      marginBottom:
        15,
    },

    filterButton: {
      borderWidth: 1,

      borderColor:
        colors.border,

      backgroundColor:
        colors.card,

      borderRadius: 20,

      paddingHorizontal:
        11,

      paddingVertical: 8,
    },

    filterButtonSelected: {
      backgroundColor:
        colors.primary,

      borderColor:
        colors.primary,
    },

    filterText: {
      color:
        colors.text,

      fontSize: 11,

      fontWeight:
        "600",
    },

    filterTextSelected: {
      color:
        colors.onPrimary,
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

      borderRadius: 13,

      padding: 15,

      marginBottom: 12,
    },

    urgentTaskCard: {
      borderColor:
        colors.danger,
    },

    cardHeader: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      gap: 10,
    },

    taskTitle: {
      flex: 1,

      color:
        colors.text,

      fontSize: 17,

      fontWeight:
        "700",

      lineHeight: 23,
    },

    statusBadge: {
      borderWidth: 1,

      borderColor:
        colors.border,

      backgroundColor:
        colors.surface,

      paddingHorizontal:
        9,

      paddingVertical: 5,

      borderRadius: 16,
    },

    overdueBadge: {
      borderColor:
        colors.danger,
    },

    todayBadge: {
      borderColor:
        colors.primary,
    },

    statusText: {
      color:
        colors.text,

      fontSize: 10,

      fontWeight:
        "700",
    },

    description: {
      color:
        colors.secondaryText,

      fontSize: 13,

      lineHeight: 19,

      marginTop: 9,
    },

    infoBlock: {
      marginTop: 14,

      gap: 5,
    },

    infoText: {
      color:
        colors.secondaryText,

      fontSize: 12,
    },

    infoStrong: {
      color:
        colors.text,

      fontWeight:
        "600",
    },

    cardFooter: {
      flexDirection:
        "row",

      justifyContent:
        "space-between",

      alignItems:
        "center",

      marginTop: 16,

      paddingTop: 12,

      borderTopWidth: 1,

      borderTopColor:
        colors.border,
    },

    remaining: {
      color:
        colors.secondaryText,

      fontSize: 12,

      fontWeight:
        "700",
    },

    remainingUrgent: {
      color:
        colors.danger,
    },

    openText: {
      color:
        colors.text,

      fontSize: 12,

      fontWeight:
        "700",
    },

    errorBox: {
      borderWidth: 1,

      borderColor:
        colors.danger,

      borderRadius: 10,

      padding: 12,

      marginBottom: 12,

      backgroundColor:
        colors.card,
    },

    errorText: {
      color:
        colors.danger,

      fontSize: 12,
    },

    retryText: {
      color:
        colors.text,

      fontWeight:
        "700",

      fontSize: 12,

      marginTop: 8,
    },

    emptyContainer: {
      flexGrow: 1,

      justifyContent:
        "center",

      paddingBottom: 80,
    },

    empty: {
      alignItems:
        "center",

      paddingHorizontal:
        25,
    },

    emptyTitle: {
      color:
        colors.text,

      fontSize: 18,

      fontWeight:
        "700",

      textAlign:
        "center",
    },

    emptyText: {
      color:
        colors.secondaryText,

      fontSize: 13,

      textAlign:
        "center",

      lineHeight: 19,

      marginTop: 7,
    },
  });
}