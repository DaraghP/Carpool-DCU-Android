import {StyleSheet, View, SafeAreaView, TouchableOpacity} from "react-native";
import {useEffect, useRef, useState} from "react";
import {GOOGLE_API_KEY} from "@env";
import {GooglePlacesAutocomplete, GooglePlacesAutocompleteRef} from "react-native-google-places-autocomplete";
import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import {setLocations, setNumberOfWaypoints, updateUserState} from "../reducers/user-reducer";
import {useAppDispatch, useAppSelector, createLocationObj} from "../hooks";
import Ionicons from '@expo/vector-icons/Ionicons'
import {Button, Center, Text} from "native-base";
import CreateGoogleAutocompleteInput from "../components/CreateGoogleAutocompleteInput";

function MapScreen({ role, navigation }) {
    const dispatch = useAppDispatch();
    const user = useAppSelector(state => state.user);
    const mapRef = useRef(null);

    const [distance, setDistance] = useState("");
    const [duration, setDuration] = useState("");

    const increaseWaypoints = () => {
        let activeWaypoints = Object.keys(user.locations).filter((key) => user.locations[key].marker.description && user.locations[key].type === "waypoint" && user.locations[key].info.isEntered)
                                .map((key) => user.locations[key].marker.description);

        if (user.numberOfWaypoints < 4) {
            if ((user.numberOfWaypoints - activeWaypoints.length) === 0) {
                dispatch(setNumberOfWaypoints(user.numberOfWaypoints + 1));

            } else {
                console.log("error: fill waypoint field before adding another");
            }
        } else {
            console.log("error: too many waypoints");
        }
    }


    useEffect(() => {
        if (mapRef.current) {
            setTimeout(() => {
                let waypointMarkers = Object.keys(user.locations).filter((key) => user.locations[key].marker.description && user.locations[key].type === "waypoint" && user.locations[key].info.isEntered)
                            .map((key) => user.locations[key].marker.description);

                let markers = Object.keys(user.locations).map((key) => user.locations[key]).map((obj) => obj.type === "waypoint" ? obj.key : obj.marker.key);
                if (user.locations.startingLocation.info.isEntered || user.locations.destLocation.info.isEntered) {
                    mapRef.current.fitToSuppliedMarkers(markers, {animated: true});
                }
            }, 100)
        }
    }, [user.numberOfWaypoints, distance, duration])


  return (
      <View style={styles.container}>

        <CreateGoogleAutocompleteInput
            key={1}
            locationObj={user.locations.startingLocation}
            placeholder="Enter your starting point..."
        />

        <CreateGoogleAutocompleteInput
            key={2}
            locationObj={user.locations.destLocation}
            placeholder="Enter your destination..."
        />

          {Object.keys(user.locations).sort().map((key) => {
            if (user.locations[key].type === "waypoint") {
                if (parseInt(key.charAt(key.length - 1)) <= user.numberOfWaypoints) {
                    return (
                        <CreateGoogleAutocompleteInput
                            key={key}
                            locationObj={user.locations[key]}
                        />
                    );
                }
            }
        })}


        <MapView
            ref={mapRef}
            style={{flex: 1}}
            region={{
                latitude: user.locations.startingLocation.info.coords.lat,
                longitude: user.locations.startingLocation.info.coords.lng,
                latitudeDelta: user.locations.startingLocation.info.isEntered ? 0.01 : 4.50,
                longitudeDelta: user.locations.startingLocation.info.isEntered ? 0.01 : 4.50,
            }}
        >
            {user.locations.startingLocation.info.isEntered && user.locations.destLocation.info.isEntered && (

                <MapViewDirections
                    origin={user.locations.startingLocation.marker.description}
                    destination={user.locations.destLocation.marker.description}
                    {...(user.numberOfWaypoints > 0 ?
                    {waypoints: Object.keys(user.locations).filter((key) => user.locations[key].marker.description && user.locations[key].type === "waypoint" && user.locations[key].info.isEntered)
                                .map((key) => user.locations[key].marker.description)} // creates an array of addresses from locations that have type of "waypoint"
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

            {user.locations.startingLocation.info.isEntered && (
                <Marker {...user.locations.startingLocation.marker}/>
            )}

            {user.locations.destLocation.info.isEntered && (
                <Marker {...user.locations.destLocation.marker}/>
            )}

            {user.locations.startingLocation.info.isEntered && user.locations.destLocation.info.isEntered && (
                Object.keys(user.locations).sort().map((key) => {
                    return (user.locations[key].type === "waypoint" && user.locations[key].info.isEntered) && <Marker {...user.locations[key].marker}/>;
                }))
            }


        </MapView>

        <Button onPress={() => {
            increaseWaypoints();
        }}>
            <Text color="white">Add waypoint</Text>
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
