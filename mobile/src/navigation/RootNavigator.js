import { useEffect } from "react";

import {
  View,
  ActivityIndicator,
} from "react-native";

import AuthNavigator from "./AuthNavigator";
import AppNavigator from "./AppNavigator";

import useAuthStore from "../store/authStore";
import { useAppTheme } from "../theme/theme";

export default function RootNavigator() {
  const user = useAuthStore(
    (state) => state.user
  );

  const isLoading = useAuthStore(
    (state) => state.isLoading
  );

  const checkAuth = useAuthStore(
    (state) => state.checkAuth
  );

  const { colors } =
    useAppTheme();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor:
            colors.background,
        }}
      >
        <ActivityIndicator
          size="large"
          color={colors.text}
        />
      </View>
    );
  }

  return user
    ? <AppNavigator />
    : <AuthNavigator />;
}