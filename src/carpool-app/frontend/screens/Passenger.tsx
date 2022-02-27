import {Button, Center, VStack, Heading, Spinner} from "native-base";
import MapScreen from "./TripScreen"
import {SafeAreaView} from "react-native";
import {useRef, useEffect, useState} from "react";
import {useAppDispatch, useAppSelector} from "../hooks";
import {FormControl, Input} from "native-base";
import {updateRole, resetTripState} from "../reducers/trips-reducer"

function PassengerScreen({navigation}) {
    const dispatch = useAppDispatch();
    const backendURL = useAppSelector(state => state.globals.backendURL);
    const user = useAppSelector(state => state.user);
    const trips = useAppSelector(state => state.trips);

    useEffect(() => {
        if (user.status === "available") {
            dispatch(resetTripState());
        }
    }, [trips.role])

    return (
        <SafeAreaView style={{flex: 1}}>

            <MapScreen/>

        </SafeAreaView>
    )
}

export default PassengerScreen;