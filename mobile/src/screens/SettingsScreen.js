import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import useThemeStore from "../store/themeStore";

import {
  useAppTheme,
} from "../theme/theme";

export default function SettingsScreen() {
  const theme =
    useThemeStore(
      (state) =>
        state.theme
    );

  const setTheme =
    useThemeStore(
      (state) =>
        state.setTheme
    );

  const {
    colors,
  } = useAppTheme();

  const styles =
    createStyles(
      colors
    );

  const ThemeOption = ({
    value,
    title,
    description,
  }) => {
    const selected =
      theme === value;

    return (
      <TouchableOpacity
        style={[
          styles.option,

          selected &&
            styles.optionSelected,
        ]}
        onPress={() =>
          setTheme(value)
        }
      >
        <View
          style={
            styles.optionText
          }
        >
          <Text
            style={
              styles.optionTitle
            }
          >
            {title}
          </Text>

          <Text
            style={
              styles.optionDescription
            }
          >
            {description}
          </Text>
        </View>

        <View
          style={[
            styles.radio,

            selected &&
              styles.radioSelected,
          ]}
        >
          {selected ? (
            <View
              style={
                styles.radioInner
              }
            />
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={
        styles.container
      }
    >
      <Text
        style={
          styles.title
        }
      >
        Ayarlar
      </Text>

      <Text
        style={
          styles.sectionTitle
        }
      >
        Görünüm
      </Text>

      <ThemeOption
        value="light"
        title="Açık Tema"
        description="Uygulamayı her zaman açık temada kullan."
      />

      <ThemeOption
        value="dark"
        title="Karanlık Tema"
        description="Uygulamayı her zaman karanlık temada kullan."
      />

      <ThemeOption
        value="system"
        title="Sistem Ayarını Kullan"
        description="Telefonun açık veya karanlık tema ayarını takip et."
      />

      <Text
        style={
          styles.info
        }
      >
        Tema tercihiniz cihazda saklanır ve uygulama tekrar açıldığında korunur.
      </Text>
    </View>
  );
}

function createStyles(
  colors
) {
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

      color:
        colors.text,

      marginBottom: 32,
    },

    sectionTitle: {
      fontSize: 15,

      fontWeight: "700",

      color:
        colors.text,

      marginBottom: 12,
    },

    option: {
      minHeight: 78,

      borderWidth: 1,

      borderColor:
        colors.border,

      borderRadius: 12,

      padding: 16,

      marginBottom: 12,

      backgroundColor:
        colors.card,

      flexDirection: "row",

      alignItems:
        "center",
    },

    optionSelected: {
      borderColor:
        colors.primary,

      borderWidth: 2,
    },

    optionText: {
      flex: 1,

      paddingRight: 16,
    },

    optionTitle: {
      fontSize: 16,

      fontWeight: "700",

      color:
        colors.text,
    },

    optionDescription: {
      fontSize: 13,

      color:
        colors.secondaryText,

      marginTop: 5,

      lineHeight: 18,
    },

    radio: {
      width: 22,

      height: 22,

      borderRadius: 11,

      borderWidth: 2,

      borderColor:
        colors.border,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    radioSelected: {
      borderColor:
        colors.primary,
    },

    radioInner: {
      width: 10,

      height: 10,

      borderRadius: 5,

      backgroundColor:
        colors.primary,
    },

    info: {
      color:
        colors.secondaryText,

      fontSize: 12,

      lineHeight: 18,

      marginTop: 10,
    },
  });
}