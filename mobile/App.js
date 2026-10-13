import {
  useEffect,
} from "react";

import {
  View,
  ActivityIndicator,
} from "react-native";

import {
  NavigationContainer,
  DarkTheme,
  DefaultTheme,
} from "@react-navigation/native";

import {
  GestureHandlerRootView,
} from "react-native-gesture-handler";

import {
  StatusBar,
} from "expo-status-bar";

import RootNavigator from "./src/navigation/RootNavigator";

import useThemeStore from "./src/store/themeStore";
import useSyncStore from "./src/store/syncStore";

import {
  useAppTheme,
} from "./src/theme/theme";

export default function App() {
  const loadTheme =
    useThemeStore(
      (state) =>
        state.loadTheme
    );

  const isHydrated =
    useThemeStore(
      (state) =>
        state.isHydrated
    );

  const initializeSync =
    useSyncStore(
      (state) =>
        state.initialize
    );

  const stopSync =
    useSyncStore(
      (state) =>
        state.stop
    );

  const {
    isDark,
    colors,
  } =
    useAppTheme();

  useEffect(() => {
    loadTheme();
  }, [
    loadTheme,
  ]);

  useEffect(() => {
    initializeSync();

    return () => {
      stopSync();
    };
  }, [
    initializeSync,
    stopSync,
  ]);

  const navigationTheme = {
    ...(isDark
      ? DarkTheme
      : DefaultTheme),

    colors: {
      ...(isDark
        ? DarkTheme.colors
        : DefaultTheme.colors),

      primary:
        colors.primary,

      background:
        colors.background,

      card:
        colors.card,

      text:
        colors.text,

      border:
        colors.border,

      notification:
        colors.danger,
    },
  };

  if (
    !isHydrated
  ) {
    return (
      <GestureHandlerRootView
        style={{
          flex: 1,
        }}
      >
        <View
          style={{
            flex: 1,

            alignItems:
              "center",

            justifyContent:
              "center",

            backgroundColor:
              colors.background,
          }}
        >
          <ActivityIndicator
            size="large"
            color={
              colors.text
            }
          />
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView
      style={{
        flex: 1,
      }}
    >
      <StatusBar
        style={
          isDark
            ? "light"
            : "dark"
        }
      />

      <NavigationContainer
        theme={
          navigationTheme
        }
      >
        <RootNavigator />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}