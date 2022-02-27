import {Button, Flex, Heading, HStack, Icon, Text, VStack} from "native-base";
import TripAlertModal from "./TripAlertModal";
import {SwipeablePanel} from "rn-swipeable-panel";
import {StyleSheet, TouchableOpacity} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import {v4} from "uuid";
import {storeTripRequest, useAppDispatch, useAppSelector} from "../../hooks";
import {setTimeOfDeparture, updateTripState} from "../../reducers/trips-reducer";
import {updateStatus, updateTripRequestStatus} from "../../reducers/user-reducer";
import {useEffect, useState} from "react";
import {get, getDatabase, ref} from "firebase/database";

function TripPicker({showTripAvailableModal, setShowTripAvailableModal, filteredTrips, setFilteredTrips, setPreviousTripID, isTripToDCU}) {
    const db = getDatabase();
    const dispatch = useAppDispatch();
    const trips = useAppSelector(state => state.trips);
    const user = useAppSelector(state => state.user);
    const backendURL = useAppSelector(state => state.globals.backendURL);
    const [isPanelActive, setIsPanelActive] = useState(false);
    const [tripsFound, setTripsFound] = useState<object | null>(null);

    const openPanel = () => {
        setIsPanelActive(true);
    };

    const closePanel = () => {
        setIsPanelActive(false);
    };

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
            isPassengerToDCU : isTripToDCU,
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
        .then(res => {
            if (!("errorType" in res)) {
                console.log("Searching for Trips...");
                // removes trips that have already departed
                get(ref(db, `/trips`)).then((snapshot) => {
                    if (snapshot.val() != null) {
                        let tripsFiltered = new Set();
                        Object.keys(snapshot.val()).map((tripKey) => {
                            let trip = snapshot.val()[tripKey];
                            if (trip.status === "departed" || trip.availableSeats < 1)  {
                                tripsFiltered.add(parseInt(tripKey));
                            }
                        })
                        setFilteredTrips(tripsFiltered);
                    }
                    else {
                       setFilteredTrips(new Set());
                    }
                });

                setTripsFound(res);
            }
            else {
                console.log(res.errorType, res.errorMessage);
            }
        })
    }

    return (

        (trips.role === "passenger" && user.status === "available" && trips.locations.startingLocation.info.isEntered && trips.locations.destLocation.info.isEntered ?
              <>
                  {(user.tripRequestStatus === undefined || user.tripRequestStatus === "") &&
                      <Button onPress={() => {
                          openPanel();
                          searchTrips();
                      }}>
                          Show Trips
                      </Button>
                  }

                  {showTripAvailableModal &&
                    <TripAlertModal
                        headerText="Request Alert"
                        bodyText={`Trip is no longer available.\nPress OK to refresh the list.`}
                        btnAction={
                            {
                                action: () => {
                                    setShowTripAvailableModal(false);
                                    searchTrips();
                                },
                                text: "OK"
                            }
                        }
                    />
                  }

                  <SwipeablePanel
                      style={{zIndex: 2, elevation: 2}}
                      scrollViewProps={{style: {padding: 10, zIndex: 2, elevation: 2}}}
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
                      <HStack space={2} alignItems="center" mb={2}>
                          <Heading>Nearby Drivers</Heading>
                          <TouchableOpacity onPress={() => {searchTrips()}}>
                              <Icon as={Ionicons} name={"reload"} size={25} color="grey"/>
                          </TouchableOpacity>
                      </HStack>

                      {tripsFound !== null &&
                          Object.keys(tripsFound).map((tripKey) => {
                              return (
                                  !filteredTrips.has(tripsFound[tripKey].pk) &&
                                  <TouchableOpacity key={v4()} style={styles.tripButton}>
                                      <Flex direction="row" wrap="wrap">
                                          <VStack maxWidth="75%">
                                              <Text style={{fontWeight: "bold"}}>{tripsFound[tripKey].driver_name}</Text>
                                              <Text>{tripsFound[tripKey].distance} {tripsFound[tripKey].duration}</Text>
                                              <Text>{tripsFound[tripKey].time_of_departure}</Text>
                                              {!isTripToDCU ?
                                                <Text style={{...(tripsFound[tripKey].isCampusSame ? {color: "green"} : {color: "orange"})}}>From: {tripsFound[tripKey].start.name}</Text>
                                                :
                                                <Text>From: {tripsFound[tripKey].start.name}</Text>
                                              }

                                              {isTripToDCU ?
                                                <Text style={{...(tripsFound[tripKey].isCampusSame ? {color: "green"} : {color: "orange"})}}>To: {tripsFound[tripKey].destination.name}</Text>
                                                :
                                                <Text>To: {tripsFound[tripKey].destination.name}</Text>
                                              }
                                              <Text>ETA: {tripsFound[tripKey].ETA}</Text>
                                          </VStack>
                                          <Button style={{flexDirection: "row", marginLeft: "auto"}}
                                              onPress={() => {
                                                  let passengerData = {
                                                      passengerID: user.id,
                                                      name: `${user.firstName} ${user.lastName.charAt(0)}.`,
                                                      startLocation: {
                                                          name: trips.locations.startingLocation.marker.description,
                                                          coords: trips.locations.startingLocation.info.coords
                                                      },
                                                      destination: {
                                                          name: trips.locations.destLocation.marker.description,
                                                          coords: trips.locations.destLocation.info.coords
                                                      }
                                                  }
                                                  
                                                  storeTripRequest(tripsFound[tripKey].pk, passengerData).then((isStored) => {
                                                      if (!filteredTrips.has(`${tripsFound[tripKey].pk}`) && isStored) {
                                                          setPreviousTripID(trips.id);
                                                          dispatch(updateTripState({id: tripsFound[tripKey].pk}));

                                                          dispatch(updateTripRequestStatus("waiting"));
                                                          dispatch(updateStatus("passenger_busy"));
                                                      }

                                                      if (!isStored) {
                                                        setTripsFound({});
                                                      }

                                                      setShowTripAvailableModal(!isStored)
                                                  })

                                          }}>
                                            Request
                                          </Button>
                                      </Flex>
                                  </TouchableOpacity>
                              );
                          }
                      )}

                  </SwipeablePanel>
              </>

             : <></>)
    )
}

const styles = StyleSheet.create({
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


export default TripPicker;