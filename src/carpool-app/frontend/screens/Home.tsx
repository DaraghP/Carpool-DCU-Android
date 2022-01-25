import {StyleSheet, View, Text, SafeAreaView} from "react-native";
import {useContext, useEffect, useRef, useState} from "react";
import {GlobalContext} from "../Contexts";
import {GOOGLE_API_KEY} from "@env";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import MapView, { Marker } from "react-native-maps";

function HomeScreen({ navigation }) {
  const {globals, changeGlobals} = useContext(GlobalContext);
  const username = globals.username;
  const [isStartLocationEntered, setIsStartLocationEntered] = useState(false);
  const [isDestLocationEntered, setIsDestLocationEntered] = useState(false);
  const [startLat, setStartLat] = useState(53.1424);
  const [startLng, setStartLng] = useState(-7.6921);
  const [destLat, setDestLat] = useState(0);
  const [destLng, setDestLng] = useState(0);
  const mapRef = useRef(null);

  useEffect(() => {
      mapRef.current.fitToCoordinates(["marker"])
  }, [startLat, startLng])

  return (
      <View style={styles.container}>
          <GooglePlacesAutocomplete
            placeholder="Enter a starting location..."
            styles={{container:{flex: 0}, textInput:{fontSize: 20}}}
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
                changeGlobals({...globals, startingLocation: {address: data.description, coords: details.geometry.location}});
            }}
            fetchDetails={true}
          />

          <GooglePlacesAutocomplete
                placeholder="Enter your destination..."
                styles={{container:{flex: 0}, textInput:{fontSize: 20}}}
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
                    setDestLat(details.geometry.location.lat);
                    setDestLng(details.geometry.location.lng);
                    setIsDestLocationEntered(true);
                    changeGlobals({...globals, destination: {address: data.description, coords: details.geometry.location}});
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
                  {isStartLocationEntered && (
                      <Marker
                        coordinate={{
                            latitude: startLat,
                            longitude: startLng,
                        }}
                        title="Starting Point"
                        description={globals.startingLocation.address}
                        identifier="start"
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