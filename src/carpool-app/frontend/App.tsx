import { StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { NativeBaseProvider, Box } from 'native-base';
import LoginScreen from './screens/Login';
import RegisterScreen from './screens/Register';
import HomeScreen from './screens/Home';
import { GlobalContext } from './Contexts';
import {useState} from "react";

const Stack = createNativeStackNavigator();

export default function App() {
  const [globals, updateGlobals] = useState({backendURL: "http://da87-46-7-17-96.ngrok.io"})

  const changeGlobals = (object) => {
    updateGlobals({...globals, ...object});
    console.log("test", globals)
  };

  return (
    <GlobalContext.Provider value={{globals, changeGlobals}}>
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
