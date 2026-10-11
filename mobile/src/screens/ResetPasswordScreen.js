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
  ScrollView,
} from "react-native";

import api from "../services/api";

import {
  useAppTheme,
} from "../theme/theme";

export default function ResetPasswordScreen({
  route,
  navigation,
}) {
  const initialEmail =
    route.params?.email || "";

  const [email, setEmail] =
    useState(initialEmail);

  const [code, setCode] =
    useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    passwordAgain,
    setPasswordAgain,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const { colors } =
    useAppTheme();

  const styles =
    createStyles(colors);

  const handleReset =
    async () => {
      const cleanEmail =
        email
          .trim()
          .toLowerCase();

      const cleanCode =
        code.trim();

      if (
        !cleanEmail ||
        !cleanCode ||
        !password
      ) {
        Alert.alert(
          "Hata",
          "Tüm alanları doldurun."
        );

        return;
      }

      if (
        !/^\d{6}$/.test(
          cleanCode
        )
      ) {
        Alert.alert(
          "Hata",
          "Doğrulama kodu 6 haneli olmalıdır."
        );

        return;
      }

      if (
        password.length < 6
      ) {
        Alert.alert(
          "Hata",
          "Şifre en az 6 karakter olmalıdır."
        );

        return;
      }

      if (
        password !==
        passwordAgain
      ) {
        Alert.alert(
          "Hata",
          "Şifreler eşleşmiyor."
        );

        return;
      }

      try {
        setLoading(true);

        const response =
          await api.post(
            "/auth/reset-password",
            {
              email: cleanEmail,
              code: cleanCode,
              password,
            }
          );

        Alert.alert(
          "Başarılı",
          response.data.message,
          [
            {
              text: "Giriş Yap",
              onPress: () =>
                navigation.reset({
                  index: 0,
                  routes: [
                    {
                      name: "Login",
                    },
                  ],
                }),
            },
          ]
        );
      } catch (error) {
        Alert.alert(
          "Hata",
          error.response?.data
            ?.message ||
            "Şifre güncellenemedi."
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
      <ScrollView
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
          Yeni Şifre
        </Text>

        <Text
          style={styles.subtitle}
        >
          E-postanıza gönderilen 6 haneli kodu girerek yeni şifrenizi belirleyin.
        </Text>

        <Text style={styles.label}>
          E-posta
        </Text>

        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="ornek@email.com"
          placeholderTextColor={
            colors.secondaryText
          }
        />

        <Text style={styles.label}>
          Doğrulama Kodu
        </Text>

        <TextInput
          style={[
            styles.input,
            styles.codeInput,
          ]}
          value={code}
          onChangeText={(value) =>
            setCode(
              value.replace(
                /[^0-9]/g,
                ""
              )
            )
          }
          keyboardType="number-pad"
          maxLength={6}
          placeholder="000000"
          placeholderTextColor={
            colors.secondaryText
          }
        />

        <Text style={styles.label}>
          Yeni Şifre
        </Text>

        <TextInput
          style={styles.input}
          value={password}
          onChangeText={
            setPassword
          }
          secureTextEntry
          placeholder="En az 6 karakter"
          placeholderTextColor={
            colors.secondaryText
          }
        />

        <Text style={styles.label}>
          Yeni Şifre Tekrar
        </Text>

        <TextInput
          style={styles.input}
          value={passwordAgain}
          onChangeText={
            setPasswordAgain
          }
          secureTextEntry
          placeholder="Yeni şifrenizi tekrar girin"
          placeholderTextColor={
            colors.secondaryText
          }
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleReset}
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
              Şifreyi Güncelle
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: 24,
      paddingVertical: 50,
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
      marginBottom: 18,
    },

    codeInput: {
      fontSize: 22,
      letterSpacing: 8,
      fontWeight: "700",
      textAlign: "center",
    },

    button: {
      height: 52,
      backgroundColor:
        colors.primary,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
    },

    buttonText: {
      color:
        colors.onPrimary,
      fontSize: 16,
      fontWeight: "700",
    },
  });
}