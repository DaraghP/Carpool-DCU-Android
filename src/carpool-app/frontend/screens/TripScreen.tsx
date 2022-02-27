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
    updateTripState, resetTripState, setLocations
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
    Divider,
    IconButton,
    CloseIcon
} from "native-base";
import CreateGoogleAutocompleteInput from "../components/trip/CreateGoogleAutocompleteInput";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import {SwipeablePanel} from "rn-swipeable-panel";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
    getDatabase,
    onValue,
    off,
    ref,
    update,
    remove,
    get
} from "firebase/database";

// @ts-ignore
import getDirections from "react-native-google-maps-directions";
import TripAlertModal from "../components/trip/TripAlertModal";
import CampusDirectionSelector from "../components/trip/CampusDirectionSelector";
import LocationInputGroup from "../components/trip/LocationInputGroup";
import DepartureTimePicker from "../components/trip/DepartureTimePicker";
import {shallowEqual} from "react-redux";
import Map from "../components/trip/Map";
import TripRequestsModal from "../components/trip/TripRequestsModal";
import TripPicker from "../components/trip/TripPicker";
import DriverCurrentTrip from "../components/trip/DriverCurrentTrip";
import PassengerCancelTripButton from "../components/trip/PassengerCancelTripButton";
import PassengerCancelRequestButton from "../components/trip/PassengerCancelRequestButton";
import NumberOfSeatsSelector from "../components/trip/NumberOfSeatsSelector";
import TripScreenAlertModals from "../components/trip/TripScreenAlertModals";


function MapScreen() {
    const dispatch = useAppDispatch();
    const trips = useAppSelector(state => state.trips, shallowEqual);
    const user = useAppSelector(state => state.user);
    const backendURL = useAppSelector(state => state.globals.backendURL);

    const [filteredTrips, setFilteredTrips] = useState(new Set());
    const [passengerGotInitialMapData, setPassengerGotInitialMapData] = useState(false);
    const [resetedAfterTripComplete, setResetedAfterTripComplete] = useState(false);
    const [firebaseTripsVal, setFirebaseTripsVal] = useState({tripID: null, driverID: null, data: {trip: {status: "waiting", passengers: {}}, tripRequests: {}}});;
    const [tripsFound, setTripsFound] = useState(null);
    const [isPanelActive, setIsPanelActive] = useState(false);
    const [isPassengerInTrip, setIsPassengerInTrip] = useState<boolean>(false);
    const [previousTripID, setPreviousTripID] = useState(null);
    const [showTripAvailableModal, setShowTripAvailableModal] = useState(false);
    const [isTripToDCU, setIsTripToDCU] = useState<boolean | undefined>(undefined);
    const [campusSelected, setCampusSelected] = useState("");

    // firebase db
    const db = getDatabase();

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
                        let isFirebaseTripCreated = createFirebaseTrip(user.status, trip_data.available_seats, res.tripID, res.driverID);
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

    const convertTripDataFromJSON = (tripData) => {
        if (tripData !== undefined) {

            let newWaypoints = {};

            if (Object.keys(tripData["waypoints"]).length > 0) {

                Object.keys(tripData["waypoints"]).map((key) => {
                    newWaypoints[key] = createLocationObj(key,
                        "waypoint",
                        `Waypoint ${key.charAt(key.length - 1)}`,
                        {lat: tripData["waypoints"][key].lat, lng: tripData["waypoints"][key].lng},
                        tripData["waypoints"][key].name,
                    true
                    )
                });
            }

            dispatch(updateTripState({
                ...tripData,
                locations: {
                    startingLocation: createLocationObj(
                        "startingLocation",
                        "start",
                        "Starting Point",
                        {lat: tripData["start"].lat, lng: tripData["start"].lng},
                        tripData["start"].name, true
                    ),
                    destLocation: createLocationObj(
                        "destLocation",
                        "destination",
                        "Destination Point",
                        {lat: tripData["destination"].lat, lng: tripData["destination"].lng},
                        tripData["destination"].name,
                        true
                    ),
                    ...newWaypoints,
                },
                availableSeats: tripData["available_seats"],
                timeOfDeparture: tripData["time_of_departure"],
                numberOfWaypoints: Object.keys(tripData["waypoints"]).length
            }))
        }
    }

    // for passenger and driver
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

                    // console.log("test", res.trip_data["waypoints"])

                    if (res.trip_data !== null) {
                        convertTripDataFromJSON(res.trip_data);
                    }


                    // console.log(trips.id, user.id);
                    // removeTripRequest(trips.id, user.id);
                    // dispatch(updateTripRequestStatus(""));
                    if (trips.role === "passenger" && !passengerGotInitialMapData) {
                        setIsPassengerInTrip(true);
                        setPassengerGotInitialMapData(true);
                        dispatch(updateUserState({status: "passenger_busy"}));
                    }
                }
                else {
                    if (trips.role === "passenger") {
                        setIsPassengerInTrip(false);
                    }
                    // dispatch(updateTripRequestStatus("error"));
                    console.log(res.error);
                }
            })
    }


    useEffect(() => {
        setPreviousTripID(trips.id);
    }, [])

    useEffect(() => {
        let tempFbTripsVal = {...firebaseTripsVal}

        if (previousTripID !== null) {
            off(ref(db, `/tripRequests/${previousTripID}`));
            off(ref(db, `/trips/${previousTripID}/passengers/`));
            off(ref(db, `/trips/${previousTripID}/status`));
            off(ref(db, `/trips/${previousTripID}`));
            // off(query(ref(db, `/trips`), orderByChild("status"), equalTo("departed")))
            setPreviousTripID(trips.id);

            // onValue(ref(db, `/trips`), (snapshot) => {
            //     if (snapshot.val() != null) {
            //         let tripsFiltered = new Set();
            //         Object.keys(snapshot.val()).map((tripKey) => {
            //             let trip = snapshot.val()[tripKey];
            //             console.log(trip)
            //             if (trip.status === "departed" || trip.availableSeats < 1)  {
            //                 tripsFiltered.add(parseInt(tripKey));
            //             }
            //         })
            //
            //         console.log(tripsFiltered)
            //         setFilteredTrips(tripsFiltered);
            //     }
            //     else {
            //         setFilteredTrips(new Set());
            //     }
            // })

            onValue(ref(db, `/tripRequests/${trips.id}`), (snapshot) => {
                tempFbTripsVal = {
                    ...tempFbTripsVal,
                    data: {
                        ...tempFbTripsVal.data,
                        tripRequests: snapshot.val() !== null ? snapshot.val() : {}
                    }
                };

                setFirebaseTripsVal(tempFbTripsVal);
            })

            onValue(ref(db, `/trips/${trips.id}/status`), (snapshot) => {
                tempFbTripsVal = {
                    ...tempFbTripsVal,
                    data: {
                        ...tempFbTripsVal.data,
                        trip: {
                            ...tempFbTripsVal.data.trip,
                            status: snapshot.val()
                        }
                    }
                }

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

                setFirebaseTripsVal(tempFbTripsVal)
//
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

                        dispatch(updateTripRequestStatus(snapshot.val().requestStatus));
                        dispatch(updateTripStatus(snapshot.val().status));

                        if (snapshot.val().status === "trip_complete" && !resetedAfterTripComplete) {
                            console.log("Passenger reset.")
                            dispatch(updateUserState({status: "available", tripRequestStatus: undefined}))
                            dispatch(resetTripState());
                            setIsTripToDCU(undefined);
                            setCampusSelected("");
                            setShowTripAvailableModal(false);
                            setResetedAfterTripComplete(true);
                        }
                    }
                    else {
                        dispatch(updateTripRequestStatus(undefined));
                        dispatch(updateTripStatus(undefined));
                    }
                }
            })
        }
    }, [trips.id, previousTripID])

    useEffect(() => {
        if (trips.role === "passenger" && user.tripRequestStatus === "accepted" && !passengerGotInitialMapData) {
            if (firebaseTripsVal.data.trip.passengers !== null) {
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
        if ((user.status === "passenger_busy" && passengerGotInitialMapData) || user.status==="driver_busy") {
            getOrJoinTrip();
        }
    }, [firebaseTripsVal.data.trip.passengers])

    useEffect(() => {
        if (user.status === "available") {
            dispatch(resetTripState());
            setCampusSelected("");
        }
    }, [isTripToDCU])

  return (
        <View style={styles.container}>
            <View style={{flex: 1, elevation: -1, zIndex: -1}}>
                {user.status === "available" &&
                    <>
                        <CampusDirectionSelector
                            campusSelected={campusSelected}
                            setCampusSelected={(value: string) => {setCampusSelected(value)}}
                            isTripToDCU={isTripToDCU}
                            setIsTripToDCU={(value: boolean | undefined) => {setIsTripToDCU(value)}}
                        />

                        <LocationInputGroup isTripToDCU={isTripToDCU}/>

                          {trips.role === "driver" &&
                              <Button onPress={() => {
                              increaseWaypoints();
                          }}>
                              <Text color="white">Add waypoint</Text>
                              </Button>
                          }

                            <DepartureTimePicker/>

                    </>
                  }

                  <TripRequestsModal firebaseTripRequests={firebaseTripsVal.data.tripRequests} previousTripID={previousTripID} setPreviousTripID={(prevID) => {setPreviousTripID(prevID)}}/>
                  <Map/>

            </View>
            <NumberOfSeatsSelector/>

            {trips.role === "driver" && user.status !== "driver_busy" && trips.locations.startingLocation.info.isEntered && trips.locations.destLocation.info.isEntered &&
                  <Button onPress={() => {createTrip();}}>
                    <Text color="white">Create Trip</Text>
                  </Button>
            }


            <TripPicker
                 setPreviousTripID={(prevID) => {setPreviousTripID(prevID)}}
                 filteredTrips={filteredTrips}
                 setFilteredTrips={(value) => {setFilteredTrips(value)}}
                 showTripAvailableModal={showTripAvailableModal}
                 setShowTripAvailableModal={(value) => {setShowTripAvailableModal(value)}}
            />


            {user.status === "driver_busy" &&
                <DriverCurrentTrip
                    isTripDeparted={firebaseTripsVal.data.trip.status === "departed"}
                    setCampusSelected={(value) => {setCampusSelected(value);}}
                    setIsTripToDCU={(value) => {setIsTripToDCU(value)}}
                />
            }

            <PassengerCancelRequestButton setPreviousTripID={(value) => {setPreviousTripID(value)}}/>

            <PassengerCancelTripButton
                setIsTripToDCU={(value) => {setIsTripToDCU(value)}}
                setCampusSelected={(value) => {setCampusSelected(value)}}
                filteredTrips={filteredTrips}
            />

            <TripScreenAlertModals setResetedAfterTripComplete={(value) => {setResetedAfterTripComplete(value)}}/>
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
});

export default MapScreen;