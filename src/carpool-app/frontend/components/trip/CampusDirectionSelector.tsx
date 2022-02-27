import {Button, Divider, HStack, Icon} from "native-base";
import {TouchableOpacity} from "react-native";
import {resetTripState, setLocations} from "../../reducers/trips-reducer";
import Ionicons from "@expo/vector-icons/Ionicons";
import {createLocationObj, useAppDispatch} from "../../hooks";

function CampusDirectionSelector({campusSelected, setCampusSelected, isTripToDCU, setIsTripToDCU}) {
    const dispatch = useAppDispatch();

    return (
        <>
           {isTripToDCU === undefined ?
                <Button.Group isAttached space={15} mx={{base: "auto"}} justifyContent="center">
                    <Button
                            width="30%"
                            colorScheme="gray"
                            {...(isTripToDCU ? {colorScheme: "red"} : {variant: "outline"})}
                            onPress = {() => {
                                setIsTripToDCU(true);
                            }}
                        >
                            To DCU
                        </Button>
                    <Button
                        width="30%"
                        colorScheme="gray"
                        {...(!isTripToDCU && isTripToDCU !== undefined ? {colorScheme: "red"} : {variant: "outline"})}
                        onPress={() => {setIsTripToDCU(false);}}>
                            From DCU
                    </Button>
                </Button.Group>
                :
                <HStack>
                    <TouchableOpacity
                        onPress={() => {
                            setIsTripToDCU(undefined);
                            setCampusSelected("");
                            dispatch(resetTripState())
                        }}
                    >
                        <Icon ml="2" as={Ionicons} name="arrow-back-outline"/>
                    </TouchableOpacity>

                    {/* <Text>Select a campus:</Text> */}

                    <Button.Group isAttached space={15} mx={{base: "auto"}} justifyContent="center">
                        <Button width="40%" {...(campusSelected == "GLA" ? {colorScheme: "red"} : {variant: "outline"})}
                            onPress={() => {
                                setCampusSelected("GLA");
                                if (isTripToDCU) {
                                    dispatch(setLocations({destLocation: createLocationObj("destLocation", "destination", "Destination Point", {lat: 53.3863494, lng: -6.256591399999999}, "Dublin City University, Collins Ave Ext, Whitehall, Dublin 9", true)}))
                                } else {
                                    dispatch(setLocations({startingLocation: createLocationObj("startingLocation", "start", "Starting Point", {lat: 53.3863494, lng: -6.256591399999999}, "Dublin City University, Collins Ave Ext, Whitehall, Dublin 9", true)}))
                                }
                            }}
                        >
                                Glasnevin
                        </Button>
                        <Button width="40%" {...(campusSelected == "PAT" ? {colorScheme: "red"} : {variant: "outline"})}
                            onPress={() => {
                                setCampusSelected("PAT");
                                if (isTripToDCU) {
                                    dispatch(setLocations({destLocation: createLocationObj("destLocation", "destination", "Destination Point", {lat: 53.3701804, lng: -6.254689499999999}, "DCU St Patrick's Campus, Drumcondra Road Upper, Drumcondra, Dublin 9, Ireland", true)}))
                                }
                                else {
                                    dispatch(setLocations({startingLocation: createLocationObj("startingLocation", "start", "Starting Point", {lat: 53.3701804, lng: -6.254689499999999}, "DCU St Patrick's Campus, Drumcondra Road Upper, Drumcondra, Dublin 9, Ireland", true)}))
                                }
                            }}
                        >
                                St. Patrick's
                        </Button>
                    </Button.Group>
                </HStack>
            }
            <Divider mt="5"/>
        </>
    )
}

export default CampusDirectionSelector;