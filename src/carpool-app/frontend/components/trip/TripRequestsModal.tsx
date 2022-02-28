import {TouchableOpacity} from "react-native";
import {Alert, Button, Flex, HStack, Modal, Text, VStack} from "native-base";
import {v4} from "uuid";
import {useEffect, useState} from "react";
import {acceptTripRequest, createLocationObj, declineTripRequest, useAppDispatch, useAppSelector} from "../../hooks";
import {updateTripState} from "../../reducers/trips-reducer";
import {getDatabase, off, onValue, ref, set} from "firebase/database";

function TripRequestsModal({firebaseTripRequests, previousTripID, setPreviousTripID}) {
    const db = getDatabase();
    const dispatch = useAppDispatch();
    const trips = useAppSelector(state => state.trips);
    const user = useAppSelector(state => state.user);
    const backendURL = useAppSelector(state => state.globals.backendURL);

    const [showPassengerRequestsModal, setShowPassengerRequestsModal] = useState(false);

    const acceptRequest = (passengerID) => {
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
                acceptTripRequest(trips.id, res.trip_data["available_seats"], firebaseTripRequests[passengerID]);
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
            <Modal isOpen={showPassengerRequestsModal} onClose={() => {setShowPassengerRequestsModal(false)}}>
                 <Modal.Content size="sm">
                     <Modal.CloseButton/>
                     <Modal.Header>Requests</Modal.Header>
                     <Modal.Body>
                        <VStack>

                            {Object.keys(firebaseTripRequests).map((key, index) => {
                                    return (
                                        <TouchableOpacity key={v4()}>
                                            <Flex key={v4()} direction="row" wrap="wrap">
                                                <Text ml="5">{firebaseTripRequests[key].name}</Text>
                                                <Button onPress={() => {
                                                    acceptRequest(key)
                                                }}>
                                                    Accept
                                                </Button>
                                                <Button onPress={() => {
                                                    declineRequest(key)
                                                }}>
                                                    Decline
                                                </Button>
                                            </Flex>

                                        </TouchableOpacity>
                                    )
                                })
                            }
                        </VStack>

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