import { StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { NativeBaseProvider, Box } from 'native-base';
import LoginScreen from './screens/Login';
import RegisterScreen from './screens/Register';
import HomeScreen from './screens/Home';
import SettingsScreen from "./screens/Settings";
import {useState, useEffect, useMemo, useCallback} from "react";
import Ionicons from '@expo/vector-icons/Ionicons'
import {updateGlobalsState} from "./reducers/globals-reducer";
import {useAppDispatch, useAppSelector} from "./hooks";

const Tab = createBottomTabNavigator();

export default function Index() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.user);
  const [hideAuthTabs, setHideAuthTabs] = useState(false);

  useEffect(() => {
    dispatch(updateGlobalsState({backendURL: "http://5281-46-7-17-96.ngrok.io"}));
  }, [])

  useEffect(() => {
    if (user.token !== "") {
      setHideAuthTabs(true);
    }
    else {
      setHideAuthTabs(false);
    }
  }, [user.token])

  return (
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
  );
}
