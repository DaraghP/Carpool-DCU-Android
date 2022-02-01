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
import {createLocationObj, useAppDispatch, useAppSelector} from "./hooks";
import {setLocations} from "./reducers/user-reducer";

const Tab = createBottomTabNavigator();

export default function Index() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.user);
  const globals = useAppSelector(state => state.globals);
  const [hideAuthTabs, setHideAuthTabs] = useState(false);
  const locations = {
        startingLocation: createLocationObj("startingLocation", "start", "Starting Point", {lat: 53.1424, lng: -7.6921}),
        destLocation: createLocationObj("destLocation", "destination", "Destination Point"),
        waypoint1: createLocationObj("waypoint1", "waypoint", "Waypoint 1"),
        waypoint2: createLocationObj("waypoint2", "waypoint", "Waypoint 2"),
        waypoint3: createLocationObj("waypoint3", "waypoint", "Waypoint 3"),
        waypoint4: createLocationObj("waypoint4", "waypoint", "Waypoint 4"),
  }

  useEffect(() => {

    dispatch(updateGlobalsState({backendURL: "http://3238-46-7-17-96.ngrok.io"}));
    dispatch(setLocations({
        ...locations
    }));
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
