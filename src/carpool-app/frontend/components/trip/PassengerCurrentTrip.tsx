import {Heading, Text, Button, Box, HStack, VStack} from "native-base";
import {View, Linking, TouchableOpacity} from "react-native";
import {updateUserState} from "../../reducers/user-reducer";
import {resetTripState} from "../../reducers/trips-reducer";
import {removeFirebaseTrip, useAppDispatch, useAppSelector, timedate} from "../../hooks";
import {get, getDatabase, ref, remove, update} from "firebase/database";
import {v4} from "uuid";
import {useEffect, useState} from "react";
import TripAlertModal from "./TripAlertModal";
import Profile from "../user/Profile";
import TripPassengers from "./TripPassengers";


function PassengerCurrentTrip({isTripToDCU, filteredTrips, setIsTripToDCU, setCampusSelected, isTripDeparted}) {
    const db = getDatabase();
    const dispatch = useAppDispatch();
    const backendURL = useAppSelector(state => state.globals.backendURL);
    const user = useAppSelector(state => state.user);
    const trips = useAppSelector(state => state.trips);
    const [isLeaveTripPressed, setIsLeaveTripPressed] = useState(false);

    const dcuCampuses = {
        "Dublin City University, Collins Ave Ext, Whitehall, Dublin 9": "DCU Glasnevin",
        "DCU St Patrick's Campus, Drumcondra Road Upper, Drumcondra, Dublin 9, Ireland": "DCU St.Pat's"
    };

    const passengerCancelTrip = async (availableSeats) => {
        await remove(ref(db, `/users/${user.id}`));
        await remove(ref(db, `/trips/${trips.id}/passengers/${user.id}`));
        await update(ref(db, `/trips/${trips.id}`), {["/availableSeats"]: availableSeats})
    }

    const leaveTrip = () => {
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
            <View style={{backgroundColor: "grey"}}>
              <Box mb={2}>

                <Heading color="muted.100" marginX={0} padding={3}  size="lg" bg="muted.800">{trips.driverName}'s Trip</Heading>

                <Box marginX={3} mt={2} mb={2}>
                    <HStack>
                        <Text color="white" bold fontSize="lg">From: {" "}</Text>
                        <Text color="white" fontSize="lg">{trips.passengerStartLoc in dcuCampuses ? dcuCampuses[trips.passengerStartLoc] : trips.passengerStartLoc}</Text>
                    </HStack>
                    <HStack>
                        <Text color="white" bold fontSize="lg">To: {"      "}</Text>
                        <Text color="white" fontSize="lg">{trips.passengerDestLoc in dcuCampuses ? dcuCampuses[trips.passengerDestLoc] : trips.passengerDestLoc}</Text>
                    </HStack>
                </Box>

                <View style={{borderBottomColor: 'white', borderBottomWidth: 0.5}}/>


                <Box mt={2} bg="blue" marginX={3} mb={2}>
                    <HStack space={"30%"}>
                        <VStack>
                            <Text color="white">Departure Time:</Text>
                            <Text color="white" bold>{timedate(trips.passengerDepartureTime)}</Text>
                        </VStack>
                        <VStack>
                            <Text color="white">Estimated Arrival Time:</Text>
                            <Text color="white" bold>{new Date(trips.passengerArrivalTime).toLocaleTimeString().slice(0, 5)}</Text>
                        </VStack>
                    </HStack>

                </Box>

                <View style={{borderBottomColor: 'white', borderBottomWidth: 0.5}}/>

                <Box m={3}>
                    <TripPassengers passengers={trips.passengers}/>
                </Box>
                <Text marginX={3} color="white">{trips.availableSeats} Available seats</Text>
              </Box>

              <View style={{borderBottomColor: 'white', borderBottomWidth: 0.5}}/>

              <Box marginX={3} marginY={2}>
                  <HStack>
                      <Text color="white">Driver's Phone No:{"   "}</Text>
                      <Text color="white" bold selectable={true}>{trips.driverPhone}</Text>
                  </HStack>
                <Text color="white">Driver's Car:{"    "}{trips.car["colour"]} {trips.car["make"]} {trips.car["model"]}</Text>
              </Box>

                {!isTripDeparted ?
                    <Button colorScheme="red" size="lg" onPress={() => {
                        setIsLeaveTripPressed(true);
                        }}
                    >
                        Leave Trip
                    </Button>
                    :
                    <Text>Driver has departed</Text>
                }

                {isLeaveTripPressed &&
                    <TripAlertModal
                        headerText="Are you sure you want to leave this trip?"
                        bodyText="Click YES to leave trip."
                        btnAction={{
                            action: () => {
                                leaveTrip()
                            },
                            text: "Yes"
                        }}
                        otherBtnAction={{
                            action: () => {
                                setIsLeaveTripPressed(false)
                            },
                            text: "No"
                        }}
                    />
                }

            </View>
        : null)

    )
}

export default PassengerCurrentTrip;