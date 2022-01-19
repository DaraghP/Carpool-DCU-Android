import { StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { NativeBaseProvider, Box } from 'native-base';
import LoginScreen from './screens/Login';
import RegisterScreen from './screens/Register';
import HomeScreen from './screens/Home';
import { GlobalContext } from './Contexts';
import {useState, useEffect, useMemo, useCallback} from "react";

const Stack = createNativeStackNavigator();

export default function App() {
  const [globals, updateGlobals] = useState({backendURL: "http://448b-2001-bb6-6792-1a00-41f9-a8e9-7047-b59f.ngrok.io", username: "", token: ""})

  const changeGlobals = useCallback((object) => {
    updateGlobals({...globals, ...object})
  }, []);

  const memoGlobals = useMemo(() => ({
    globals,
    changeGlobals
  }), [globals, changeGlobals])

  return (
    <GlobalContext.Provider value={memoGlobals}>
      <NativeBaseProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Login">
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </NativeBaseProvider>
    </GlobalContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
