import { createNativeStackNavigator } from "@react-navigation/native-stack";

import BoardListScreen from "../screens/BoardListScreen";
import BoardFormScreen from "../screens/BoardFormScreen";
import BoardDetailScreen from "../screens/BoardDetailScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="BoardList"
        component={BoardListScreen}
      />

      <Stack.Screen
        name="BoardForm"
        component={BoardFormScreen}
      />

      <Stack.Screen
        name="BoardDetail"
        component={BoardDetailScreen}
      />
    </Stack.Navigator>
  );
}