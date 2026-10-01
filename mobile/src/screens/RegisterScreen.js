import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";

import api from "../services/api";

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !password) {
      Alert.alert(
        "Hata",
        "Ad soyad, e-posta ve şifre alanları zorunludur."
      );
      return;
    }

    if (cleanName.length < 2 || cleanName.length > 100) {
      Alert.alert(
        "Hata",
        "Ad soyad 2-100 karakter arasında olmalıdır."
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      Alert.alert("Hata", "Geçerli bir e-posta adresi giriniz.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Hata", "Şifre en az 6 karakter olmalıdır.");
      return;
    }

    try {
      setLoading(true);

      await api.post("/auth/register", {
        name: cleanName,
        email: cleanEmail,
        password,
      });

      Alert.alert(
        "Başarılı",
        "Kullanıcı hesabı oluşturuldu.",
        [
          {
            text: "Tamam",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Sunucuya bağlanırken bir hata oluştu.";

      Alert.alert("Kayıt başarısız", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Kayıt Ol</Text>

        <Text style={styles.subtitle}>
          Yeni kullanıcı hesabınızı oluşturun.
        </Text>

        <Text style={styles.label}>Ad Soyad</Text>

        <TextInput
          style={styles.input}
          placeholder="Ad Soyad"
          autoCapitalize="words"
          value={name}
          onChangeText={setName}
          editable={!loading}
        />

        <Text style={styles.label}>E-posta</Text>

        <TextInput
          style={styles.input}
          placeholder="ornek@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
        />

        <Text style={styles.label}>Şifre</Text>

        <TextInput
          style={styles.input}
          placeholder="En az 6 karakter"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!loading}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Kayıt Ol</Text>
          )}
        </TouchableOpacity>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>
            Zaten hesabınız var mı?
          </Text>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.loginLink}> Giriş Yap</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    marginBottom: 32,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 18,
  },

  button: {
    height: 52,
    backgroundColor: "#111827",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },

  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },

  loginText: {
    fontSize: 14,
  },

  loginLink: {
    fontSize: 14,
    fontWeight: "700",
  },
});