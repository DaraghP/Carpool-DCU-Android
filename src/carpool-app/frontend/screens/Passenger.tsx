import {Button, Center, VStack, Heading, Spinner} from "native-base";
import MapScreen from "./Map"
import {SafeAreaView} from "react-native";
import {useRef, useEffect, useState} from "react";
import {useAppSelector} from "../hooks";
import {FormControl, Input} from "native-base";


function PassengerScreen({navigation}) {
    const backendURL = useAppSelector(state => state.globals.backendURL);
    const user = useAppSelector(state => state.user);

    return (
        <SafeAreaView style={{flex: 1}}>

            <MapScreen role={"passenger"}/>

        </SafeAreaView>
    )
}

export default PassengerScreen;