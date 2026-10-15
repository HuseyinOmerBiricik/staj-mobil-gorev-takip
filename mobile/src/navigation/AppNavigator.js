import {
  useEffect,
} from "react";

import {
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";

import Ionicons from "@expo/vector-icons/Ionicons";

import BoardNavigator from "./BoardNavigator";

import ReminderScreen from "../screens/ReminderScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SettingsScreen from "../screens/SettingsScreen";

import useReminderStore from "../store/reminderStore";
import useSyncStore from "../store/syncStore";

import {
  useAppTheme,
} from "../theme/theme";

const Tab =
  createBottomTabNavigator();

export default function AppNavigator() {
  const fetchReminders =
    useReminderStore(
      (state) =>
        state.fetchReminders
    );

  const counts =
    useReminderStore(
      (state) =>
        state.counts
    );

  const pendingCount =
    useSyncStore(
      (state) =>
        state.pendingCount
    );

  const {
    colors,
  } = useAppTheme();

  useEffect(() => {
    const load =
      async () => {
        try {
          await fetchReminders();
        } catch (error) {
          console.log(
            "Hatırlatmalar başlangıçta alınamadı:",
            error
          );
        }
      };

    load();
  }, [
    fetchReminders,
  ]);

  const urgentCount =
    counts.overdue +
    counts.today +
    counts.tomorrow;

  return (
    <Tab.Navigator
      screenOptions={({
        route,
      }) => ({
        headerShown: false,

        tabBarActiveTintColor:
          colors.text,

        tabBarInactiveTintColor:
          colors.secondaryText,

        tabBarStyle: {
          backgroundColor:
            colors.card,

          borderTopColor:
            colors.border,

          borderTopWidth: 1,

          height: 68,

          paddingTop: 7,

          paddingBottom: 8,
        },

        tabBarLabelStyle: {
          fontSize: 11,

          fontWeight: "600",
        },

        tabBarIcon: ({
          color,
          size,
          focused,
        }) => {
          let iconName =
            "ellipse-outline";

          if (
            route.name ===
            "BoardsTab"
          ) {
            iconName =
              focused
                ? "grid"
                : "grid-outline";
          }

          if (
            route.name ===
            "ReminderTab"
          ) {
            iconName =
              focused
                ? "notifications"
                : "notifications-outline";
          }

          if (
            route.name ===
            "ProfileTab"
          ) {
            iconName =
              focused
                ? "person"
                : "person-outline";
          }

          if (
            route.name ===
            "SettingsTab"
          ) {
            iconName =
              focused
                ? "settings"
                : "settings-outline";
          }

          return (
            <Ionicons
              name={
                iconName
              }
              size={
                focused
                  ? 24
                  : 22
              }
              color={
                color
              }
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="BoardsTab"
        component={
          BoardNavigator
        }
        options={{
          title:
            "Panolar",

          tabBarLabel:
            "Panolar",
        }}
      />

      <Tab.Screen
        name="ReminderTab"
        component={
          ReminderScreen
        }
        options={{
          title:
            "Hatırlatmalar",

          tabBarLabel:
            "Hatırlatmalar",

          tabBarBadge:
            urgentCount >
            0
              ? urgentCount
              : undefined,

          tabBarBadgeStyle: {
            fontSize: 10,

            minWidth: 18,

            height: 18,

            lineHeight: 18,
          },
        }}
      />

      <Tab.Screen
        name="ProfileTab"
        component={
          ProfileScreen
        }
        options={{
          title:
            "Profil",

          tabBarLabel:
            "Profil",
        }}
      />

      <Tab.Screen
        name="SettingsTab"
        component={
          SettingsScreen
        }
        options={{
          title:
            "Ayarlar",

          tabBarLabel:
            "Ayarlar",

          tabBarBadge:
            pendingCount >
            0
              ? pendingCount
              : undefined,

          tabBarBadgeStyle: {
            fontSize: 10,

            minWidth: 18,

            height: 18,

            lineHeight: 18,
          },
        }}
      />
    </Tab.Navigator>
  );
}