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

import api from "../services/api";
import { useAppTheme } from "../theme/theme";

export default function RegisterScreen({
  navigation,
}) {
  const [name, setName] =
    useState("");

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

  const handleRegister = async () => {
    const cleanName =
      name.trim();

    const cleanEmail =
      email.trim().toLowerCase();

    if (
      cleanName.length < 2 ||
      cleanName.length > 100
    ) {
      Alert.alert(
        "Hata",
        "Ad soyad 2-100 karakter arasında olmalıdır."
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

    if (password.length < 6) {
      Alert.alert(
        "Hata",
        "Şifre en az 6 karakter olmalıdır."
      );
      return;
    }

    try {
      setLoading(true);

      await api.post(
        "/auth/register",
        {
          name: cleanName,
          email: cleanEmail,
          password,
        }
      );

      Alert.alert(
        "Başarılı",
        "Hesabınız oluşturuldu. Giriş yapabilirsiniz.",
        [
          {
            text: "Tamam",
            onPress: () =>
              navigation.navigate(
                "Login"
              ),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        "Kayıt Hatası",
        error.response?.data
          ?.message ||
          "Kayıt işlemi gerçekleştirilemedi."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
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
        Kayıt Ol
      </Text>

      <Text style={styles.subtitle}>
        Yeni bir hesap oluşturun
      </Text>

      <Text style={styles.label}>
        Ad Soyad
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Ad Soyad"
        placeholderTextColor={
          colors.secondaryText
        }
        value={name}
        onChangeText={setName}
        maxLength={100}
        editable={!loading}
      />

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
        placeholder="En az 6 karakter"
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
          styles.button,
          loading &&
            styles.disabledButton,
        ]}
        onPress={handleRegister}
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
            style={styles.buttonText}
          >
            Kayıt Ol
          </Text>
        )}
      </TouchableOpacity>

      <View style={styles.loginRow}>
        <Text
          style={styles.normalText}
        >
          Zaten hesabınız var mı?{" "}
        </Text>

        <TouchableOpacity
          onPress={() =>
            navigation.navigate(
              "Login"
            )
          }
        >
          <Text
            style={styles.loginText}
          >
            Giriş Yap
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

    back: {
      color: colors.text,
      fontSize: 16,
      marginBottom: 20,
    },

    title: {
      color: colors.text,
      fontSize: 32,
      fontWeight: "700",
      marginBottom: 8,
    },

    subtitle: {
      color:
        colors.secondaryText,
      fontSize: 15,
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
      borderColor: colors.border,
      backgroundColor:
        colors.input,
      color: colors.text,
      borderRadius: 10,
      paddingHorizontal: 14,
      marginBottom: 18,
      fontSize: 16,
    },

    button: {
      height: 52,
      backgroundColor:
        colors.primary,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 6,
    },

    buttonText: {
      color: colors.onPrimary,
      fontSize: 16,
      fontWeight: "600",
    },

    disabledButton: {
      opacity: 0.6,
    },

    loginRow: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 24,
    },

    normalText: {
      color:
        colors.secondaryText,
    },

    loginText: {
      color: colors.text,
      fontWeight: "700",
    },
  });
}