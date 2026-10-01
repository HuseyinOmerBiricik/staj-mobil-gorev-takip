import { createNativeStackNavigator } from "@react-navigation/native-stack";

import BoardListScreen from "../screens/BoardListScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="BoardList"
        component={BoardListScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}