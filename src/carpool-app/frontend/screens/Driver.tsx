import {Button, Center, VStack, Heading, Spinner, ScrollView} from "native-base";
import TripScreen from "./TripScreen"
import {SafeAreaView} from "react-native";
import {useRef, useEffect, useState} from "react";
import {useAppSelector, useAppDispatch} from "../hooks";
import {FormControl, Input} from "native-base";
import {updateRole, resetTripState} from "../reducers/trips-reducer";
import {heightPercentageToDP, widthPercentageToDP} from "react-native-responsive-screen";


function DriverScreen({navigation}) {
    const dispatch = useAppDispatch();
    const backendURL = useAppSelector(state => state.globals.backendURL);
    const user = useAppSelector(state => state.user);
    const trips = useAppSelector(state => state.trips);
    const [getDriverRequestFinished, setGetDriverRequestFinished] = useState(false);
    const [hasCreatedDriverRole, setHasCreatedDriverRole] = useState(false);

    const makeInput = useRef("");
    const modelInput = useRef("");
    const colourInput = useRef("");
    const licensePlateInput = useRef("");

    const [makeText, setMakeText] = useState("");
    const [modelText, setModelText] = useState("");
    const [colourText, setColourText] = useState("");
    const [licensePlateText, setLicensePlateText] = useState("");

    useEffect(() => {
        if (user.status === "available") {
            dispatch(resetTripState());
        }
        fetch(`${backendURL}/get_driver`, {
          method: "GET",
          headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': `Token ${user.token}`
          },
        }).then(response => response.json())
        .then(async (res) => {
            if (res.driver_exists) {
                setHasCreatedDriverRole(true);
            }
            else {
                setHasCreatedDriverRole(false);
            }
            setGetDriverRequestFinished(true);
        }).catch((e) => {
            console.error(e)
        })
    }, [])


    useEffect(() => {
        if (user.status === "available") {
            dispatch(resetTripState());
        }
    }, [trips.role])

    const createDriver = () => {
        fetch(`${backendURL}/create_driver`, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Token ${user.token}`
            },
            body: JSON.stringify({make: makeText, model: modelText, colour: colourText, license_plate: licensePlateText})
        }).then(response => response.json())
        .then((res) => {
        if (!("errorType" in res)) {
            makeInput.current.clear();
            modelInput.current.clear();
            colourInput.current.clear();
            licensePlateInput.current.clear();
            console.log("Car Details saved.");
            console.log("NEW DRIVER CREATED");

            setHasCreatedDriverRole(true);
            setGetDriverRequestFinished(true);
        }
        else {
            console.log("Error");
        }
        }).catch((e) => {
            console.error(e);
        });
    };

    return (
        <SafeAreaView style={{flex: 1, height: heightPercentageToDP(100), width: widthPercentageToDP(100)}}>
            {!getDriverRequestFinished &&
                <Center>
                    <Spinner size="lg" height="100%"/>
                </Center>
            }

            {getDriverRequestFinished && !hasCreatedDriverRole &&
                <ScrollView keyboardShouldPersistTaps={"handled"}>
                    <VStack space={"5"} margin="5" alignItems="center">
                        <Heading size="lg">Car Details</Heading>
                        <FormControl>
                            <FormControl.Label>Make</FormControl.Label>
                            <Input placeholder="Make" ref={makeInput} onChangeText={(text: string) => {
                                setMakeText(text);
                            }}/>
                        </FormControl>

                        <FormControl>
                            <FormControl.Label>Model</FormControl.Label>
                            <Input placeholder="Model" ref={modelInput} onChangeText={(text: string) => {
                                setModelText(text);
                            }}/>
                        </FormControl>

                        <FormControl>
                            <FormControl.Label>Colour</FormControl.Label>
                            <Input placeholder="Colour" ref={colourInput} onChangeText={(text: string) => {
                                setColourText(text);
                            }}/>
                        </FormControl>

                        <FormControl>
                            <FormControl.Label>License Plate</FormControl.Label>
                            <Input placeholder="License Plate" ref={licensePlateInput} onChangeText={(text: string) => {
                                setLicensePlateText(text);
                            }}/>
                        </FormControl>

                        <Button mt="5" width="100%" onPress={() => {createDriver()}}>
                            Submit Car Information
                        </Button>
                    </VStack>
                </ScrollView>
            }

            {getDriverRequestFinished && hasCreatedDriverRole &&
                <TripScreen/>
            }

        </SafeAreaView>
    )
}

export default DriverScreen;