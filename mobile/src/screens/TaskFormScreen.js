import {
  useEffect,
  useState,
} from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";

import useTaskStore from "../store/taskStore";
import useBoardMemberStore from "../store/boardMemberStore";

import {
  useAppTheme,
} from "../theme/theme";

function AssigneeSelect({
  users,
  value,
  onChange,
  styles,
}) {
  const [visible, setVisible] =
    useState(false);

  const selectedUser =
    users.find(
      (user) =>
        String(user.id) ===
        String(value)
    );

  return (
    <>
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() =>
          setVisible(true)
        }
      >
        <Text
          style={
            styles.selectButtonText
          }
        >
          {selectedUser
            ? selectedUser.name
            : "Atanmamış"}
        </Text>

        <Text
          style={styles.selectArrow}
        >
          ▼
        </Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setVisible(false)
        }
      >
        <View
          style={
            styles.selectOverlay
          }
        >
          <View
            style={
              styles.selectModal
            }
          >
            <Text
              style={
                styles.selectTitle
              }
            >
              Atanan Kişi
            </Text>

            <TouchableOpacity
              style={
                styles.selectOption
              }
              onPress={() => {
                onChange(null);
                setVisible(false);
              }}
            >
              <Text
                style={
                  styles.selectOptionText
                }
              >
                Atanmamış
              </Text>

              {value == null ? (
                <Text
                  style={
                    styles.check
                  }
                >
                  ✓
                </Text>
              ) : null}
            </TouchableOpacity>

            {users.map((user) => {
              const selected =
                String(
                  user.id
                ) ===
                String(value);

              return (
                <TouchableOpacity
                  key={user.id}
                  style={
                    styles.selectOption
                  }
                  onPress={() => {
                    onChange(
                      user.id
                    );

                    setVisible(
                      false
                    );
                  }}
                >
                  <View
                    style={{
                      flex: 1,
                    }}
                  >
                    <Text
                      style={
                        styles.selectOptionText
                      }
                    >
                      {user.name}
                    </Text>

                    <Text
                      style={
                        styles.selectOptionEmail
                      }
                    >
                      {user.email}
                    </Text>
                  </View>

                  {selected ? (
                    <Text
                      style={
                        styles.check
                      }
                    >
                      ✓
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={
                styles.selectCancel
              }
              onPress={() =>
                setVisible(false)
              }
            >
              <Text
                style={
                  styles.selectCancelText
                }
              >
                İptal
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default function TaskFormScreen({
  route,
  navigation,
}) {
  const {
    listId,
    boardId,
    task,
  } = route.params;

  const createTask =
    useTaskStore(
      (state) =>
        state.createTask
    );

  const updateTask =
    useTaskStore(
      (state) =>
        state.updateTask
    );

  const assignableUsers =
    useBoardMemberStore(
      (state) =>
        state.assignableUsers
    );

  const fetchAssignableUsers =
    useBoardMemberStore(
      (state) =>
        state.fetchAssignableUsers
    );

  const [title, setTitle] =
    useState(
      task?.title || ""
    );

  const [
    description,
    setDescription,
  ] = useState(
    task?.description || ""
  );

  const [
    priority,
    setPriority,
  ] = useState(
    task?.priority ||
      "medium"
  );

  const [dueDate, setDueDate] =
    useState(
      task?.dueDate
        ? new Date(
            task.dueDate
          )
        : null
    );

  const [
    assigneeId,
    setAssigneeId,
  ] = useState(
    task?.assigneeId ??
      null
  );

  const [
    showDatePicker,
    setShowDatePicker,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    usersLoading,
    setUsersLoading,
  ] = useState(false);

  const { colors, isDark } =
    useAppTheme();

  const styles =
    createStyles(colors);

  useEffect(() => {
    const loadUsers =
      async () => {
        if (!boardId) {
          Alert.alert(
            "Hata",
            "Pano bilgisi bulunamadı."
          );

          return;
        }

        try {
          setUsersLoading(true);

          await fetchAssignableUsers(
            boardId
          );
        } catch (error) {
          Alert.alert(
            "Hata",
            error.response?.data
              ?.message ||
              "Pano üyeleri alınamadı."
          );
        } finally {
          setUsersLoading(
            false
          );
        }
      };

    loadUsers();
  }, [
    boardId,
    fetchAssignableUsers,
  ]);

  const handleSave =
    async () => {
      const cleanTitle =
        title.trim();

      const cleanDescription =
        description.trim();

      if (
        cleanTitle.length < 2 ||
        cleanTitle.length >
          150
      ) {
        Alert.alert(
          "Hata",
          "Görev başlığı 2-150 karakter arasında olmalıdır."
        );

        return;
      }

      if (
        cleanDescription.length >
        1000
      ) {
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

          description:
            cleanDescription,

          priority,

          dueDate: dueDate
            ? dueDate.toISOString()
            : null,

          assigneeId:
            assigneeId == null
              ? null
              : Number(
                  assigneeId
                ),
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
          error.response?.data
            ?.message ||
            "Görev kaydedilemedi."
        );
      } finally {
        setLoading(false);
      }
    };

    const handleDateValueChange = (
      event,
      selectedDate
    ) => {
      if (selectedDate) {
        setDueDate(selectedDate);
      }

      setShowDatePicker(false);
    };
    const handleDateDismiss = () => {
      setShowDatePicker(false);
    };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
      keyboardShouldPersistTaps="handled"
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
        placeholderTextColor={
          colors.secondaryText
        }
        value={title}
        onChangeText={setTitle}
        maxLength={150}
        editable={!loading}
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
        placeholderTextColor={
          colors.secondaryText
        }
        multiline
        value={description}
        onChangeText={
          setDescription
        }
        maxLength={1000}
        editable={!loading}
      />

      <Text style={styles.counter}>
        {description.length}/1000
      </Text>

      <Text style={styles.label}>
        Öncelik
      </Text>

      <View
        style={
          styles.priorityRow
        }
      >
        {[
          ["low", "Düşük"],
          ["medium", "Orta"],
          ["high", "Yüksek"],
        ].map(
          ([value, label]) => (
            <TouchableOpacity
              key={value}
              style={[
                styles.priorityButton,
                priority ===
                  value &&
                  styles.selected,
              ]}
              onPress={() =>
                setPriority(
                  value
                )
              }
            >
              <Text
                style={
                  priority ===
                  value
                    ? styles.selectedText
                    : styles.normalText
                }
              >
                {label}
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>

      <Text style={styles.label}>
        Son Tarih
      </Text>

      <TouchableOpacity
        style={
          styles.dateButton
        }
        onPress={() =>
          setShowDatePicker(
            true
          )
        }
      >
        <Text
          style={styles.dateText}
        >
          {dueDate
            ? dueDate.toLocaleDateString(
                "tr-TR"
              )
            : "Tarih seçilmedi"}
        </Text>
      </TouchableOpacity>

      {dueDate ? (
        <TouchableOpacity
          onPress={() =>
            setDueDate(null)
          }
        >
          <Text
            style={
              styles.removeDate
            }
          >
            Tarihi kaldır
          </Text>
        </TouchableOpacity>
      ) : null}

      {showDatePicker ? (
        <DateTimePicker
          value={
            dueDate ||
            new Date()
          }
          mode="date"
          minimumDate={
            new Date()
          }
          onValueChange={
            handleDateValueChange
          }
          onDismiss={
            handleDateDismiss
          }
          themeVariant={
            isDark
              ? "dark"
              : "light"
          }
        />
      ) : null}

      <Text style={styles.label}>
        Atanan Kişi
      </Text>

      {usersLoading ? (
        <View
          style={
            styles.usersLoading
          }
        >
          <ActivityIndicator
            color={colors.text}
          />

          <Text
            style={
              styles.usersLoadingText
            }
          >
            Pano üyeleri yükleniyor...
          </Text>
        </View>
      ) : (
        <AssigneeSelect
          users={
            assignableUsers
          }
          value={
            assigneeId
          }
          onChange={
            setAssigneeId
          }
          styles={styles}
        />
      )}

      <TouchableOpacity
        style={[
          styles.saveButton,
          loading &&
            styles.disabled,
        ]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator
            color={
              colors.onPrimary
            }
          />
        ) : (
          <Text
            style={
              styles.saveText
            }
          >
            {task
              ? "Değişiklikleri Kaydet"
              : "Görev Oluştur"}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        colors.background,
    },

    content: {
      padding: 24,
      paddingTop: 56,
      paddingBottom: 50,
    },

    back: {
      color: colors.text,
      fontSize: 16,
      marginBottom: 20,
    },

    title: {
      color: colors.text,
      fontSize: 28,
      fontWeight: "700",
      marginBottom: 30,
    },

    label: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 8,
    },

    input: {
      minHeight: 52,
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.input,
      color: colors.text,
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
      color:
        colors.secondaryText,
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
      borderColor:
        colors.border,
      backgroundColor:
        colors.card,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
    },

    selected: {
      backgroundColor:
        colors.primary,
      borderColor:
        colors.primary,
    },

    selectedText: {
      color:
        colors.onPrimary,
      fontWeight: "600",
    },

    normalText: {
      color: colors.text,
    },

    dateButton: {
      height: 52,
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.input,
      borderRadius: 10,
      paddingHorizontal: 14,
      justifyContent: "center",
      marginBottom: 18,
    },

    dateText: {
      color: colors.text,
    },

    removeDate: {
      color: colors.text,
      marginTop: -8,
      marginBottom: 20,
      fontWeight: "600",
    },

    usersLoading: {
      height: 52,
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 24,
    },

    usersLoadingText: {
      color:
        colors.secondaryText,
      marginLeft: 10,
    },

    selectButton: {
      minHeight: 52,
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.input,
      borderRadius: 10,
      paddingHorizontal: 14,
      marginBottom: 26,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    selectButtonText: {
      color: colors.text,
      fontSize: 15,
    },

    selectArrow: {
      color:
        colors.secondaryText,
      fontSize: 11,
    },

    selectOverlay: {
      flex: 1,
      backgroundColor:
        colors.overlay,
      justifyContent: "center",
      padding: 24,
    },

    selectModal: {
      maxHeight: "75%",
      backgroundColor:
        colors.card,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 14,
      padding: 18,
    },

    selectTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 14,
    },

    selectOption: {
      minHeight: 56,
      borderBottomWidth: 1,
      borderBottomColor:
        colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      paddingHorizontal: 6,
    },

    selectOptionText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "600",
    },

    selectOptionEmail: {
      color:
        colors.secondaryText,
      fontSize: 11,
      marginTop: 3,
    },

    check: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "700",
    },

    selectCancel: {
      height: 46,
      marginTop: 14,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
    },

    selectCancelText: {
      color: colors.text,
      fontWeight: "600",
    },

    saveButton: {
      height: 52,
      backgroundColor:
        colors.primary,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },

    saveText: {
      color:
        colors.onPrimary,
      fontSize: 16,
      fontWeight: "600",
    },

    disabled: {
      opacity: 0.6,
    },
  });
}