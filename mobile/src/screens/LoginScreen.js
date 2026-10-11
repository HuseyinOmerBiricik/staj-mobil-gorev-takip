import { useState } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";

import useAuthStore from "../store/authStore";
import { useAppTheme } from "../theme/theme";

export default function LoginScreen({
  navigation,
}) {
  const login = useAuthStore(
    (state) => state.login
  );

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const { colors } =
    useAppTheme();

  const styles =
    createStyles(colors);

  const handleLogin = async () => {
    const cleanEmail =
      email.trim().toLowerCase();

    if (!cleanEmail) {
      Alert.alert(
        "Hata",
        "E-posta adresi zorunludur."
      );
      return;
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailRegex.test(cleanEmail)
    ) {
      Alert.alert(
        "Hata",
        "Geçerli bir e-posta adresi girin."
      );
      return;
    }

    if (!password) {
      Alert.alert(
        "Hata",
        "Şifre zorunludur."
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Hata",
        "Şifre en az 6 karakter olmalıdır."
      );
      return;
    }

    try {
      setLoading(true);

      await login(
        cleanEmail,
        password
      );
    } catch (error) {
      console.log(
        "LOGIN ERROR:",
        {
          message:
            error?.message,
          code:
            error?.code,
          status:
            error?.response?.status,
          data:
            error?.response?.data,
          baseURL:
            error?.config?.baseURL,
          url:
            error?.config?.url,
        }
      );

      const message =
        error?.response?.data
          ?.message ||
        error?.message ||
        "Sunucuya bağlanırken bir hata oluştu.";

      Alert.alert(
        "Giriş Hatası",
        message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Giriş Yap
      </Text>

      <Text style={styles.subtitle}>
        Hesabınıza giriş yapın
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
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!loading}
      />

      <Text style={styles.label}>
        Şifre
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Şifreniz"
        placeholderTextColor={
          colors.secondaryText
        }
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />

      <TouchableOpacity
        style={[
          styles.loginButton,
          loading &&
            styles.disabledButton,
        ]}
        onPress={handleLogin}
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
              styles.loginButtonText
            }
          >
            Giriş Yap
          </Text>
        )}
      </TouchableOpacity>

      <View
        style={styles.registerRow}
      >
        <Text
          style={styles.normalText}
        >
          Hesabınız yok mu?{" "}
        </Text>

        <TouchableOpacity
          onPress={() =>
            navigation.navigate(
              "Register"
            )
          }
          disabled={loading}
        >
          <Text
            style={
              styles.registerText
            }
          >
            Kayıt Ol
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        colors.background,
      justifyContent: "center",
      paddingHorizontal: 24,
    },

    title: {
      fontSize: 32,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 8,
    },

    subtitle: {
      fontSize: 15,
      color:
        colors.secondaryText,
      marginBottom: 32,
    },

    label: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
    },

    input: {
      height: 52,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor:
        colors.input,
      color: colors.text,
      borderRadius: 10,
      paddingHorizontal: 14,
      marginBottom: 20,
      fontSize: 16,
    },

    loginButton: {
      height: 52,
      backgroundColor:
        colors.primary,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
    },

    disabledButton: {
      opacity: 0.6,
    },

    loginButtonText: {
      color: colors.onPrimary,
      fontSize: 16,
      fontWeight: "600",
    },

    registerRow: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 24,
    },

    normalText: {
      color:
        colors.secondaryText,
    },

    registerText: {
      color: colors.text,
      fontWeight: "700",
    },
  });
}