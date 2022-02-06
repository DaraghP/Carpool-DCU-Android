import {StyleSheet, View} from "react-native";
import {useEffect, useRef, useState} from "react";
import {GOOGLE_API_KEY} from "@env";
import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import {setNumberOfWaypoints} from "../reducers/trips-reducer";
import {useAppDispatch, useAppSelector} from "../hooks";
import {Button, Center, Text} from "native-base";
import CreateGoogleAutocompleteInput from "../components/CreateGoogleAutocompleteInput";

function MapScreen({ role }) {
    const dispatch = useAppDispatch();
    const trips = useAppSelector(state => state.trips);
    const mapRef = useRef(null);

    const [distance, setDistance] = useState("");
    const [duration, setDuration] = useState("");

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

    const createTrip = () => {

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

        <Button onPress={() => {
            increaseWaypoints();
        }}>
            <Text color="white">Add waypoint</Text>
        </Button>

        <Button onPress={() => {
            createTrip();
        }}>
            <Text color="white">Create Trip</Text>
        </Button>


        <Text>Trip Information:</Text>
        <Text>Distance: {distance}</Text>
        <Text>Duration: {duration}</Text>

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
