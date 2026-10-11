import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

const THEME_KEY = "theme_preference";
const validThemes = ["light", "dark", "system"];

const useThemeStore = create((set) => ({
  theme: "system",
  isHydrated: false,

  loadTheme: async () => {
    try {
      const savedTheme =
        await SecureStore.getItemAsync(THEME_KEY);

      if (
        savedTheme &&
        validThemes.includes(savedTheme)
      ) {
        set({
          theme: savedTheme,
          isHydrated: true,
        });

        return;
      }
    } catch (error) {
      console.log(
        "Tema tercihi okunamadı:",
        error
      );
    }

    set({
      theme: "system",
      isHydrated: true,
    });
  },

  setTheme: async (theme) => {
    if (!validThemes.includes(theme)) {
      return;
    }

    set({ theme });

    try {
      await SecureStore.setItemAsync(
        THEME_KEY,
        theme
      );
    } catch (error) {
      console.log(
        "Tema tercihi kaydedilemedi:",
        error
      );
    }
  },
}));

export default useThemeStore;