import {TouchableOpacity} from "react-native";
import {Alert, Box, Button, Center, Flex, Heading, HStack, Icon, Modal, Spinner, Text, View, VStack} from "native-base";
import {v4} from "uuid";
import {useEffect, useState} from "react";
import {acceptTripRequest, createLocationObj, declineTripRequest, useAppDispatch, useAppSelector} from "../../hooks";
import {updateTripState} from "../../reducers/trips-reducer";
import {getDatabase, off, onValue, ref, set} from "firebase/database";
import {heightPercentageToDP, widthPercentageToDP} from "react-native-responsive-screen";
import Profile from "../user/Profile";
import Ionicons from "@expo/vector-icons/Ionicons";

function TripRequestsModal({firebaseTripRequests, previousTripID, setPreviousTripID}) {
    const db = getDatabase();
    const dispatch = useAppDispatch();
    const trips = useAppSelector(state => state.trips);
    const user = useAppSelector(state => state.user);
    const backendURL = useAppSelector(state => state.globals.backendURL);
    const [showRequestsModalSpinner, setShowRequestsModalSpinner] = useState(false);
    const [showPassengerRequestsModal, setShowPassengerRequestsModal] = useState(false);

    const acceptRequest = (passengerID) => {
        setShowRequestsModalSpinner(true);
        fetch(`${backendURL}/add_passenger_to_trip`, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Token ${user.token}`
            },
            body: JSON.stringify({
                tripID: trips.id,
                passengerData: {
                    id: passengerID,
                    name: firebaseTripRequests[passengerID].name,
                    passengerStart: {
                        name: firebaseTripRequests[passengerID].startLocation.name,
                        lat: firebaseTripRequests[passengerID].startLocation.coords.lat,
                        lng: firebaseTripRequests[passengerID].startLocation.coords.lng, 
                    },
                    passengerDestination: {
                        name: firebaseTripRequests[passengerID].destination.name,
                        lat: firebaseTripRequests[passengerID].destination.coords.lat,
                        lng: firebaseTripRequests[passengerID].destination.coords.lng, 
                    }
                }
            })
        }).then(response => response.json())
        .then((res) => {
            if (!("error" in res)) {
                if (res.trip_data["waypoints"] !== null) {
                    Object.keys(res.trip_data["waypoints"]).map((key) => {
                        res.trip_data["waypoints"][key] = createLocationObj(key, "waypoint", res.trip_data["waypoints"][key].passenger === undefined ? "Driver Stop" : res.trip_data["waypoints"][key].passenger, {lat: res.trip_data["waypoints"][key].lat, lng: res.trip_data["waypoints"][key].lng}, res.trip_data["waypoints"][key].name, true);
                    });
                }
                else {
                    res.trip_data["waypoints"] = {};
                }

                dispatch(updateTripState({
                    ...res.trip_data,
                    locations: {
                        ...trips.locations,
                        ...res.trip_data["waypoints"],
                    },
                    availableSeats: res.trip_data["available_seats"],
                    numberOfWaypoints: res.trip_data["waypooints"] !== null ? Object.keys(res.trip_data["waypoints"]).length : 0
                }))
                acceptTripRequest(trips.id, res.trip_data["available_seats"], firebaseTripRequests[passengerID]).then(() => {
                    setShowRequestsModalSpinner(false);
                })
            }
            else {
                console.log(res.error);
            }
        })

    }


    // for driver only
    const declineRequest = (passengerID) => {
        declineTripRequest(trips.id, passengerID);
    }


    return (
        //
        <>
            <Modal width={widthPercentageToDP(100)} height={heightPercentageToDP(100)} isOpen={showPassengerRequestsModal} onClose={() => {setShowPassengerRequestsModal(false)}}>
                 <Modal.Content size="sm" width={widthPercentageToDP(100)} height={heightPercentageToDP(100)}>
                     <Modal.CloseButton/>
                     <Modal.Header>Requests</Modal.Header>
                     <Modal.Body>
                         {showRequestsModalSpinner ?
                             <Center height={heightPercentageToDP(50)}>
                                 <Spinner flexDirection="column" size={"lg"}/>
                             </Center>
                             :
                             <VStack>
                                 {Object.keys(firebaseTripRequests).length === 0 &&
                                    <Heading alignSelf="center" my="auto">
                                        No requests are available.
                                    </Heading>
                                 }
                                 {Object.keys(firebaseTripRequests).map((key, index) => {
                                     return (
                                         <Box key={v4()} bg="light.50" rounded={20} shadow={0} padding={5} mt={1} minHeight={heightPercentageToDP(30)}>
                                             <VStack mr={widthPercentageToDP(10)}>

                                                 <HStack>
                                                     <VStack mr={widthPercentageToDP(8)}>

                                                         <VStack alignItems="center" mx="auto">
                                                             <Profile uid={key} mode="iconModal"/>
                                                             <Text mt="1" style={{
                                                                 fontWeight: "bold",
                                                                 fontSize: heightPercentageToDP("2.5%")
                                                             }}>
                                                                 {firebaseTripRequests[key].name}
                                                             </Text>
                                                         </VStack>

                                                         <HStack space={widthPercentageToDP(0.9)}
                                                                 mt={heightPercentageToDP(1)}>
                                                             <Button bg={"green.500"} onPress={() => {
                                                                 acceptRequest(key)
                                                             }}>
                                                                 <HStack alignItems="center">
                                                                     <Icon as={Ionicons} color="white"
                                                                           name="checkmark"/>
                                                                 </HStack>
                                                             </Button>
                                                             <Button bg={"red.600"} onPress={() => {
                                                                 declineRequest(key)
                                                             }}>
                                                                 <HStack alignItems="center">
                                                                     <Icon as={Ionicons} color="white" name="close"/>
                                                                 </HStack>
                                                             </Button>
                                                         </HStack>
                                                     </VStack>
                                                     <VStack maxWidth={widthPercentageToDP(50)}>
                                                         <Heading size={"md"}>From</Heading>
                                                         <Text>{firebaseTripRequests[key].startLocation.name} </Text>
                                                         <Heading size={"md"} mt={3}>To</Heading>
                                                         <Text>{firebaseTripRequests[key].destination.name}</Text>

                                                     </VStack>

                                                 </HStack>
                                                 {/*<HStack space={widthPercentageToDP(0.9)} mt={heightPercentageToDP(2)}>*/}
                                                 {/*    <Button bg={"green.500"} onPress={() => {*/}
                                                 {/*        acceptRequest(key)*/}
                                                 {/*    }}>*/}
                                                 {/*        <HStack alignItems="center">*/}
                                                 {/*            <Icon as={Ionicons} color="white" name="checkmark"/>*/}
                                                 {/*        </HStack>*/}
                                                 {/*    </Button>*/}
                                                 {/*    <Button bg={"red.600"} onPress={() => {*/}
                                                 {/*        declineRequest(key)*/}
                                                 {/*    }}>*/}
                                                 {/*        <HStack alignItems="center">*/}
                                                 {/*            <Icon as={Ionicons} color="white" name="close"/>*/}
                                                 {/*        </HStack>*/}
                                                 {/*    </Button>*/}
                                                 {/*</HStack>*/}
                                             </VStack>
                                         </Box>

                                     )
                                 })
                                 }

                             </VStack>
                         }
                     </Modal.Body>
                 </Modal.Content>
             </Modal>

            {user.status === "driver_busy" && Object.keys(firebaseTripRequests).length > 0 &&
                <TouchableOpacity onPress={() => {
                    setShowPassengerRequestsModal(true)
                }}>
                    <Alert variant="solid" status="info" colorScheme="info">
                        <VStack>
                            <HStack space={3} alignItems="center">
                                <Alert.Icon mt="1" size={6}/>
                                <Text color="white">
                                    {Object.keys(firebaseTripRequests).length}{" "}
                                    New
                                    passenger {Object.keys(firebaseTripRequests).length > 1 ? "requests" : "request"}
                                </Text>
                                {/*<IconButton variant="unstyled" icon={<CloseIcon size="3"/>} onPress={() => {console.log("Alert closed");}}/>*/}
                            </HStack>
                        </VStack>
                    </Alert>
                </TouchableOpacity>
            }
        </>
    )
}

export default TripRequestsModal;