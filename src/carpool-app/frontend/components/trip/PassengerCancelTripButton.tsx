import {Heading, Text, Button} from "native-base";
import {View} from "react-native";
import {updateUserState} from "../../reducers/user-reducer";
import {resetTripState} from "../../reducers/trips-reducer";
import {useAppDispatch, useAppSelector} from "../../hooks";
import {getDatabase, ref, remove, update} from "firebase/database";
import {v4} from "uuid";


function PassengerCancelTripButton({filteredTrips, setIsTripToDCU, setCampusSelected}) {
    const db = getDatabase();
    const dispatch = useAppDispatch();
    const backendURL = useAppSelector(state => state.globals.backendURL);
    const user = useAppSelector(state => state.user);
    const trips = useAppSelector(state => state.trips);//


    const passengerCancelTrip = async (availableSeats) => {
        await remove(ref(db, `/users/${user.id}`));//
        await remove(ref(db, `/trips/${trips.id}/passengers/${user.id}`));
        await update(ref(db, `/trips/${trips.id}`), {["/availableSeats"]: availableSeats})
    }

    return (
        (trips.role === "passenger" && user.tripRequestStatus === "" && user.tripStatus === "in_trip" && !filteredTrips.has(trips.id) ?
            <View>

                <Heading mb={2}>Current Trip</Heading>
                <Text>From: {trips.locations.startingLocation.marker.description}</Text>
                <Text>To: {trips.locations.destLocation.marker.description}</Text>
                <Text>Departure Time:</Text>
                <Text style={{fontWeight: "bold"}}>{new Date(trips.timeOfDeparture).toLocaleTimeString().slice(0, 5)} {new Date(trips.timeOfDeparture).toLocaleDateString()}</Text>

                <Text>ETA: {trips.ETA}</Text>{/* timeofDeparture + duration*/}
                <Text>Passengers: {Object.keys(trips.passengers).map((passengerKey) => {
                    return (<Text fontWeight="bold" key={v4()}>{trips.passengers[passengerKey].passengerName}  </Text>)
                })
                }
                </Text>

                <Text>{trips.availableSeats} Empty seats</Text>

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
                            dispatch(updateUserState({status: "available", tripStatus: "", tripRequestStatus: ""}));
                            passengerCancelTrip(res.available_seats).then(() => {
                                dispatch(resetTripState())
                                setIsTripToDCU(undefined);
                                setCampusSelected("");
                            })
                        }
                        else {
                            console.log(res.errorType, res.errorMessage);
                        }
                    })
                }}>
                    Cancel Trip
                </Button>
            </View>
        : null)

    )
}

export default PassengerCancelTripButton;