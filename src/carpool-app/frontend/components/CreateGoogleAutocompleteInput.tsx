import { updateUserState } from "../reducers/user-reducer";
import {GooglePlacesAutocomplete, GooglePlacesAutocompleteRef} from "react-native-google-places-autocomplete";
import {useEffect, useRef, useState} from "react";
import Ionicons from '@expo/vector-icons/Ionicons';
import {TouchableOpacity} from "react-native";
import {Button, Center, Text} from "native-base";
import { useAppDispatch, useAppSelector, createLocationObj } from "../hooks";
import {GOOGLE_API_KEY} from "@env";


const CreateGoogleAutocompleteInput = ({locationObj, handlePlacesResp, placeholder = "Enter a waypoint...", numberOfWaypoints=0}) => {
    const dispatch = useAppDispatch();
    const markerRef = useRef<GooglePlacesAutocomplete>();
    const user = useAppSelector(state => state.user);
    const [text, setText] = useState("");

    return (
        <GooglePlacesAutocomplete
            key={locationObj.key}
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
                handlePlacesResp(locationObj, data, details) 
                dispatch(updateUserState({[locationObj.key]: {address: data.description, coords: details.geometry.location}}))
            }}
            fetchDetails={true}//
        />
    );
};

export default CreateGoogleAutocompleteInput;