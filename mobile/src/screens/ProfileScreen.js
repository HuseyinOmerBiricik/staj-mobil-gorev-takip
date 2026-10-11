import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";

import useAuthStore from "../store/authStore";
import { useAppTheme } from "../theme/theme";

export default function ProfileScreen() {
  const user = useAuthStore(
    (state) => state.user
  );

  const logout = useAuthStore(
    (state) => state.logout
  );

  const { colors } =
    useAppTheme();

  const styles =
    createStyles(colors);

  const handleLogout = () => {
    Alert.alert(
      "Çıkış Yap",
      "Oturumunuzu kapatmak istediğinize emin misiniz?",
      [
        {
          text: "İptal",
          style: "cancel",
        },
        {
          text: "Çıkış Yap",
          style: "destructive",
          onPress: logout,
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Profil
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>
          Ad Soyad
        </Text>

        <Text style={styles.value}>
          {user?.name || "-"}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.label}>
          E-posta
        </Text>

        <Text style={styles.value}>
          {user?.email || "-"}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>
          Çıkış Yap
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        colors.background,
      paddingHorizontal: 24,
      paddingTop: 60,
    },

    title: {
      fontSize: 30,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 30,
    },

    card: {
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 12,
      padding: 18,
      backgroundColor:
        colors.card,
    },

    label: {
      fontSize: 13,
      fontWeight: "600",
      color:
        colors.secondaryText,
      marginBottom: 6,
    },

    value: {
      fontSize: 17,
      color: colors.text,
    },

    divider: {
      height: 1,
      backgroundColor:
        colors.border,
      marginVertical: 18,
    },

    logoutButton: {
      height: 50,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 30,
      backgroundColor:
        colors.card,
    },

    logoutText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.danger,
    },
  });
}