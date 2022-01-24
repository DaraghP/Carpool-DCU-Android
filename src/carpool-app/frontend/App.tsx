import { StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { NativeBaseProvider, Box } from 'native-base';
import LoginScreen from './screens/Login';
import RegisterScreen from './screens/Register';
import HomeScreen from './screens/Home';
import SettingsScreen from "./screens/Settings";
import { GlobalContext } from './Contexts';
import {useState, useEffect, useMemo, useCallback} from "react";
import Ionicons from '@expo/vector-icons/Ionicons'


// const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

export default function App() {
  const [globals, updateGlobals] = useState({backendURL: "http://9361-2001-bb6-6792-1a00-90b2-f7b2-8243-61ce.ngrok.io", username: "", token: ""})
  const [hideAuthTabs, setHideAuthTabs] = useState(false);

  const changeGlobals = useCallback((object) => {
    updateGlobals({...globals, ...object})
  }, []);
//
  const memoGlobals = useMemo(() => ({
    globals,
    changeGlobals
  }), [globals, changeGlobals])

  useEffect(() => {//
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

          <Tab.Navigator>
            {hideAuthTabs ?
                <>
                  <Tab.Screen name="Home" component={HomeScreen}
                    options={
                      {tabBarIcon: () => {return <Ionicons name="home" size={25} color={"grey"}/>;}}
                    }
                  />

                  <Tab.Screen name="Settings" component={SettingsScreen}
                    options={
                      {headerShown: false, tabBarIcon: () => {return <Ionicons name="settings-outline" size={25} color={"grey"}/>;}}
                    }
                  />
                </>
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
