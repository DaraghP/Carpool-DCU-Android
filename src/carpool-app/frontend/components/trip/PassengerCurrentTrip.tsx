import {Heading, Text, Button, HStack, VStack} from "native-base";
import {View} from "react-native";
import {updateUserState} from "../../reducers/user-reducer";
import {resetTripState} from "../../reducers/trips-reducer";
import {removeFirebaseTrip, useAppDispatch, useAppSelector} from "../../hooks";
import {get, getDatabase, ref, remove, update} from "firebase/database";
import {v4} from "uuid";
import {useEffect} from "react";


function PassengerCurrentTrip({isTripToDCU, filteredTrips, setIsTripToDCU, setCampusSelected, isTripDeparted}) {
    const db = getDatabase();
    const dispatch = useAppDispatch();
    const backendURL = useAppSelector(state => state.globals.backendURL);
    const user = useAppSelector(state => state.user);
    const trips = useAppSelector(state => state.trips);


    const passengerCancelTrip = async (availableSeats) => {
        await remove(ref(db, `/users/${user.id}`));
        await remove(ref(db, `/trips/${trips.id}/passengers/${user.id}`));
        await update(ref(db, `/trips/${trips.id}`), {["/availableSeats"]: availableSeats})
    }


    useEffect(() => {
        if (isTripDeparted) {
            const interval = setInterval(() => {
                let date = new Date();
                date.setMinutes(date.getMinutes() - 60)
                let msecETA = Date.parse(trips.ETA.toString())
                let msecNow = Date.parse(date.toString())
                console.log(new Date(msecETA), "     ", new Date(msecNow))
                if (msecNow > msecETA) {
                    console.log("Trip auto-completed due to ETA passing.", trips.role)
                    fetch(`${backendURL}/end_trip`, {
                        method: "POST",
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'Authorization': `Token ${user.token}`
                        },
                        body: JSON.stringify({tripID: trips.id})
                    }).then(response => response.json())
                    .then(res => {
                        if (!("errorType" in res)) {
                            console.log("Driver ended trip");
                            removeFirebaseTrip(trips.id, res.uids);
                        }
                        else {
                            console.log(res.errorType, res.errorMessage);
                        }
                    })
                    clearInterval(interval);
                }
            }, 60000*5)
            return () => {
                console.log("cleared")
                clearInterval(interval);
            }
        }

    }, [isTripDeparted])

    return (
        (trips.role === "passenger" && user.tripRequestStatus === "" && user.tripStatus === "in_trip" && !filteredTrips.has(trips.id) ?
            <View>

                <Heading mb={2}>Current Trip</Heading>
                <Text>From: {trips.passengerStartLoc}</Text>
                <Text>To: {trips.passengerDestLoc}</Text>
                <HStack space={"auto"}>
                    <VStack>
                        <Text>Departure Time:</Text>
                        <Text
                            style={{fontWeight: "bold"}}>{new Date(trips.passengerDepartureTime).toLocaleTimeString().slice(0, 5)} {new Date(trips.passengerDepartureTime).toLocaleDateString()}</Text>
                    </VStack>
                    
                    <VStack style={{
                        flexDirection: "row",
                        marginLeft: "auto",
                        justifyContent: "flex-end",
                        alignSelf: "flex-end" 
                    }}>

                        <Text>Arrival Time:</Text>
                        <Text>{new Date(trips.passengerArrivalTime).toLocaleTimeString().slice(0, 5)}</Text>
                    </VStack>
                </HStack>

                <Text>Passengers: {Object.keys(trips.passengers).map((passengerKey) => {
                        return (<Text fontWeight="bold" key={v4()}>{trips.passengers[passengerKey].passengerName}  </Text>);
                    })
                    }
                </Text>

                <Text>{trips.availableSeats} Empty seats</Text>

                {!isTripDeparted ?
                    <Button onPress={() => {
                        fetch(`${backendURL}/passenger_leave_trip`, {
                            method: "GET",
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json',
                                'Authorization': `Token ${user.token}`
                            },
                        }).then(response => response.json())
                            .then(res => {
                                if (!("errorType" in res)) {
                                    dispatch(updateUserState({
                                        status: "available",
                                        tripStatus: "",
                                        tripRequestStatus: ""
                                    }));
                                    passengerCancelTrip(res.available_seats).then(() => {
                                        dispatch(resetTripState())
                                        setIsTripToDCU(undefined);
                                        setCampusSelected("");
                                    })
                                } else {
                                    console.log(res.errorType, res.errorMessage);
                                }
                            })
                    }}>
                        Cancel Trip
                    </Button>
                    :
                    <Text>Driver has departed</Text>
                }
            </View>
        : null)

    )
}

export default PassengerCurrentTrip;