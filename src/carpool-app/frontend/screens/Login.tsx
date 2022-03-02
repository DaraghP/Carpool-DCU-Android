import {StyleSheet, View, Alert} from "react-native";
import {Box, VStack, Button, Center, FormControl, Input, Heading, Stack} from "native-base";
import {useEffect, useRef, useState} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {updateUserState, updateTripRequestStatus} from "../reducers/user-reducer";
import {useAppDispatch, useAppSelector, createLocationObj} from "../hooks";
import {setLocations, updateTripState} from "../reducers/trips-reducer";
import {getDatabase, get, ref, child, query, orderByChild, equalTo} from "firebase/database";
import { createDispatchHook } from "react-redux";

function LoginScreen({ navigation }) {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.user);
  const trips = useAppSelector(state=> state.trips);
  const backendURL = useAppSelector(state => state.globals.backendURL);
  const usernameInput = useRef("");
  const passwordInput = useRef("");
  const [usernameText, setUsernameText] = useState("");
  const [passwordText, setPasswordText] = useState("");
  const [errorFound, setErrorFound] = useState(false);
//   const [isTripToDCU, setIsTripToDCU] = useState<boolean | undefined>(undefined);

  const db = getDatabase();

  const login = () => {
    if (usernameText === "" || passwordText === "") {
        setErrorFound(true);
        return;
    }

    fetch(`${backendURL}/login`, {
      method: "POST",
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({username: usernameText, password: passwordText})
    }).then(async (response) => await response.json())
    .then(async (res) => {
        if (res.token) {
            usernameInput.current.clear();
            passwordInput.current.clear();

            if (res.status === "passenger_busy") {
                dispatch(updateUserState({tripRequestStatus: "accepted"}));
                dispatch(updateTripState({role: "passenger"}))
            }
            if (res.status === "driver_busy") {
                dispatch(updateTripState({role:"driver"}));
            }

            if (res.status === "available") {
                get(ref(db, `/users/${res.id}`))
                    .then((snapshot) => {

                        dispatch(updateTripRequestStatus(snapshot.val()?.tripRequested.requestStatus));

                        if (snapshot.val()?.tripRequested.requestStatus) {
                            dispatch(updateUserState({status: "passenger_busy"}));
                            get(ref(db, `/trips/${snapshot.val()?.tripRequested.tripID}`))
                                .then((snapshot2) => {
                                        dispatch(updateTripState({driverName: snapshot2.val()?.driverName}))
                                })
                        }
                    })
            }

            // if user.status === "available" navigates to home screen once globals.user.token updates otherwise their trip on either driver/passenger screen
            dispatch(updateUserState({id: res.id, username: usernameText, firstName: res.first_name, lastName: res.last_name, status: res.status, token: res.token, dateCreated: res.date_joined}));

            if ("waypoints" in res.trip_data) {
                Object.keys(res.trip_data["waypoints"]).map((key) => {
                    res.trip_data["waypoints"][key] = createLocationObj(key, "waypoint", res.trip_data["waypoints"][key].passenger === undefined ? "Driver Stop" : res.trip_data["waypoints"][key].passenger, {lat: res.trip_data["waypoints"][key].lat, lng: res.trip_data["waypoints"][key].lng}, res.trip_data["waypoints"][key].name, true);
                });
            }

            dispatch(updateTripState({
                ...res.trip_data,
                ...res.passenger_route,
            }))
            dispatch(updateTripState({
                locations: {
                    ...trips.locations,
                    startingLocation: createLocationObj("startingLocation", "start", "Starting Point", {lat: res.trip_data["start"].lat, lng: res.trip_data["start"].lng}, res.trip_data["start"].name, true),
                    destLocation: createLocationObj("destLocation", "destination", "Destination Point", {lat: res.trip_data["destination"].lat, lng: res.trip_data["destination"].lng}, res.trip_data["destination"].name, true),
                    ...res.trip_data["waypoints"],
                },
                availableSeats: res.trip_data["available_seats"],
                timeOfDeparture: res.trip_data["time_of_departure"],
                numberOfWaypoints: Object.keys(res.trip_data["waypoints"]).length,
            }))
            setErrorFound(false);
        }
        else {
            setErrorFound(true);
        }
    }).catch((e) => {
        console.error(e)
    })
  }

  return (
      <View style={styles.container}>
        <Stack direction="column" width="250">
            <Center>
                <Heading size="md" mb="3">Login</Heading>

                <FormControl isInvalid={errorFound}>
                    <FormControl.Label isRequired>Username</FormControl.Label>
                    <Input key={1} mb="5" placeholder="Username" ref={usernameInput} onChangeText={(text: string) => {setUsernameText(text)}}/>
                </FormControl>

                <FormControl isInvalid={errorFound}>
                    <FormControl.Label isRequired>Password</FormControl.Label>
                    <Input key={2} type="password" placeholder="Password" ref={passwordInput} onChangeText={(text: string) => {setPasswordText(text)}}/>
                    <FormControl.ErrorMessage>Incorrect Username or Password</FormControl.ErrorMessage>
                </FormControl>

                <Button width="100%" mt="5" onPress={() => {login()}}>
                    Login
                </Button>

                <Button width="100%" variant="subtle" colorScheme="tertiary" mt="3" onPress={() => navigation.navigate("Register")}>
                    Don't have an account?
                </Button>

            </Center>
        </Stack>
      </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LoginScreen;