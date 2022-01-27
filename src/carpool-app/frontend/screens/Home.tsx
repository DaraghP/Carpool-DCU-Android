import {StyleSheet, View, SafeAreaView, TouchableOpacity} from "react-native";
import {useEffect, useRef, useState} from "react";
import {GOOGLE_API_KEY} from "@env";
import {GooglePlacesAutocomplete, GooglePlacesAutocompleteRef} from "react-native-google-places-autocomplete";
import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import {updateUserState} from "../reducers/user-reducer";
import {useAppDispatch, useAppSelector} from "../hooks";
import Ionicons from '@expo/vector-icons/Ionicons'
import {Button, Center, Text} from "native-base";

function HomeScreen({ navigation }) {
    const dispatch = useAppDispatch();
    const user = useAppSelector(state => state.user);
    const [numberOfWaypoints, setNumberOfWaypoints] = useState(0);
    const mapRef = useRef(null);

    const [locations, setLocations] = useState({
        startingLocation: createLocationObj("startingLocation", "start", "Starting Point",{lat: 53.1424, lng: -7.6921}),
        destLocation: createLocationObj("destLocation", "destination", "Destination Point")
    })


    function createLocationObj(key: string, type: string, typeTitle: string, coords: { lat: number, lng: number } = {lat: 0, lng: 0}) {
        type = type !== "waypoint" ? type : `waypoint-${numberOfWaypoints}`;

        return (
            {
                 key: key,
                 type: type,
                 info: {
                    coords: coords,
                    isEntered: false
                 },
                 marker: <Marker
                            key={type}
                            coordinate={{
                                latitude: coords.lat,
                                longitude: coords.lng,
                            }}
                            title={typeTitle}
                            description={user.key?.address}
                            identifier={type}
                         />
            }
        )
    }

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
                        description: data.description //
                    }
                }
            }
        });
    }
    const CreateGoogleAutocompleteInput = ({locationObj, placeholder = "Enter a waypoint..."}) => {
        const markerRef = useRef();

        return (
            <GooglePlacesAutocomplete
                ref={markerRef}
                placeholder={placeholder}
                listViewDisplayed={markerRef.current?.getAddressText() !== ""}
                renderRightButton={() =>
                    <TouchableOpacity onPress={() => {markerRef.current?.setAddressText("")}}>
                        <Center>
                            <Ionicons style={{marginRight: 5}} color={markerRef.current?.getAddressText() !== "" ? "black" : "#c8c7cc"} name="close-circle-outline" size={25} />
                        </Center>
                    </TouchableOpacity>
                }
                styles={{container: {flex: 0}, textInput: {fontSize: 20}}} //
                query={{
                    key: GOOGLE_API_KEY,
                    language: "en",
                    components: "country:ie"
                }}
                nearbyPlacesAPI="GooglePlacesSearch"
                returnKeyType="search"
                debounce={400}
                minLength={2}
                enablePoweredByContainer={false}
                onPress={(data, details = null) => {
                    handlePlacesResp(locationObj, data,details)
                    dispatch(updateUserState({[locationObj.key]: {address: data.description, coords: details.geometry.location}}))
                }}
                fetchDetails={true}//
            />
        );
    }

    useEffect(() => {
        if (mapRef.current) {
            setTimeout(() => {
                let markers = Object.keys(locations).map((locationObjKey) => locations[locationObjKey].type);
                mapRef.current.fitToSuppliedMarkers(markers, {animated: true});
            }, 100)
        }
        // console.log(locations)
    }, [locations])


    const handleSetWaypoint =  () => {
        if (numberOfWaypoints < 5) {
            setNumberOfWaypoints(numberOfWaypoints + 1);
            setLocations({
                ...locations,
                [`waypoint-${numberOfWaypoints}`]: createLocationObj(`waypoint-${numberOfWaypoints}`, "waypoint", "Add waypoint...")
            });
        }
    }


  return (
      <View style={styles.container}>
          <CreateGoogleAutocompleteInput key={1} locationObj={locations.startingLocation} placeholder="Enter your starting point..."/>
          <CreateGoogleAutocompleteInput key={2} locationObj={locations.destLocation} placeholder="Enter your destination..."/>
          {Object.keys(locations).map((key) => {
              if (key !== "startingLocation" && key !== "destLocation") {
                  return <CreateGoogleAutocompleteInput key={key} locationObj={locations[key]}/>;
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

                  {/*{isStartLocationEntered && isDestLocationEntered && isWaypoint1LocationEntered && (*/}
                  {/*    <MapViewDirections*/}
                  {/*        origin={user.startingLocation.address}*/}
                  {/*        destination={user.destinationLocation.address}*/}
                  {/*        waypoints={[user.waypoint1Location.address]}*/}
                  {/*        apikey={GOOGLE_API_KEY}*/}
                  {/*        strokeWidth={3}*/}
                  {/*        strokeColor="black"*/}
                  {/*        onReady={route => {*/}
                  {/*          console.log(route.distance, "km")*/}
                  {/*          console.log(route.duration, "minutes")*/}
                  {/*        }}*/}
                  {/*    />*/}
                  {/*)}*/}


                    {locations.startingLocation.info.isEntered && locations.destLocation.info.isEntered && (
                      <MapViewDirections
                          origin={user.startingLocation.address}
                          destination={locations.destLocation.marker.props.description}
                          //waypoints={}
                          apikey={GOOGLE_API_KEY}
                          strokeWidth={3}
                          strokeColor="black"
                      />

                  )}


                  {/*{isStartLocationEntered && isDestLocationEntered && !isWaypoint1LocationEntered && (*/}
                  {/*    <MapViewDirections*/}
                  {/*        origin={user.startingLocation.address}*/}
                  {/*        destination={user.destinationLocation.address}*/}
                  {/*        //waypoints={}*/}
                  {/*        apikey={GOOGLE_API_KEY}*/}
                  {/*        strokeWidth={3}*/}
                  {/*        strokeColor="black"*/}
                  {/*    />*/}

                  {/*    //*/}
                  {/*)}*/}

                  {locations.startingLocation.info.isEntered && (
                        locations.startingLocation.marker
                  )}

                  {locations.destLocation.info.isEntered && (
                        locations.destLocation.marker
                  )}


                  {/*{isStartLocationEntered && (*/}
                  {/*    <Marker*/}
                  {/*      key="start"*/}
                  {/*      coordinate={{*/}
                  {/*          latitude: startLat,*/}
                  {/*          longitude: startLng,*/}
                  {/*      }}*/}
                  {/*      title="Starting Point"*/}
                  {/*      description={user.startingLocation.address}*/}
                  {/*      identifier="start"*/}
                  {/*    />*/}
                  {/*)}*/}

                  {/*{isDestLocationEntered && (*/}
                  {/*    <Marker*/}
                  {/*      key="destination"*/}
                  {/*      coordinate={{*/}
                  {/*          latitude: destLat,*/}
                  {/*          longitude: destLng,*/}
                  {/*      }}*/}
                  {/*      title="Destination Point"*/}
                  {/*      description={user.destinationLocation.address}*/}
                  {/*      identifier="destination"*/}
                  {/*    />*/}
                  {/*)}*/}

                  {/*{isWaypoint1LocationEntered && (*/}
                  {/*    <Marker*/}
                  {/*      key="waypoint1"*/}
                  {/*      coordinate={{*/}
                  {/*          latitude: waypoint1Lat,*/}
                  {/*          longitude: waypoint1Lng,*/}
                  {/*      }}*/}
                  {/*      title="WayPoint"*/}
                  {/*      description={user.waypoint1Location.address}*/}
                  {/*      identifier="waypoint1"*/}
                  {/*    />*/}
                  {/*)}*/}

              </MapView>
          <Button onPress={() => {
              handleSetWaypoint();
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