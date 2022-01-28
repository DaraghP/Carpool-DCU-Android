import {StyleSheet, View, SafeAreaView, TouchableOpacity} from "react-native";
import {useEffect, useRef, useState} from "react";
import {GOOGLE_API_KEY} from "@env";
import {GooglePlacesAutocomplete, GooglePlacesAutocompleteRef} from "react-native-google-places-autocomplete";
import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import {updateUserState} from "../reducers/user-reducer";
import {useAppDispatch, useAppSelector, createLocationObj} from "../hooks";
import Ionicons from '@expo/vector-icons/Ionicons'
import {Button, Center, Text} from "native-base";
import CreateGoogleAutocompleteInput from "../components/CreateGoogleAutocompleteInput";

function HomeScreen({ navigation }) {
    const dispatch = useAppDispatch();
    const user = useAppSelector(state => state.user);
    const [numberOfWaypoints, setNumberOfWaypoints] = useState(0);
    const mapRef = useRef(null);

    const [locations, setLocations] = useState<any>({
        startingLocation: createLocationObj("startingLocation", "start", "Starting Point", {lat: 53.1424, lng: -7.6921}), 
        destLocation: createLocationObj("destLocation", "destination", "Destination Point"),
        waypoint1: createLocationObj("waypoint1", "waypoint", "Waypoint 1"),
        waypoint2: createLocationObj("waypoint2", "waypoint", "Waypoint 2"),
        waypoint3: createLocationObj("waypoint3", "waypoint", "Waypoint 3"),
        waypoint4: createLocationObj("waypoint4", "waypoint", "Waypoint 4"),
    })


    const handlePlacesResp = (locationObj, data, details) => {
        setLocations({
            ...locations,
            [locationObj.key]: {
                ...locationObj,
                info: {
                    ...locationObj.info,
                    coords: {
                        lat: details.geometry.location.lat,
                        lng: details.geometry.location.lng
                    },
                    isEntered: true
                },
                marker: {
                    ...locationObj.marker,
                    props: {
                        ...locationObj.marker.props,
                        coordinate: {
                            latitude: details.geometry.location.lat,
                            longitude: details.geometry.location.lng,
                        },
                        description: data.description 
                    }
                }
            }
        });
    }

    const increaseWaypoints = () => {
        if (numberOfWaypoints < 5) {
            setNumberOfWaypoints(numberOfWaypoints + 1);
        }
    }

    useEffect(() => {
        if (mapRef.current) {
            setTimeout(() => {
                let markers = Object.keys(locations).map((locationObjKey) => locations[locationObjKey].type);
                mapRef.current.fitToSuppliedMarkers(markers, {animated: true});
            }, 100)
        } 
    }, [locations]) // why does it say 


    useEffect(() => {
        console.log(numberOfWaypoints);
    }, [numberOfWaypoints])


    useEffect(() => {
        if (numberOfWaypoints > 0)
        {
            console.log(numberOfWaypoints)
        }
    }, [numberOfWaypoints])

  return (
      <View style={styles.container}>
        <CreateGoogleAutocompleteInput key={1} locationObj={locations.startingLocation} handlePlacesResp={(locationObj, data, details) => (handlePlacesResp(locationObj, data, details))} placeholder="Enter your starting point..."/>
        <CreateGoogleAutocompleteInput key={2} locationObj={locations.destLocation} handlePlacesResp={(locationObj, data, details) => (handlePlacesResp(locationObj, data, details))} placeholder="Enter your destination..."/>
        {Object.keys(locations).sort().map((key) => { 
            if (locations[key].type === "waypoint") {
                if (parseInt(key.charAt(key.length - 1)) <= numberOfWaypoints) {
                return <CreateGoogleAutocompleteInput key={key} handlePlacesResp={(locationObj, data, details) => (handlePlacesResp(locationObj, data, details))} locationObj={locations[key]}/>;
                } 
            }
        })}


        <MapView
            ref={mapRef}
            style={{flex: 1}}
            region={{
            latitude: locations.startingLocation.info.coords.lat,
            longitude: locations.startingLocation.info.coords.lng,
            latitudeDelta: locations.startingLocation.info.isEntered ? 0.01 : 4.50,
            longitudeDelta: locations.startingLocation.info.isEntered ? 0.01 : 4.50,
            }}
        >


        {locations.startingLocation.info.isEntered && locations.destLocation.info.isEntered && (
            
            <MapViewDirections
                origin={user.startingLocation.address}
                destination={locations.destLocation.marker.props.description}
                {...(numberOfWaypoints > 0 ? 
                {waypoints: Object.keys(locations).filter((key) => locations[key].marker.props.description && locations[key].type === "waypoint")
                            .map((key) => locations[key].marker.props.description)} // creates an array of addresses from locations that have type of "waypoint"
                : undefined)
                }
                apikey={GOOGLE_API_KEY}
                strokeWidth={3}
                strokeColor="black"
            />

        )}
        

        {locations.startingLocation.info.isEntered && ( 
            locations.startingLocation.marker
        )}

        {locations.destLocation.info.isEntered && (
            locations.destLocation.marker
        )}

        { locations.startingLocation.info.isEntered && locations.destLocation.info.isEntered && (
            Object.keys(locations).map((key) => {
                return locations[key].type === "waypoint" && locations[key].marker;
            }))
        } 

        </MapView>

        <Button onPress={() => {
            increaseWaypoints();
        }}>
            <Text color="white">Add waypoint</Text>
        </Button>

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

export default HomeScreen;