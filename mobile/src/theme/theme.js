import { useColorScheme } from "react-native";

import useThemeStore from "../store/themeStore";

export const lightColors = {
  background: "#ffffff",
  surface: "#f3f4f6",
  card: "#ffffff",
  input: "#ffffff",

  text: "#111827",
  secondaryText: "#6b7280",

  border: "#d1d5db",

  primary: "#111827",
  onPrimary: "#ffffff",

  danger: "#b91c1c",

  overlay: "rgba(0, 0, 0, 0.4)",
};

export const darkColors = {
  background: "#0f172a",
  surface: "#111827",
  card: "#1f2937",
  input: "#111827",

  text: "#f9fafb",
  secondaryText: "#cbd5e1",

  border: "#374151",

  primary: "#f9fafb",
  onPrimary: "#111827",

  danger: "#f87171",

  overlay: "rgba(0, 0, 0, 0.7)",
};

export function useAppTheme() {
  const preference = useThemeStore(
    (state) => state.theme
  );

  const systemTheme = useColorScheme();

  const isDark =
    preference === "dark" ||
    (preference === "system" &&
      systemTheme === "dark");

  return {
    isDark,
    preference,
    colors: isDark
      ? darkColors
      : lightColors,
  };
}