import {StyleSheet, View, ScrollView, SafeAreaView, TouchableOpacity} from "react-native";
import {useEffect, useRef, useState} from "react";
import "react-native-get-random-values";
import {v4} from "uuid";
import {GOOGLE_API_KEY} from "@env";
import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import {updateStatus} from "../reducers/user-reducer";
import {setNumberOfWaypoints, resetTripState, setDistance, setDuration, setAvailableSeats, setTimeOfDeparture} from "../reducers/trips-reducer";
import {storeTripRequest, setupTripRequestListener, useAppDispatch, useAppSelector, createFirebaseTrip} from "../hooks";
import {Button, Text, Select, Heading, VStack, Flex, Icon} from "native-base";
import CreateGoogleAutocompleteInput from "../components/CreateGoogleAutocompleteInput";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import {SwipeablePanel} from "rn-swipeable-panel";
import Ionicons from "@expo/vector-icons/Ionicons";

function MapScreen() {
    const dispatch = useAppDispatch();
    const trips = useAppSelector(state => state.trips);
    const user = useAppSelector(state => state.user);
    const backendURL = useAppSelector(state => state.globals.backendURL);
    const mapRef = useRef(null);

    const [firebaseTripsVal, setFirebaseTripsVal] = useState({tripID: null, driverID: null});
    const [isTimePickerVisible, setTimePickerVisibility] = useState(false);
    const [tripsFound, setTripsFound] = useState(null);
    const [isPanelActive, setIsPanelActive] = useState(false);
    // (user.status === "driver_busy")
    useEffect(() => {
        const {tripID} = firebaseTripsVal;
        setupTripRequestListener(tripID);
    }, [firebaseTripsVal])
    
    const openPanel = () => {
        setIsPanelActive(true);
    };

    const closePanel = () => {
        setIsPanelActive(false);
    };

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

        let trip_data = { //
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
            time_of_departure: new Date(trips.timeOfDeparture),
        };

        console.log(user.status)
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
                        console.log("TRIP CREATED");
                        let isFirebaseTripCreated = createFirebaseTrip(user.status, res.tripID, res.driverID);
                        if (isFirebaseTripCreated) {
                            dispatch(updateStatus("driver_busy"));
                        }
                        console.log(isFirebaseTripCreated);
                        setFirebaseTripsVal({tripID: res.tripID, driverID: res.driverID});
                    } else {
                        console.log(res.errorType, res.errorMessage);
                    }
                })
        }
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
            time_of_departure: new Date(trips.timeOfDeparture),
        };

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

    const cancelTrip = () => {
        console.log("Trip Cancelled.");
        // alert "are you sure" then delete from db
        dispatch(updateStatus("available"));
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
        onMapReadyHandler();
    }, [trips.numberOfWaypoints, trips.distance, trips.duration])


  return (
      <View key={v4()} style={styles.container}><View style={{flex: 1, elevation: -1, zIndex: -1}}>
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
                              strokeColor="black"
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
                  <Button onPress={() => {
                      openPanel();
                      searchTrips();
                  }}>
                      Show Trips
                  </Button>
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
                                                console.log("Trip requested.");
                                                console.log("trip_id:", tripsFound[tripKey].pk);
                                                console.log("passenger_id:", user.id);
                                                storeTripRequest(tripsFound[tripKey].pk, user.id);
                                                dispatch(updateStatus("passenger_busy"));
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
              <View style={{padding: 10}}>
                  <Heading mb={2}>Current Trip</Heading>
                  <Heading size="md">From:</Heading>
                  <Text>{trips.locations.startingLocation.marker.description}</Text>
                  <Text>To: {trips.locations.destLocation.marker.description}</Text>
                  <Text>Departure Time:</Text>
                  <Text style={{fontWeight: "bold"}}>{new Date(trips.timeOfDeparture).toLocaleTimeString().slice(0, 5)} {new Date(trips.timeOfDeparture).toLocaleDateString()}</Text>

                  <Text>ETA: </Text>{/* timeofDeparture + duration*/}
                  <Text>Passengers: Empty Seat x {trips.availableSeats}</Text>
                  <Button>Passenger Requests +1</Button>
                  <Button>View Route</Button>
                  <Button onPress={() => {cancelTrip()}}>Cancel Trip</Button>
                  <Button>Trip Complete</Button>
              </View>
          }

      </View>
  )
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
