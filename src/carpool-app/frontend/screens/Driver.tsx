import {Button, Center, VStack, Heading, Spinner} from "native-base";
import MapScreen from "./Map"
import {SafeAreaView} from "react-native";
import {useRef, useEffect, useState} from "react";
import {useAppSelector} from "../hooks";
import {FormControl, Input} from "native-base";

function DriverScreen({navigation}) {
    const backendURL = useAppSelector(state => state.globals.backendURL);
    const user = useAppSelector(state => state.user);
    const [requestFinished, setRequestFinished] = useState(false);
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
        fetch(`${backendURL}/get_driver`, {
          method: "GET",
          headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': `Token ${user.token}`
          },
        }).then(response => ({status: response.status})) //
        .then(async (res) => {
            if (res.status === 404) {
                setHasCreatedDriverRole(false);
                setRequestFinished(true);
            }
            else {
                setHasCreatedDriverRole(true);
                setRequestFinished(true);
            }
        }).catch((e) => {
            console.error(e)
        })
    }, [])

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
            setRequestFinished(true);
        }
        else {
            console.log("Error");
        }
        }).catch((e) => {
            console.error(e);
        });
    };

    return (
        <SafeAreaView style={{flex: 1}}>
            {!requestFinished &&
                <Center>
                    <Spinner size="lg" height="100%"/>
                </Center>
            }

            {requestFinished && !hasCreatedDriverRole &&
                <VStack space={"5"} margin="5" alignItems="center">
                    <Heading size="md">Car Details</Heading>
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
            }

            {requestFinished && hasCreatedDriverRole &&
                <MapScreen role={"driver"}/>
            }

        </SafeAreaView>
    )
}

export default DriverScreen;