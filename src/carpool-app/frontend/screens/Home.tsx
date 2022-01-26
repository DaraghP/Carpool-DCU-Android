import {StyleSheet, View, Text, SafeAreaView, TouchableOpacity} from "react-native";
import {useEffect, useRef, useState} from "react";
import {GOOGLE_API_KEY} from "@env";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import {updateUserState} from "../reducers/user-reducer";
import {useAppDispatch, useAppSelector} from "../hooks";
import Ionicons from '@expo/vector-icons/Ionicons'
import {Center} from "native-base";

function HomeScreen({ navigation }) {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.user);
  const [isStartLocationEntered, setIsStartLocationEntered] = useState(false);
  const [isDestLocationEntered, setIsDestLocationEntered] = useState(false);
  const [startLat, setStartLat] = useState(53.1424);
  const [startLng, setStartLng] = useState(-7.6921);
  const [destLat, setDestLat] = useState(0);
  const [destLng, setDestLng] = useState(0);
  const mapRef = useRef(null);
  const startMarkerRef = useRef<GooglePlacesAutocomplete>(null);
  const destMarkerRef = useRef<GooglePlacesAutocomplete>(null);


  useEffect(() => {
      if (mapRef.current) {
          setTimeout(() => {
              mapRef.current.fitToSuppliedMarkers(["start", "destination"], {animated: true});
          }, 100)
      }
  }, [startLat, startLng, destLat, destLng])

  return (
      <View style={styles.container}>
          <GooglePlacesAutocomplete
            ref={startMarkerRef}
            placeholder="Enter a starting location..."
            listViewDisplayed={startMarkerRef.current?.getAddressText() !== ""}
            renderRightButton={() =>
                <TouchableOpacity onPress={() => {startMarkerRef.current?.setAddressText("")}}>
                    <Center>
                        <Ionicons style={{marginRight: 5}} name="close-circle-outline" size={25}/>
                    </Center>
                </TouchableOpacity>
            }
            styles={{container: {flex: 0}, textInput: {fontSize: 20}}}
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
                setStartLat(details.geometry.location.lat);
                setStartLng(details.geometry.location.lng);
                setIsStartLocationEntered(true);
                dispatch(updateUserState({startingLocation: {address: data.description, coords: details.geometry.location}}))
            }}
            fetchDetails={true}
          />

          <GooglePlacesAutocomplete //
                ref={destMarkerRef}
                placeholder="Enter your destination..."
                listViewDisplayed={destMarkerRef.current?.getAddressText() !== ""}
                renderRightButton={() =>
                    <TouchableOpacity onPress={() => {destMarkerRef.current?.setAddressText("")}}>
                        <Center>
                            <Ionicons style={{marginRight: 5}} name="close-circle-outline" size={25}/>
                        </Center>
                    </TouchableOpacity>//
                }
                styles={{container:{flex: 0}, textInput:{fontSize: 20, color:"red"}}}//
                query={{
                    key: GOOGLE_API_KEY, //
                    language: "en", // 
                    components: "country:ie"
                }}
                nearbyPlacesAPI="GooglePlacesSearch"
                returnKeyType="search"
                debounce={400}
                minLength={2}
                enablePoweredByContainer={false}
                onPress={(data, details = null) => {
                    setDestLat(details.geometry.location.lat);
                    setDestLng(details.geometry.location.lng);
                    setIsDestLocationEntered(true);
                    dispatch(updateUserState({destinationLocation: {address: data.description, coords: details.geometry.location}}))
                }}
                fetchDetails={true}
              />

              <MapView
                 ref={mapRef}
                 style={{flex: 1}}
                 region={{
                    latitude: startLat,
                    longitude: startLng,
                    latitudeDelta: isStartLocationEntered ? 0.01 : 4.50,
                    longitudeDelta: isStartLocationEntered ? 0.01 : 4.50,
                 }}
              >

                  {isStartLocationEntered && isDestLocationEntered && (
                      <MapViewDirections
                          origin={user.startingLocation.address}
                          destination={user.destinationLocation.address}
                          apikey={GOOGLE_API_KEY}
                          strokeWidth={3}
                          strokeColor="black"
                      />
                  )}

                  {isStartLocationEntered && (
                      <Marker
                        key="start"
                        coordinate={{
                            latitude: startLat,
                            longitude: startLng,
                        }}
                        title="Starting Point"
                        description={user.startingLocation.address}
                        identifier="start"
                      />
                  )}

                  {isDestLocationEntered && (
                      <Marker
                        key="destination"
                        coordinate={{
                            latitude: destLat,
                            longitude: destLng,
                        }}
                        title="Destination Point"
                        description={user.destinationLocation.address}
                        identifier="destination"
                      />
                  )}


              </MapView>
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