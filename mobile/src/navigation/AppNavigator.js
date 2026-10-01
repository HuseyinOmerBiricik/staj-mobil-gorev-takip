import { createNativeStackNavigator } from "@react-navigation/native-stack";

import BoardListScreen from "../screens/BoardListScreen";
import BoardFormScreen from "../screens/BoardFormScreen";
import BoardDetailScreen from "../screens/BoardDetailScreen";
import TaskDetailScreen from "../screens/TaskDetailScreen";
import TaskFormScreen from "../screens/TaskFormScreen";

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
      <Stack.Screen
        name="TaskDetail"
        component={TaskDetailScreen}
      />

      <Stack.Screen
        name="TaskForm"
        component={TaskFormScreen}
      />
    </Stack.Navigator>
  );
}