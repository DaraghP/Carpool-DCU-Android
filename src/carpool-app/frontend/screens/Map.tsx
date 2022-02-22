import {StyleSheet, View, ScrollView, SafeAreaView, TouchableOpacity, Alert as SystemAlert} from "react-native";
import {useEffect, useRef, useState} from "react";
import "react-native-get-random-values";
import {v4} from "uuid";
import {GOOGLE_API_KEY} from "@env";
import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import {updateStatus, updateUserState, updateTripRequestStatus, updateTripStatus} from "../reducers/user-reducer";
import {
    setNumberOfWaypoints,
    setDistance,
    setDuration,
    setAvailableSeats,
    setTimeOfDeparture,
    updateTripState
} from "../reducers/trips-reducer";
import {
    storeTripRequest,
    setupTripRequestListener,
    useAppDispatch,
    useAppSelector,
    createFirebaseTrip,
    removeFirebaseTrip, acceptTripRequest, declineTripRequest, createLocationObj,
} from "../hooks";
import {
    Button,
    Text,
    Select,
    Heading,
    VStack,
    Flex,
    Icon,
    Modal,
    Alert,
    HStack,
    IconButton,
    CloseIcon
} from "native-base";
import CreateGoogleAutocompleteInput from "../components/CreateGoogleAutocompleteInput";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import {SwipeablePanel} from "rn-swipeable-panel";
import Ionicons from "@expo/vector-icons/Ionicons";
import {getDatabase, onValue, off, ref, update} from "firebase/database";

// @ts-ignore
import getDirections from "react-native-google-maps-directions";

// TODO: Refactor
function MapScreen() {
    const dispatch = useAppDispatch();
    const trips = useAppSelector(state => state.trips);
    const user = useAppSelector(state => state.user);
    const backendURL = useAppSelector(state => state.globals.backendURL);
    const mapRef = useRef(null);

    const [passengerGotInitialMapData, setPassengerGotInitialMapData] = useState(false);
    const [isRouteTapped, setIsRouteTapped] = useState(false);
    const [firebaseTripsVal, setFirebaseTripsVal] = useState({tripID: null, driverID: null, data: {trip: {status: "waiting", passengers: {}}, tripRequests: {}}});
    const [isTimePickerVisible, setTimePickerVisibility] = useState(false);
    const [showPassengerRequestsModal, setShowPassengerRequestsModal] = useState(false);
    const [tripsFound, setTripsFound] = useState(null);
    const [isPanelActive, setIsPanelActive] = useState(false);
    const [isPassengerInTrip, setIsPassengerInTrip] = useState<boolean>(false);
    const [previousTripID, setPreviousTripID] = useState();
//
//
    // firebase db
    const db = getDatabase();

    const openPanel = () => {
        setIsPanelActive(true);
    };

    const closePanel = () => {
        setIsPanelActive(false);
    };

    // for driver only
    const increaseWaypoints = () => {
        let activeWaypoints = Object.keys(trips.locations).filter((key) => trips.locations[key].marker.description && trips.locations[key].type === "waypoint" && trips.locations[key].info.isEntered)
                                .map((key) => trips.locations[key].marker.description);

        if (trips.numberOfWaypoints < 4) {
            if ((trips.numberOfWaypoints - activeWaypoints.length) === 0) {
                dispatch(setNumberOfWaypoints(trips.numberOfWaypoints + 1));

            } else {
                console.log("error: fill waypoint field before adding another");
            }
        } else {
            console.log("error: too many waypoints");
        }
    }

    // for driver only
    const createTrip = () => {
        let waypoints = {};

        Object.keys(trips.locations).sort().map((locationKey) => {
            if (trips.locations[locationKey].type === "waypoint" && trips.locations[locationKey].info.isEntered) {
                waypoints[locationKey] = {name: trips.locations[locationKey].marker.description, ...trips.locations[locationKey].info.coords}
            }
        })

        let trip_data = {
            start: {
                name: trips.locations.startingLocation.marker.description,
                lng: trips.locations.startingLocation.info.coords.lng,
                lat: trips.locations.startingLocation.info.coords.lat
            },
            destination: {
                name: trips.locations.destLocation.marker.description,
                lng: trips.locations.destLocation.info.coords.lng,
                lat: trips.locations.destLocation.info.coords.lat
            }, 
            waypoints: waypoints,
            passengers: {},
            available_seats: trips.availableSeats,
            duration: trips.duration,
            distance: trips.distance,
            time_of_departure: trips.timeOfDeparture !== "" ? new Date(trips.timeOfDeparture) : new Date(),
        };

        if (trips.timeOfDeparture === "") {
            dispatch(setTimeOfDeparture(new Date().toString()));
        }

        // console.log(user.status)
        if (user.status === "available") {
            fetch(`${backendURL}/create_trip`, {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${user.token}`
                },
                body: JSON.stringify(trip_data)
            }).then(response => response.json())
                .then(res => {
                    if (!("errorType" in res)) {
                        // console.log("TRIP CREATED");
                        let isFirebaseTripCreated = createFirebaseTrip(user.status, res.tripID, res.driverID);
                        if (isFirebaseTripCreated) {
                            dispatch(updateStatus("driver_busy"));
                        }
                        setPreviousTripID(trips.id)
                        dispatch(updateTripState({id: res.tripID}));
                        setFirebaseTripsVal({tripID: res.tripID, driverID: res.driverID, data: {trip: {}, tripRequests: {}}});
                    } else {
                        console.log(res.errorType, res.errorMessage);
                    }
                })
        }
    }

    // for driver only
    const endTrip = () => {
        fetch(`${backendURL}/end_trip`, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Token ${user.token}`
            },
            body: JSON.stringify({tripID: trips.id})
        }).then(response => response.json())
        .then(res => { //
            if (!("errorType" in res)) {
                console.log("Driver ended trip");
                removeFirebaseTrip(trips.id, res.uids); //
            }
            else {
                console.log(res.errorType, res.errorMessage);
            }
        })
    }

    // for passenger only
    const searchTrips = () => {
        let trip_data = {
            start: {
                name: trips.locations.startingLocation.marker.description,
                lng: trips.locations.startingLocation.info.coords.lng,
                lat: trips.locations.startingLocation.info.coords.lat
            },
            destination: {
                name: trips.locations.destLocation.marker.description,
                lng: trips.locations.destLocation.info.coords.lng,
                lat: trips.locations.destLocation.info.coords.lat
            },
            duration: trips.duration,
            distance: trips.distance,
            time_of_departure: trips.timeOfDeparture !== "" ? new Date(trips.timeOfDeparture) : new Date(),
        };

        if (trips.timeOfDeparture === "") {
            dispatch(setTimeOfDeparture(new Date().toString()))
        }

        fetch(`${backendURL}/get_trips`, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Token ${user.token}`
            },
            body: JSON.stringify(trip_data)
        }).then(response => response.json())
        .then(res => { //
            if (!("errorType" in res)) {
                console.log("Searching for Trips...");
                setTripsFound(res);
            }
            else {
                console.log(res.errorType, res.errorMessage);
            }
        })
    }

    // for passenger only
    const getOrJoinTrip = () => {
        fetch(`${backendURL}/join_trip`, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Token ${user.token}`
            },
            body: JSON.stringify({tripID: trips.id})
        }).then(response => response.json())
            .then((res) => {
                if (!("error" in res)) {
                    // console.log(res.trip_data);
                    //

                    Object.keys(res.trip_data["waypoints"]).map((key) => {
                        res.trip_data["waypoints"][key] = createLocationObj(key, "waypoint", `Waypoint ${key.charAt(key.length - 1)}`, {lat: res.trip_data["waypoints"][key].lat, lng: res.trip_data["waypoints"][key].lng}, res.trip_data["waypoints"][key].name, true);
                    });


                    dispatch(updateTripState({
                        ...res.trip_data,
                        locations: {
                            ...trips.locations,
                            startingLocation: createLocationObj("startingLocation", "start", "Starting Point", {lat: res.trip_data["start"].lat, lng: res.trip_data["start"].lng}, res.trip_data["start"].name, true),
                            destLocation: createLocationObj("destLocation", "destination", "Destination Point", {lat: res.trip_data["destination"].lat, lng: res.trip_data["destination"].lng}, res.trip_data["destination"].name, true),
                            ...res.trip_data["waypoints"],
                        },
                        availableSeats: res.trip_data["available_seats"],
                        timeOfDeparture: res.trip_data["time_of_departure"],
                        numberOfWaypoints: Object.keys(res.trip_data["waypoints"]).length
                    }))
                    // console.log(trips.id, user.id);
                    // removeTripRequest(trips.id, user.id);
                    // dispatch(updateTripRequestStatus(""));
                    if (!passengerGotInitialMapData) {
                        setIsPassengerInTrip(true);
                        setPassengerGotInitialMapData(true);
                        dispatch(updateUserState({status: "passenger_busy"}));
                    }
                }
                else {
                    setIsPassengerInTrip(false);
                    // dispatch(updateTripRequestStatus("error"));
                    console.log(res.error);
                }
            })
    }

    // for driver only
    const acceptRequest = (passengerID) => {
        fetch(`${backendURL}/add_passenger_to_trip`, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Token ${user.token}`
            },
            body: JSON.stringify({
                tripID: trips.id,
                passengerData: {
                    id: passengerID,
                    name: firebaseTripsVal.data.tripRequests[passengerID].name,
                    passengerLocation: {
                        name: firebaseTripsVal.data.tripRequests[passengerID].startLocation.name,
                        lat: firebaseTripsVal.data.tripRequests[passengerID].startLocation.coords.lat,
                        lng: firebaseTripsVal.data.tripRequests[passengerID].startLocation.coords.lng, //
                    }
                }
            })
        }).then(response => response.json())
        .then((res) => {
            if (!("error" in res)) {
                Object.keys(res.trip_data["waypoints"]).map((key) => {
                    res.trip_data["waypoints"][key] = createLocationObj(key, "waypoint", `Waypoint ${key.charAt(key.length - 1)}`, {lat: res.trip_data["waypoints"][key].lat, lng: res.trip_data["waypoints"][key].lng}, res.trip_data["waypoints"][key].name, true);
                });

                dispatch(updateTripState({
                    ...res.trip_data,
                    locations: {
                        ...trips.locations,
                        ...res.trip_data["waypoints"],//
                    },
                    availableSeats: res.trip_data["available_seats"],
                    numberOfWaypoints: Object.keys(res.trip_data["waypoints"]).length
                }))
                acceptTripRequest(trips.id, firebaseTripsVal.data.tripRequests[passengerID]);
            }
            else {
                console.log(res.error);
            }
        })

    }

    // for driver only
    const declineRequest = (passengerID) => {
        declineTripRequest(trips.id, passengerID);
    }

    // for driver only
    const cancelTrip = () => {
        // console.log("Trip Cancelled.");

        // alert "are you sure" then delete from db
        removeFirebaseTrip(user.status, trips.id);
        fetch(`${backendURL}/remove_trip`, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Token ${user.token}`
            },
            body: JSON.stringify({})
        }).then(response => response.status)
        .then(status => {
            if (status === 200) {
                dispatch(updateTripState({id: null}));
                // console.log("trip deleted")
            }
            dispatch(updateStatus("available"));
        })
    }

    const onMapReadyHandler = () => {
        if (mapRef.current) {
            setTimeout(() => {
                let waypointMarkers = Object.keys(trips.locations).filter((key) => trips.locations[key].marker.description && trips.locations[key].type === "waypoint" && trips.locations[key].info.isEntered)
                            .map((key) => trips.locations[key].marker.description);

                let markers = Object.keys(trips.locations).map((key) => trips.locations[key]).map((obj) => obj.type === "waypoint" ? obj.key : obj.marker.key);
                if (trips.locations.startingLocation.info.isEntered || trips.locations.destLocation.info.isEntered) {
                    mapRef.current.fitToSuppliedMarkers(markers, {animated: true});
                }
            }, 100)
        }
    }

    useEffect(() => {
        setPreviousTripID(trips.id);
    }, [])

    useEffect(() => {
        let tempFbTripsVal = {...firebaseTripsVal}

        if (previousTripID !== null) {
            off(ref(db, `/tripRequests/${previousTripID}`));
            off(ref(db, `/trips/${previousTripID}/passengers/`));
            off(ref(db, `/trips/${previousTripID}`));
            setPreviousTripID(trips.id);
            onValue(ref(db, `/tripRequests/${trips.id}`), (snapshot) => {
                tempFbTripsVal = {
                    ...tempFbTripsVal,
                    data: {...tempFbTripsVal.data, tripRequests: snapshot.val()}
                };

                setFirebaseTripsVal(tempFbTripsVal);

            })

            onValue(ref(db, `/trips/${trips.id}/passengers/`), (snapshot) => {
                tempFbTripsVal = {
                    ...tempFbTripsVal,
                    data: {
                        ...tempFbTripsVal.data,
                        trip: {
                            ...tempFbTripsVal.data.trip,
                            passengers: snapshot.val()
                        }
                    }
                }
                // console.log(snapshot.val());

                setFirebaseTripsVal(tempFbTripsVal)

                if (trips.role === "passenger" && typeof snapshot.val() === "object" && snapshot.val() !== null) {
                    if (user.id in snapshot.val()) {
                        setIsPassengerInTrip(true);
                    }
                    else {
                        setIsPassengerInTrip(false);
                    }
                }
            })


            onValue(ref(db, `/users/${user.id}/tripRequested`), (snapshot) => {
                if (!passengerGotInitialMapData) {
                    if (snapshot.val() !== null) {
                        if (trips.id === undefined) {
                            dispatch(updateTripState({id: snapshot.val().tripID}));
                        }
                        //
//
                        dispatch(updateTripRequestStatus(snapshot.val().requestStatus));
                        dispatch(updateTripStatus(snapshot.val().status));
                    }
                    else {
                        dispatch(updateTripRequestStatus(undefined));
                        dispatch(updateTripStatus(undefined));
                    }
                }
            })
        } //
    }, [trips.id, previousTripID])

    useEffect(() => {
        if (trips.role === "passenger" && user.tripRequestStatus === "accepted" && !passengerGotInitialMapData) {
            console.log(firebaseTripsVal.data.trip, trips.id)//
            if (firebaseTripsVal.data.trip.passengers !== null) {//
                if (user.id in firebaseTripsVal.data.trip.passengers) {
                    console.log("passenger in trip!");
                    getOrJoinTrip();
                }
            }
        }
        else {
            // passenger has been denied their request
        }//
    }, [user.tripRequestStatus])//

    useEffect(() => {
        if (passengerGotInitialMapData) {
            getOrJoinTrip();
        }
    }, [firebaseTripsVal.data.trip.passengers])



  return (
      <View key={v4()} style={styles.container}>
          <View style={{flex: 1, elevation: -1, zIndex: -1}}>
                  {user.status === "available" &&
                      <>
                          <CreateGoogleAutocompleteInput
                              key={v4()}
                              locationObjName={"startingLocation"}
                              placeholder="Enter your starting point..."
                              style={{rounded: 5}}
                          />

                          <CreateGoogleAutocompleteInput
                              key={v4()}
                              locationObjName={"destLocation"}
                              placeholder="Enter your destination..."
                          />

                          {Object.keys(trips.locations).sort().map((key) => {
                              if (trips.locations[key].type === "waypoint") {
                                  if (parseInt(key.charAt(key.length - 1)) <= trips.numberOfWaypoints) {
                                      return (
                                          <CreateGoogleAutocompleteInput
                                              key={v4()}
                                              locationObjName={key}
                                          />
                                      );
                                  }
                              }
                          })}

                          {trips.role === "driver" &&
                              <Button onPress={() => {
                                  increaseWaypoints();
                              }}>
                                  <Text color="white">Add waypoint</Text>
                              </Button>
                          }

                          <Button onPress={() => {
                              setTimePickerVisibility(true);
                          }}>
                              Select time of departure
                          </Button>

                          <DateTimePickerModal
                              mode="time"
                              isVisible={isTimePickerVisible}
                              onConfirm={(time) => {
                                  console.log("Time selected:", time);
                                  dispatch(setTimeOfDeparture(time.toString()));
                                  setTimePickerVisibility(false);
                              }}
                              onCancel={() => {
                                  setTimePickerVisibility(false);
                              }}/>
                      </>
                  }
                  {/*  */}
                  {firebaseTripsVal.data.tripRequests ?
                      user.status === "driver_busy" && Object.keys(firebaseTripsVal.data.tripRequests).length > 0 &&
                              <TouchableOpacity onPress={() => {
                                  setShowPassengerRequestsModal(true)
                              }}>
                                  <Alert variant="solid" status="info" colorScheme="info">
                                      <VStack>
                                          <HStack space={3} alignItems="center">
                                              <Alert.Icon mt="1" size={6}/>
                                              <Text color="white">
                                                  {Object.keys(firebaseTripsVal.data?.tripRequests).length}{" "}
                                                  New
                                                  passenger {Object.keys(firebaseTripsVal.data.tripRequests).length > 1 ? "requests" : "request"}
                                              </Text>
                                              {/*<IconButton variant="unstyled" icon={<CloseIcon size="3"/>} onPress={() => {console.log("Alert closed");}}/>*/}
                                          </HStack>
                                      </VStack>
                                  </Alert>
                              </TouchableOpacity>

                     : null
                  }

                  <MapView
                      ref={mapRef}
                      style={{flex: 1}}
                      region={{
                          latitude: trips.locations.startingLocation.info.coords.lat,
                          longitude: trips.locations.startingLocation.info.coords.lng,
                          latitudeDelta: trips.locations.startingLocation.info.isEntered ? 0.01 : 4.50,
                          longitudeDelta: trips.locations.startingLocation.info.isEntered ? 0.01 : 4.50,
                      }}
                      onMapReady={onMapReadyHandler}
                  >
                      {trips.locations.startingLocation.info.isEntered && trips.locations.destLocation.info.isEntered && (
                          <MapViewDirections
                              origin={trips.locations.startingLocation.marker.description}
                              destination={trips.locations.destLocation.marker.description}
                              {...(trips.numberOfWaypoints > 0 ?
                              {
                                  waypoints: Object.keys(trips.locations).filter((key) => trips.locations[key].marker.description && trips.locations[key].type === "waypoint" && trips.locations[key].info.isEntered)
                                                 .map((key) => trips.locations[key].marker.description)
                              } // creates an array of addresses from locations that have type of "waypoint"
                                  : undefined)
                              }
                              //optimizeWaypoints={false}
                              onReady={data => {
                                  if (data.distance.toFixed(1) < 1) {
                                      dispatch(setDistance(`${1000 * (data.distance % 1)} m`));
                                  } else {
                                      dispatch(setDistance(`${data.distance.toFixed(1)} km`));
                                  }
                                  let hoursDecimal = (data.duration / 60);
                                  let hours = Math.floor(hoursDecimal);
                                  let minutes = 60 * (hoursDecimal % 1);

                                  if (data.duration.toFixed(0) < 60) {
                                      dispatch(setDuration(`${minutes.toFixed(0)} min`));
                                  } else if (data.duration.toFixed(0) % 60 === 0) {
                                      dispatch(setDuration(`${hours} hr`));
                                  } else {
                                      dispatch(setDuration(`${hours} hr ${minutes.toFixed(0)} min`));
                                  }
                              }}
                              apikey={GOOGLE_API_KEY}
                              strokeWidth={3}
                              strokeColor={isRouteTapped ? "red" : "black"}
                              tappable={true}
                              onPress={() => {
                                  if (trips.role === "driver") {
                                      setIsRouteTapped(true);
                                      SystemAlert.alert("Get Directions?", "Tapping yes will get directions from the Google Maps App, or through your default browser.",
                                          [
                                            {
                                                text: "Yes",
                                                onPress: () => {
                                                    let waypoints: { latitude: any; longitude: any; }[] = []
                                                    Object.keys(trips.locations).sort().map((locationKey) => {
                                                        if (trips.locations[locationKey].type === "waypoint" && trips.locations[locationKey].info.isEntered === true) {
                                                            waypoints.push({latitude: trips.locations[locationKey].info.coords.lat, longitude: trips.locations[locationKey].info.coords.lng})
                                                        }
                                                    })


                                                    setIsRouteTapped(false);
                                                    const tripData = {
                                                        source: {
                                                          latitude: trips.locations.startingLocation.info.coords.lat,
                                                          longitude: trips.locations.startingLocation.info.coords.lng
                                                        },
                                                        destination: {
                                                          latitude: trips.locations.destLocation.info.coords.lat,
                                                          longitude: trips.locations.destLocation.info.coords.lng
                                                        },
                                                        params: [
                                                            {
                                                                key: "travelmode",
                                                                value: "driving"
                                                            }
                                                        ],
                                                        waypoints: waypoints
                                                    }

                                                    getDirections(tripData);
                                                }
                                            },
                                            {
                                                text: "No",
                                                onPress: () => {
                                                    setIsRouteTapped(false);
                                                }
                                            }
                                          ]
                                      )}
                                  }
                              }
                          />

                      )}

                      {trips.locations.startingLocation.info.isEntered && (
                          <Marker {...trips.locations.startingLocation.marker}/>
                      )}

                      {trips.locations.destLocation.info.isEntered && (
                          <Marker {...trips.locations.destLocation.marker}/>
                      )}

                      {trips.locations.startingLocation.info.isEntered && trips.locations.destLocation.info.isEntered && (
                          Object.keys(trips.locations).sort().map((key) => {
                              return (trips.locations[key].type === "waypoint" && trips.locations[key].info.isEntered) && <Marker key={v4()} {...trips.locations[key].marker}/>;
                          }))
                      }
                  </MapView>
              </View>

                  
          {trips.role === "driver" && user.status !== "driver_busy" &&
              <Select key={v4()} dropdownIcon={<Icon as={Ionicons} name="chevron-down" size={5} color={"gray.400"}/>} placeholder="Choose your number of available seats" onValueChange={value => dispatch(setAvailableSeats(parseInt(value)))}>
                  {[...Array(5).keys()].map((number) => {
                      return (<Select.Item key={v4()} label={`${number} seats`} value={`${number}`}/>);
                  })
                  }
              </Select>
          }

          {trips.role === "driver" && user.status !== "driver_busy" && trips.locations.startingLocation.info.isEntered && trips.locations.destLocation.info.isEntered &&
              <Button onPress={() => {createTrip();}}>
                <Text color="white">Create Trip</Text>
              </Button>
          }

          {/* <Text>Trip Information:</Text>
              <Text>Distance: {distance}</Text>
              <Text>Duration: {duration}</Text>  */}

          {trips.role === "passenger" &&
              <>
                  {user.tripRequestStatus === undefined && trips.locations.startingLocation.info.isEntered && trips.locations.destLocation.info.isEntered &&
                      <Button onPress={() => {
                          openPanel();
                          searchTrips();
                      }}>
                          Show Trips
                      </Button>
                  }
                  <SwipeablePanel
                      key={v4()}
                      scrollViewProps={{style: {padding: 10}}}
                      fullWidth={true}
                      openLarge={true}
                      closeOnTouchOutside={true}
                      isActive={isPanelActive}
                      showCloseButton={true}
                      onPressCloseButton={() => {
                        closePanel();
                      }}
                      onClose={() => {
                        setIsPanelActive(false);
                      }}
                  >
                      <Heading mb={2}>Nearby Drivers</Heading>

                      {tripsFound !== null &&
                          Object.keys(tripsFound).map((tripKey) => {
                              return (
                                  <TouchableOpacity key={v4()} style={styles.tripButton}>
                                      <Flex direction="row" wrap="wrap">
                                          <VStack maxWidth="75%">
                                              <Text style={{fontWeight: "bold"}}>{tripsFound[tripKey].driver_name}</Text>
                                              <Text>{tripsFound[tripKey].distance} {tripsFound[tripKey].duration}</Text>
                                              <Text>{tripsFound[tripKey].time_of_departure}</Text>
                                          </VStack>
                                          <Button style={{flexDirection: "row", marginLeft: "auto"}}
                                              onPress={() => {
                                                  setPreviousTripID(trips.id);
                                                  dispatch(updateTripState({id: tripsFound[tripKey].pk}));
                                                  dispatch(updateTripRequestStatus("waiting"));
                                                  dispatch(updateStatus("passenger_busy"));

                                                  let passengerData = {
                                                      passengerID: user.id,
                                                      name: `${user.firstName} ${user.lastName.charAt(0)}.`,
                                                      startLocation: {
                                                          name: trips.locations.startingLocation.marker.description,
                                                          coords: trips.locations.startingLocation.info.coords
                                                      }
                                                  }
                                                  storeTripRequest(tripsFound[tripKey].pk, passengerData);
                                              }
                                          }>
                                            Request
                                          </Button>
                                      </Flex>
                                  </TouchableOpacity>
                              );
                          }
                      )}

                  </SwipeablePanel>
              </>
          }

         {user.status === "driver_busy" &&
             <>
                 <View style={{padding: 10}}>
                      <Heading mb={2}>Current Trip</Heading>
                      <Heading size="md">From:</Heading>
                      <Text>{trips.locations.startingLocation.marker.description}</Text>
                      <Text>To: {trips.locations.destLocation.marker.description}</Text>
                      <Text>Departure Time:</Text>
                      <Text style={{fontWeight: "bold"}}>{new Date(trips.timeOfDeparture).toLocaleTimeString().slice(0, 5)} {new Date(trips.timeOfDeparture).toLocaleDateString()}</Text>

                      <Text>ETA: </Text>{/* timeofDeparture + duration*/}
                      <Text>Passengers: {Object.keys(trips.passengers).map((passengerKey) => {
                          return(<Text fontWeight="bold" key={v4()}>{trips.passengers[passengerKey].passengerName}  </Text>)
                        })
                      }
                      </Text>

                      <Text>{trips.availableSeats} Empty seats</Text>
                      <Button onPress={() => {setShowPassengerRequestsModal(true)}}>Passenger Requests +1</Button>
                      <Button>View Route</Button>
                      <Button onPress={() => {endTrip()}}>Trip Complete</Button>
                      <Button onPress={() => {cancelTrip()}}>Cancel Trip</Button>
                 </View>
                 <Modal isOpen={showPassengerRequestsModal} onClose={() => {setShowPassengerRequestsModal(false)}}>
                     <Modal.Content size="sm">
                         <Modal.CloseButton/>
                         <Modal.Header>Requests</Modal.Header>
                         <Modal.Body>
                            <VStack>
                                 {firebaseTripsVal.data.tripRequests &&
                                     Object.keys(firebaseTripsVal.data.tripRequests).map((key, index) => {
                                         return (
                                             <TouchableOpacity key={v4()}>
                                                <Flex key={v4()} direction="row" wrap="wrap">
                                                    <Text ml="5">{firebaseTripsVal.data.tripRequests[key].name}</Text>
                                                    <Button onPress={() => {acceptRequest(key)}}>Accept</Button>
                                                    <Button onPress={() => {declineRequest(key)}}>Decline</Button>
                                                </Flex>

                                            </TouchableOpacity>
                                            // <Button key={v4()} onPress={() => acceptRequest(key)}>{firebaseTripsVal.data.tripRequests[key].name}</Button>
                                        )
                                     })
                                 }
                            </VStack>

                         </Modal.Body>
                     </Modal.Content>
                 </Modal>
             </>
          }


          {trips.role === "passenger" && user.tripRequestStatus === "waiting" &&
              <>
                <Button>Request Sent to user.tripRequest.driverName</Button>
                <Text>Awaiting Response from Driver </Text>
              </>
          }

          {trips.role === "passenger" && user.tripRequestStatus === "accepted" &&
              <>
                <Button>Request Accepted!</Button>
                <Text>Message drivername @ phonenumber </Text>
              </>
          }

          {trips.role === "passenger" && user.tripRequestStatus === "declined" &&
              <>
                <Button>Request Declined!</Button>
                <Button onPress={() => {
                    update(ref(db, `/users/`), {[`/${user.id}`]: {tripRequested: null}});
                    dispatch(updateStatus("available"))
                }}>
                    OK
                </Button>

                <Text>Message drivername @ phonenumber</Text>
              </>
          }


          {trips.role === "passenger" && user.tripStatus == "trip_complete" &&
              <>
                <Button>Trip Ended</Button>
                <Button 
                    onPress={() => {
                        dispatch(updateUserState({status: "available", tripStatus: ""}));
                        update(ref(db, `/users/`), {[`/${user.id}`]: {tripRequested: null}});

                    }}
                >
                    OK
                </Button>
                <Text>Trip has been ended by driver.</Text>
                <Text>Request a new trip on passenger screen</Text>
              </>
          }

          {trips.role === "driver" && user.tripStatus == "trip_complete" &&
              <>
                <Button>Trip Ended</Button>
                <Button
                    onPress={() => {
                        dispatch(updateUserState({status: "available", tripStatus: ""}));
                        update(ref(db, `/users/`), {[`/${user.id}`]: {tripRequested: null}});
                    }}
                >
                    OK
                </Button>
                <Text>Trip has been ended.</Text>
                <Text>Create a new trip on driver screen</Text>
              </>
          }
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexGrow: 1,
    backgroundColor: '#fff',
  },
  googlePlacesSearch: {
      flex: 0,
      fontSize: 20
  },
  tripButton: {
      borderBottomColor: "#e4e4eb",
      borderTopColor: "#e4e4eb",
      borderBottomWidth: 0.5,
      borderTopWidth: 0.5,
      flex: 1,
      flexGrow: 1,
      padding: 15,
  }
});

export default MapScreen;
