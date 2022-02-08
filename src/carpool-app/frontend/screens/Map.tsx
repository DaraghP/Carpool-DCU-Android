import {StyleSheet, View, ScrollView, SafeAreaView} from "react-native";
import {useEffect, useRef, useState} from "react";
import {GOOGLE_API_KEY} from "@env";
import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import {setNumberOfWaypoints} from "../reducers/trips-reducer";
import {useAppDispatch, useAppSelector} from "../hooks";
import {Button, Center, Text, Select, FormControl, Box} from "native-base";
import CreateGoogleAutocompleteInput from "../components/CreateGoogleAutocompleteInput";
import DateTimePickerModal from "react-native-modal-datetime-picker";
// import Collapsible from 'react-native-collapsible';
// import Accordion from "react-native-collapsible/Accordion";
import {Collapse, CollapseHeader, CollapseBody} from "accordion-collapse-react-native"


function MapScreen({ role }) {
    const dispatch = useAppDispatch();
    const trips = useAppSelector(state => state.trips);
    const user = useAppSelector(state => state.user);
    const backendURL = useAppSelector(state => state.globals.backendURL);
    const mapRef = useRef(null);

    const [distance, setDistance] = useState("");
    const [duration, setDuration] = useState("");
    const [timeOfDeparture, setTimeOfDeparture] = useState<Date>(new Date());
    const [carAvailableSeats, setCarAvailableSeats] = useState(0);
    const [isTimePickerVisible, setTimePickerVisibility] = useState(false);
    const [tripsFound, setTripsFound] = useState(null);

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
            available_seats: carAvailableSeats,
            duration: duration,
            distance: distance,
            time_of_departure: timeOfDeparture,
        };
       
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
                console.log(res);
            }
            else {
                console.log(res.errorType, res.errorMessage);
            }
        })
    }

    // for passenger only
    const searchTrips = () => {
        fetch(`${backendURL}/get_trips`, {
            method: "GET",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Token ${user.token}`
            },
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

    useEffect(() => {
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
    }, [trips.numberOfWaypoints, distance, duration])


  return (
      <View style={styles.container}>
        <View style={{flex: 1, elevation: -1, zIndex: -1}}>
            <CreateGoogleAutocompleteInput
                key={1}
                locationObj={trips.locations.startingLocation}
                placeholder="Enter your starting point..."
            />

            <CreateGoogleAutocompleteInput
                key={2}
                locationObj={trips.locations.destLocation}
                placeholder="Enter your destination..."
            />

              {Object.keys(trips.locations).sort().map((key) => {
                if (trips.locations[key].type === "waypoint") {
                    if (parseInt(key.charAt(key.length - 1)) <= trips.numberOfWaypoints) {
                        return (
                            <CreateGoogleAutocompleteInput
                                key={key}
                                locationObj={trips.locations[key]}
                            />
                        );
                    }
                }
            })}

            {role === "driver" &&
              <Button onPress={() => {
                  increaseWaypoints();
              }}>
                  <Text color="white">Add waypoint</Text>
              </Button>
            }

            <Button onPress={() => {setTimePickerVisibility(true)}}>
                Select time of departure
            </Button>

            <DateTimePickerModal
                mode="time"
                isVisible={isTimePickerVisible}
                onConfirm={(time) => {console.log("Time selected:", time); setTimeOfDeparture(time); setTimePickerVisibility(false)}}
                onCancel={() => {setTimePickerVisibility(false)}}
            />

            <MapView
                ref={mapRef}
                style={{flex: 1}}
                region={{
                    latitude: trips.locations.startingLocation.info.coords.lat,
                    longitude: trips.locations.startingLocation.info.coords.lng,
                    latitudeDelta: trips.locations.startingLocation.info.isEntered ? 0.01 : 4.50,
                    longitudeDelta: trips.locations.startingLocation.info.isEntered ? 0.01 : 4.50,
                }}
            >
                {trips.locations.startingLocation.info.isEntered && trips.locations.destLocation.info.isEntered && (

                    <MapViewDirections
                        origin={trips.locations.startingLocation.marker.description}
                        destination={trips.locations.destLocation.marker.description}
                        {...(trips.numberOfWaypoints > 0 ?
                        {waypoints: Object.keys(trips.locations).filter((key) => trips.locations[key].marker.description && trips.locations[key].type === "waypoint" && trips.locations[key].info.isEntered)
                                    .map((key) => trips.locations[key].marker.description)} // creates an array of addresses from locations that have type of "waypoint"
                        : undefined)
                        }
                        onReady={data => {
                            if (data.distance.toFixed(1) < 1) {
                                setDistance(`${1000 * (data.distance % 1)} m`)
                            }
                            else {
                                setDistance(`${data.distance.toFixed(1)} km`);
                            }

                            let hoursDecimal = (data.duration / 60);
                            let hours = Math.floor(hoursDecimal);

                            let minutes = 60 * (hoursDecimal % 1);

                            if (data.duration.toFixed(0) < 60) {
                                setDuration(`${minutes.toFixed(0)} min`);
                            }
                            else if (data.duration.toFixed(0) % 60 === 0) {
                                setDuration(`${hours} hr`);
                            }
                            else {
                                setDuration(`${hours} hr ${minutes.toFixed(0)} min`);
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
                        return (trips.locations[key].type === "waypoint" && trips.locations[key].info.isEntered) && <Marker {...trips.locations[key].marker}/>;
                    }))
                }


            </MapView>
        </View>

        {role === "driver" &&
          <Select placeholder="Choose your number of available seats"
                  onValueChange={value => setCarAvailableSeats(parseInt(value))}>
              {[0, 1, 2, 3, 4, 5].map((number) => {
                  return <Select.Item key={`select${number}`} label={`${number}`} value={`${number}`}/>
              })
              }
          </Select>
        }

        {role === "driver" && trips.locations.startingLocation.info.isEntered && trips.locations.destLocation.info.isEntered &&
            <Button onPress={() => {
                createTrip();
            }}>
                <Text color="white">Create Trip</Text>
            </Button>
        }

        {role === "passenger" && trips.locations.startingLocation.info.isEntered && trips.locations.destLocation.info.isEntered &&
            <Button onPress={() => {
               searchTrips();
            }}>
                <Text color="white">Search for Trips</Text>
            </Button>
        }

        {/*<Text>Trip Information:</Text>*/}
        {/*<Text>Distance: {distance}</Text>*/}
        {/*<Text>Duration: {duration}</Text>*/}

        <Collapse style={{elevation: 100, transform: [{rotateX: "180deg"}]}}>
            <CollapseHeader style={{transform: [{rotateX: "180deg"}]}}>
                <Center>
                    <Text>
                        Search for Trips
                    </Text>
                </Center>
            </CollapseHeader>
            <CollapseBody style={{transform: [{rotateX: "180deg"}]}}>
                {tripsFound !== null &&
                    Object.keys(tripsFound).map((tripKey) => {
                        return (
                            <Box key={`trip${tripKey}`}>
                                <Text>{tripsFound[tripKey].driver_name} {tripsFound[tripKey].distance} {tripsFound[tripKey].duration}</Text>
                            </Box>
                        )
                    })
                }
                <Button onPress={() => {searchTrips()}}>Search trips</Button>
            </CollapseBody>
        </Collapse>

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
  }
});

export default MapScreen;
