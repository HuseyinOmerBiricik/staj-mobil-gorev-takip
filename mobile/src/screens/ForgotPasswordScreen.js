import { useState } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import api from "../services/api";

import {
  useAppTheme,
} from "../theme/theme";

export default function ForgotPasswordScreen({
  navigation,
}) {
  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const { colors } =
    useAppTheme();

  const styles =
    createStyles(colors);

  const handleSendCode =
    async () => {
      const cleanEmail =
        email
          .trim()
          .toLowerCase();

      if (!cleanEmail) {
        Alert.alert(
          "Hata",
          "E-posta adresinizi girin."
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
        setLoading(true);

        const response =
          await api.post(
            "/auth/forgot-password",
            {
              email: cleanEmail,
            }
          );

        Alert.alert(
          "Kod Gönderildi",
          response.data.message,
          [
            {
              text: "Tamam",
              onPress: () =>
                navigation.navigate(
                  "ResetPassword",
                  {
                    email:
                      cleanEmail,
                  }
                ),
            },
          ]
        );
      } catch (error) {
        Alert.alert(
          "Hata",
          error.response?.data
            ?.message ||
            "Kod gönderilemedi."
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <View
        style={styles.content}
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
          Şifremi Unuttum
        </Text>

        <Text
          style={styles.subtitle}
        >
          Hesabınıza kayıtlı e-posta adresini girin. Size 6 haneli bir doğrulama kodu göndereceğiz.
        </Text>

        <Text style={styles.label}>
          E-posta
        </Text>

        <TextInput
          style={styles.input}
          placeholder="ornek@email.com"
          placeholderTextColor={
            colors.secondaryText
          }
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
          editable={!loading}
        />

        <TouchableOpacity
          style={
            styles.button
          }
          onPress={
            handleSendCode
          }
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
                styles.buttonText
              }
            >
              Kod Gönder
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        colors.background,
      justifyContent: "center",
    },

    content: {
      paddingHorizontal: 24,
    },

    back: {
      color: colors.text,
      fontSize: 16,
      marginBottom: 28,
    },

    title: {
      color: colors.text,
      fontSize: 30,
      fontWeight: "700",
      marginBottom: 8,
    },

    subtitle: {
      color:
        colors.secondaryText,
      fontSize: 14,
      lineHeight: 21,
      marginBottom: 30,
    },

    label: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 8,
    },

    input: {
      height: 52,
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.input,
      color: colors.text,
      borderRadius: 10,
      paddingHorizontal: 14,
      marginBottom: 20,
    },

    button: {
      height: 52,
      backgroundColor:
        colors.primary,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },

    buttonText: {
      color:
        colors.onPrimary,
      fontSize: 16,
      fontWeight: "700",
    },
  });
}