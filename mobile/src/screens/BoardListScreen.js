import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

import useAuthStore from "../store/authStore";

export default function BoardListScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Panolarım</Text>

      <Text style={styles.welcome}>
        Hoş geldin, {user?.name}
      </Text>

      <Text style={styles.emptyText}>
        Henüz pano bulunmuyor.
      </Text>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={logout}
      >
        <Text style={styles.logoutText}>
          Çıkış Yap
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    paddingTop: 64,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 8,
  },

  welcome: {
    fontSize: 16,
    marginBottom: 40,
  },

  emptyText: {
    fontSize: 15,
  },

  logoutButton: {
    marginTop: 40,
    height: 48,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  logoutText: {
    fontSize: 15,
    fontWeight: "600",
  },
});