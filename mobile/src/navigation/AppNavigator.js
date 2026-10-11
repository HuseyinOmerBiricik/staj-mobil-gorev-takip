import {
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";

import BoardNavigator from "./BoardNavigator";
import ProfileScreen from "../screens/ProfileScreen";
import SettingsScreen from "../screens/SettingsScreen";

const Tab =
  createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="BoardsTab"
        component={BoardNavigator}
        options={{
          title: "Panolar",
          tabBarLabel: "Panolar",
        }}
      />

      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: "Profil",
          tabBarLabel: "Profil",
        }}
      />

      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          title: "Ayarlar",
          tabBarLabel: "Ayarlar",
        }}
      />
    </Tab.Navigator>
  );
}