import {
  useEffect,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";

import useTaskStore from "../store/taskStore";
import useCommentStore from "../store/commentStore";
import useAuthStore from "../store/authStore";

import {
  useAppTheme,
} from "../theme/theme";

const priorityLabels = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
};

const EMPTY_TASKS = [];
const EMPTY_COMMENTS = [];

export default function TaskDetailScreen({
  route,
  navigation,
}) {
const {
  task,
  listId,
  boardId,
} = route.params;

  const user = useAuthStore(
    (state) => state.user
  );

  const tasksByList =
    useTaskStore(
      (state) =>
        state.tasksByList
    );

  const deleteTask =
    useTaskStore(
      (state) =>
        state.deleteTask
    );

  const commentsByTask =
    useCommentStore(
      (state) =>
        state.commentsByTask
    );

  const commentsLoading =
    useCommentStore(
      (state) =>
        state.isLoading
    );

  const commentSaving =
    useCommentStore(
      (state) =>
        state.isSaving
    );

  const fetchComments =
    useCommentStore(
      (state) =>
        state.fetchComments
    );

  const addComment =
    useCommentStore(
      (state) =>
        state.addComment
    );

  const updateComment =
    useCommentStore(
      (state) =>
        state.updateComment
    );

  const deleteComment =
    useCommentStore(
      (state) =>
        state.deleteComment
    );

  const tasks =
    tasksByList[listId] ??
    EMPTY_TASKS;

  const currentTask =
    tasks.find(
      (item) =>
        item.id === task.id
    ) || task;

  const comments =
    commentsByTask[
      currentTask.id
    ] ?? EMPTY_COMMENTS;

  const [commentText, setCommentText] =
    useState("");

  const [
    editingComment,
    setEditingComment,
  ] = useState(null);

  const { colors } =
    useAppTheme();

  const styles =
    createStyles(colors);

  useEffect(() => {
    const loadComments =
      async () => {
        try {
          await fetchComments(
            currentTask.id
          );
        } catch (error) {
          Alert.alert(
            "Hata",
            error.response?.data
              ?.message ||
              "Yorumlar yüklenemedi."
          );
        }
      };

    loadComments();
  }, [
    currentTask.id,
    fetchComments,
  ]);

  const handleDeleteTask = () => {
    Alert.alert(
      "Görevi Sil",
      `"${currentTask.title}" görevini silmek istediğinize emin misiniz?`,
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
              await deleteTask(
                currentTask.id,
                listId
              );

              navigation.goBack();
            } catch (error) {
              Alert.alert(
                "Hata",
                error.response?.data
                  ?.message ||
                  "Görev silinemedi."
              );
            }
          },
        },
      ]
    );
  };

  const resetCommentForm =
    () => {
      setCommentText("");
      setEditingComment(
        null
      );
    };

  const handleSaveComment =
    async () => {
      const content =
        commentText.trim();

      if (!content) {
        Alert.alert(
          "Hata",
          "Yorum boş bırakılamaz."
        );

        return;
      }

      if (
        content.length > 1000
      ) {
        Alert.alert(
          "Hata",
          "Yorum en fazla 1000 karakter olabilir."
        );

        return;
      }

      try {
        if (editingComment) {
          await updateComment(
            currentTask.id,
            editingComment.id,
            content
          );
        } else {
          await addComment(
            currentTask.id,
            content
          );
        }

        resetCommentForm();
      } catch (error) {
        Alert.alert(
          "Hata",
          error.response?.data
            ?.message ||
            "Yorum kaydedilemedi."
        );
      }
    };

  const handleEditComment =
    (comment) => {
      setEditingComment(
        comment
      );

      setCommentText(
        comment.content
      );
    };

  const handleDeleteComment =
    (comment) => {
      Alert.alert(
        "Yorumu Sil",
        "Bu yorumu silmek istediğinize emin misiniz?",
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
                  await deleteComment(
                    currentTask.id,
                    comment.id
                  );

                  if (
                    editingComment
                      ?.id ===
                    comment.id
                  ) {
                    resetCommentForm();
                  }
                } catch (
                  error
                ) {
                  Alert.alert(
                    "Hata",
                    error.response
                      ?.data
                      ?.message ||
                      "Yorum silinemedi."
                  );
                }
              },
          },
        ]
      );
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
        {currentTask.title}
      </Text>

      <Text
        style={styles.sectionTitle}
      >
        Açıklama
      </Text>

      <Text style={styles.value}>
        {currentTask.description ||
          "Açıklama bulunmuyor."}
      </Text>

      <Text
        style={styles.sectionTitle}
      >
        Öncelik
      </Text>

      <Text style={styles.value}>
        {priorityLabels[
          currentTask.priority
        ] || "Orta"}
      </Text>

      <Text
        style={styles.sectionTitle}
      >
        Son Tarih
      </Text>

      <Text style={styles.value}>
        {currentTask.dueDate
          ? new Date(
              currentTask.dueDate
            ).toLocaleDateString(
              "tr-TR"
            )
          : "Belirtilmedi"}
      </Text>

      <Text
        style={styles.sectionTitle}
      >
        Atanan Kişi
      </Text>

      <Text style={styles.value}>
        {currentTask.assignee
          ?.name ||
          "Atanmamış"}
      </Text>

      <TouchableOpacity
        style={
          styles.editButton
        }
        onPress={() =>
            navigation.navigate(
        "TaskForm",
        {
          listId,
          boardId,
          task: currentTask,
        }
      )
        }
      >
        <Text
          style={styles.editText}
        >
          Görevi Düzenle
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={
          styles.deleteButton
        }
        onPress={
          handleDeleteTask
        }
      >
        <Text
          style={
            styles.deleteText
          }
        >
          Görevi Sil
        </Text>
      </TouchableOpacity>

      <View
        style={
          styles.commentDivider
        }
      />

      <Text
        style={styles.commentsTitle}
      >
        Yorumlar
      </Text>

      <TextInput
        style={styles.commentInput}
        placeholder={
          editingComment
            ? "Yorumu düzenleyin..."
            : "Yorum yazın..."
        }
        placeholderTextColor={
          colors.secondaryText
        }
        value={commentText}
        onChangeText={
          setCommentText
        }
        multiline
        maxLength={1000}
        editable={!commentSaving}
      />

      <Text
        style={styles.counter}
      >
        {commentText.length}/1000
      </Text>

      <View
        style={
          styles.commentFormActions
        }
      >
        {editingComment ? (
          <TouchableOpacity
            style={
              styles.commentCancelButton
            }
            onPress={
              resetCommentForm
            }
            disabled={
              commentSaving
            }
          >
            <Text
              style={
                styles.commentCancelText
              }
            >
              İptal
            </Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={
            styles.commentSaveButton
          }
          onPress={
            handleSaveComment
          }
          disabled={
            commentSaving
          }
        >
          {commentSaving ? (
            <ActivityIndicator
              color={
                colors.onPrimary
              }
            />
          ) : (
            <Text
              style={
                styles.commentSaveText
              }
            >
              {editingComment
                ? "Yorumu Güncelle"
                : "Yorum Ekle"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {commentsLoading &&
      comments.length === 0 ? (
        <ActivityIndicator
          color={colors.text}
          style={
            styles.commentLoading
          }
        />
      ) : comments.length ===
        0 ? (
        <Text
          style={
            styles.emptyComments
          }
        >
          Henüz yorum yok.
        </Text>
      ) : (
        comments.map(
          (comment) => {
            const isOwnComment =
              Number(
                comment.userId
              ) ===
              Number(user?.id);

            return (
              <View
                key={
                  comment.id
                }
                style={
                  styles.commentCard
                }
              >
                <View
                  style={
                    styles.commentHeader
                  }
                >
                  <Text
                    style={
                      styles.commentAuthor
                    }
                  >
                    {comment.user
                      ?.name ||
                      "Kullanıcı"}
                  </Text>

                  <Text
                    style={
                      styles.commentDate
                    }
                  >
                    {new Date(
                      comment.createdAt
                    ).toLocaleString(
                      "tr-TR"
                    )}
                  </Text>
                </View>

                <Text
                  style={
                    styles.commentContent
                  }
                >
                  {
                    comment.content
                  }
                </Text>

                {isOwnComment ? (
                  <View
                    style={
                      styles.commentActions
                    }
                  >
                    <TouchableOpacity
                      onPress={() =>
                        handleEditComment(
                          comment
                        )
                      }
                    >
                      <Text
                        style={
                          styles.commentEdit
                        }
                      >
                        Düzenle
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() =>
                        handleDeleteComment(
                          comment
                        )
                      }
                    >
                      <Text
                        style={
                          styles.commentDelete
                        }
                      >
                        Sil
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            );
          }
        )
      )}
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
      paddingBottom: 60,
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

    sectionTitle: {
      color:
        colors.secondaryText,
      fontSize: 13,
      fontWeight: "700",
      marginTop: 18,
      marginBottom: 6,
    },

    value: {
      color: colors.text,
      fontSize: 16,
      lineHeight: 23,
    },

    editButton: {
      height: 50,
      backgroundColor:
        colors.primary,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 40,
    },

    editText: {
      color:
        colors.onPrimary,
      fontWeight: "600",
    },

    deleteButton: {
      height: 50,
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.card,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 12,
    },

    deleteText: {
      color: colors.danger,
      fontWeight: "600",
    },

    commentDivider: {
      height: 1,
      backgroundColor:
        colors.border,
      marginVertical: 32,
    },

    commentsTitle: {
      color: colors.text,
      fontSize: 22,
      fontWeight: "700",
      marginBottom: 16,
    },

    commentInput: {
      minHeight: 100,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 10,
      backgroundColor:
        colors.input,
      color: colors.text,
      padding: 14,
      textAlignVertical: "top",
    },

    counter: {
      color:
        colors.secondaryText,
      fontSize: 11,
      textAlign: "right",
      marginTop: 5,
    },

    commentFormActions: {
      flexDirection: "row",
      justifyContent:
        "flex-end",
      gap: 10,
      marginTop: 12,
      marginBottom: 24,
    },

    commentCancelButton: {
      height: 44,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.card,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
    },

    commentCancelText: {
      color: colors.text,
      fontWeight: "600",
    },

    commentSaveButton: {
      minWidth: 110,
      height: 44,
      paddingHorizontal: 16,
      backgroundColor:
        colors.primary,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
    },

    commentSaveText: {
      color:
        colors.onPrimary,
      fontWeight: "600",
    },

    commentLoading: {
      marginTop: 20,
    },

    emptyComments: {
      color:
        colors.secondaryText,
      textAlign: "center",
      marginTop: 20,
    },

    commentCard: {
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.card,
      borderRadius: 10,
      padding: 14,
      marginBottom: 12,
    },

    commentHeader: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      gap: 10,
    },

    commentAuthor: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "700",
      flex: 1,
    },

    commentDate: {
      color:
        colors.secondaryText,
      fontSize: 10,
    },

    commentContent: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 20,
      marginTop: 10,
    },

    commentActions: {
      flexDirection: "row",
      gap: 18,
      marginTop: 14,
    },

    commentEdit: {
      color: colors.text,
      fontSize: 12,
      fontWeight: "600",
    },

    commentDelete: {
      color: colors.danger,
      fontSize: 12,
      fontWeight: "600",
    },
  });
}