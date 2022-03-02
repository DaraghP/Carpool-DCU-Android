import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { NativeBaseProvider, Box} from 'native-base';
import LoginScreen from './screens/Login';
import RegisterScreen from './screens/Register';
import HomeScreen from './screens/Home';
import SettingsScreen from "./screens/Settings";
import {useState, useEffect, useMemo, useCallback} from "react";
import Ionicons from '@expo/vector-icons/Ionicons'
import {updateGlobalsState} from "./reducers/globals-reducer";
import {createLocationObj, useAppDispatch, useAppSelector} from "./hooks";
import {updateRole, setLocations} from "./reducers/trips-reducer";
import PassengerScreen from "./screens/Passenger";
import DriverScreen from "./screens/Driver";
import TripAlertModal from "./components/trip/TripAlertModal";

const Tab = createBottomTabNavigator();

export default function Index() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.user);
  const [hideAuthTabs, setHideAuthTabs] = useState(false);
  const [tabAlert, setTabAlert] = useState(false);
  const [showStatusAvailableFromDriverAlert, setShowStatusAvailableFromDriverAlert] = useState(false);
  const [showStatusAvailableFromPassengerAlert, setShowStatusAvailableFromPassengerAlert] = useState(false);
  const [showStatusPassengerBusyAlert, setShowStatusPassengerBusyAlert] = useState(false);
  const [showStatusDriverBusyAlert, setShowStatusDriverBusyAlert] = useState(false);

  useEffect(() => {
      dispatch(updateGlobalsState({backendURL: "http://b51e-2001-bb6-6792-1a00-d582-28ad-fed5-3d80.ngrok.io"}));
  }, [])

  useEffect(() => {
    if (user.token !== "") {
      setHideAuthTabs(true);
    }
    else {
      setHideAuthTabs(false);
    }
  }, [user.token])

  const navigationRef = createNavigationContainerRef();

  return (
    <NativeBaseProvider>
      <NavigationContainer ref={navigationRef}>

        {showStatusAvailableFromPassengerAlert &&
          <TripAlertModal
            headerText={"Setup Warning"}
            bodyText={"Changes may be lost when switching screen between Passenger and Driver."}
            btnAction={{action: () => {setShowStatusAvailableFromPassengerAlert(false); dispatch(updateRole("driver")); navigationRef.navigate("Driver")}, text: "YES"}}
            otherBtnAction={{action: () => {setShowStatusAvailableFromPassengerAlert(false);}, text: "NO"}}
          />
        }

        {showStatusAvailableFromDriverAlert &&
          <TripAlertModal
            headerText={"Setup Warning"}
            bodyText={"Changes may be lost when switching screen between Driver and Passenger."}
            btnAction={{action: () => {setShowStatusAvailableFromDriverAlert(false); dispatch(updateRole("passenger")); navigationRef.navigate("Passenger");}, text: "YES"}}
            otherBtnAction={{action: () => {setShowStatusAvailableFromDriverAlert(false);}, text: "NO"}}
          />
        }

        {showStatusPassengerBusyAlert &&
          <TripAlertModal
            headerText={"Trip Warning"}
            bodyText={"You have an ongoing trip as a Passenger. Please wait for the driver to complete it or wait an hour for the estimated time of arrival of the trip before accessing the Driver screen."}
            btnAction={{action: () => {setShowStatusDriverBusyAlert(false)}, text: "OK"}}
          />
        }

        {showStatusDriverBusyAlert &&
          <TripAlertModal
            headerText={"Trip Warning"}
            bodyText={"You have an ongoing trip as a Driver. Please complete or cancel it before accessing the Passenger screen."}
            btnAction={{action: () => {setShowStatusDriverBusyAlert(false)}, text: "OK"}}
          />
        }

        <Tab.Navigator>
          {hideAuthTabs ?
              <>
                {user.status === "available" &&
                    <Tab.Screen name="Home" component={HomeScreen}
                        options={
                          {tabBarIcon: () => {return <Ionicons name="home" size={25} color={"grey"}/>;}, headerShown: false}
                        }
                    />
                }

                {(user.status === "available" || user.status === "passenger_busy") &&
                  <Tab.Screen name="Passenger" component={PassengerScreen}
                    options={
                      {tabBarIcon: () => {return <Ionicons name="body" size={25} color="grey"/>;}}
                    }
                    listeners={ ({navigation, route }) => ({
                      tabPress: (e) => {
                        e.preventDefault();
                        dispatch(updateRole("passenger"))
                        let routeName = navigationRef.current?.getCurrentRoute().name;
                        let routeCondition = routeName === "Driver";


                        if (user.status === "available") {
                          if (routeCondition) {
                              setTabAlert(true)

                              // warn that changes may be lost
                              setShowStatusAvailableFromDriverAlert(true);
                          }
                          else {
                            dispatch(updateRole("passenger"));
                            navigation.navigate("Passenger")
                          }
                        }

                        if (user.status === "driver_busy") {
                          setTabAlert(true)
                          navigation.navigate("Driver")

                          // alert you have an ongoing trip as driver
                          setShowStatusDriverBusyAlert(true);
                        }
                        if (user.status === "passenger_busy") {
                          dispatch(updateRole("passenger"));
                          navigation.navigate("Passenger")
                        }
                      }
                    })}
                  />

                }

                {(user.status === "available" || user.status === "driver_busy") &&
                  <Tab.Screen name="Driver" component={DriverScreen}
                    options={
                        {tabBarIcon: () => {return <Ionicons name="car-outline" size={25} color="grey"/>}}
                    }
                    listeners={({navigation, route}) => ({
                      tabPress: (e) => {
                        e.preventDefault();
                        dispatch(updateRole("driver"))
                        let routeName = navigationRef.current?.getCurrentRoute().name;
                        let routeCondition = routeName === "Passenger";

                        if (user.status === "available") {
                          if (routeCondition) {
                              setTabAlert(true)

                              // warn that changes may be lost
                              setShowStatusAvailableFromPassengerAlert(true);
                          }
                          else {
                            dispatch(updateRole("Driver"));
                            navigation.navigate("Driver")
                          }
                        }
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
