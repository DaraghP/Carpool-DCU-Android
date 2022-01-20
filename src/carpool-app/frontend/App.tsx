import { StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { NativeBaseProvider, Box } from 'native-base';
import LoginScreen from './screens/Login';
import RegisterScreen from './screens/Register';
import HomeScreen from './screens/Home';
import { GlobalContext } from './Contexts';
import {useState, useEffect, useMemo, useCallback} from "react";
import Ionicons from '@expo/vector-icons/Ionicons'

// const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

export default function App() {
  const [globals, updateGlobals] = useState({backendURL: "http://c4f0-46-7-17-96.ngrok.io", username: "", token: ""})
  const [hideAuthTabs, setHideAuthTabs] = useState(false);

  const changeGlobals = useCallback((object) => {
    updateGlobals({...globals, ...object})
  }, []);

  const memoGlobals = useMemo(() => ({
    globals,
    changeGlobals
  }), [globals, changeGlobals])

  useEffect(() => {
    if (globals.token !== "") {
      setHideAuthTabs(true);
    }
    else {
      setHideAuthTabs(false);
    }
  }, [globals.token])

  return (
    <GlobalContext.Provider value={memoGlobals}>
      <NativeBaseProvider>
        <NavigationContainer>
          {/*<Stack.Navigator initialRouteName="Login" screenOptions={{headerShown: false, gestureEnabled: false}}>*/}
          {/*  <Stack.Screen name="Login" component={LoginScreen} />*/}
          {/*  <Stack.Screen name="Register" component={RegisterScreen} />*/}
          {/*  <Stack.Screen name="Home" component={HomeScreen} />*/}
          {/*</Stack.Navigator>*/}
          <Tab.Navigator>
            {hideAuthTabs ?
                <Tab.Screen name="Home" component={HomeScreen}
                  options={
                    {tabBarIcon: () => {return <Ionicons name="home" size={25} color={"grey"}/>;}}
                  }
                />
                :
                <>
                  <Tab.Screen name="Login" component={LoginScreen}
                    options={
                      {tabBarIcon: () => {return <Ionicons name="log-in-outline" size={25} color={"grey"}/>;}}
                     }
                  />
                  <Tab.Screen name="Register" component={RegisterScreen}
                    options={
                      {tabBarIcon: () => {return <Ionicons name="duplicate-outline" size={25} color={"grey"}/>;}}
                    }
                  />
                </>
            }

          </Tab.Navigator>
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
