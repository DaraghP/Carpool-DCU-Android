import {Button} from "native-base";
import {updateUserState} from "../../reducers/user-reducer";
import {resetTripState} from "../../reducers/trips-reducer";
import {useAppDispatch, useAppSelector} from "../../hooks";
import {getDatabase, ref, remove, update} from "firebase/database";

function PassengerCancelTripButton({filteredTrips, setIsTripToDCU, setCampusSelected}) {
    const db = getDatabase();
    const dispatch = useAppDispatch();
    const backendURL = useAppSelector(state => state.globals.backendURL);
    const user = useAppSelector(state => state.user);
    const trips = useAppSelector(state => state.trips);


    const passengerCancelTrip = async (availableSeats) => {
        await remove(ref(db, `/users/${user.id}`));//
        await remove(ref(db, `/trips/${trips.id}/passengers/${user.id}`));
        await update(ref(db, `/trips/${trips.id}`), {["/availableSeats"]: availableSeats})
    }

    return (
        (trips.role === "passenger" && user.tripRequestStatus === "" && user.tripStatus === "in_trip" && !filteredTrips.has(trips.id) ?
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
                            setIsTripToDCU(undefined); // its possible either way
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
        : null)

    )
}

export default PassengerCancelTripButton;