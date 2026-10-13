import {
  useEffect,
} from "react";

import {
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";

import BoardNavigator from "./BoardNavigator";

import ReminderScreen from "../screens/ReminderScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SettingsScreen from "../screens/SettingsScreen";

import useReminderStore from "../store/reminderStore";
import useSyncStore from "../store/syncStore";

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
      screenOptions={{
        headerShown:
          false,
      }}
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
        }}
      />
    </Tab.Navigator>
  );
}