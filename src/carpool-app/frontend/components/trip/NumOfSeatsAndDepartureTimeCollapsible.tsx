import {Button, Divider, Heading, HStack, Icon, VStack} from "native-base";
import Ionicons from "@expo/vector-icons/Ionicons";
import Collapsible from "react-native-collapsible";
import NumberOfSeatsSelector from "./NumberOfSeatsSelector";
import DepartureTimePicker from "./DepartureTimePicker";
import {useAppSelector} from "../../hooks";
import {useState} from "react";

function NumOfSeatsAndDepartureTimeCollapsible() {
    const user = useAppSelector(state => state.user);
    const trips = useAppSelector(state => state.trips);

    const [showDepartureAndTimePickerCollapsible, setShowDepartureAndTimePickerCollapsible] = useState(true);

// trips.32.driverName, undefined in property, set failed
    return (// whats it say
        (trips.role === "driver" && user.status !== "driver_busy" && trips.locations.startingLocation.info.isEntered && trips.locations.destLocation.info.isEntered ?
                <>
                    <Button
                        style={{backgroundColor: "white"}}
                        onPress={() => {
                            setShowDepartureAndTimePickerCollapsible(!showDepartureAndTimePickerCollapsible)
                        }}
                    >
                        <HStack space={3} alignItems="center">
                            <Heading size={"sm"}>
                                Number of seats and departure time
                            </Heading>
                            <Icon as={Ionicons} name={showDepartureAndTimePickerCollapsible ? "chevron-down" : "chevron-up"}/>
                        </HStack>
                    </Button>

                    <Collapsible collapsed={showDepartureAndTimePickerCollapsible}>
                        <VStack space={2} padding={5} borderTopWidth={0.5}>
                            <Heading size={"md"} flexGrow="1">Pick your departure time {trips.role === "driver" && "\nand number of seats"}</Heading>
                            <Divider/>

                            <NumberOfSeatsSelector/>
                            <DepartureTimePicker/>
                        </VStack>
                    </Collapsible>
                </>
        : null)
    )
}

export default NumOfSeatsAndDepartureTimeCollapsible;