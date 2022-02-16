import {TypedUseSelectorHook, useDispatch, useSelector} from "react-redux";
import {AppDispatch, RootState} from "./store";
import {getDatabase, ref, set, onValue, child, push, update} from "firebase/database";
import {updateStatus} from "./reducers/user-reducer";


// redux typescript hooks
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;


// hooks 
export const createLocationObj = (key: string, type: string, typeTitle: string, coords: { lat: number, lng: number } = {lat: 0, lng: 0}) => {
    const id = type === "waypoint" ? key : type;

    return (
        {
             key: key,
             type: type,
             markerTitle: typeTitle,
             info: {
                coords: coords,
                isEntered: false
             },
             marker: {
                        key: id,
                        coordinate: {
                            latitude: coords.lat,
                            longitude: coords.lng,
                        },
                        title: typeTitle,
                        description: "",
                        identifier: id

                     }
        }
    )
}

// firebase
export function createFirebaseTrip(status, tripID, driverID) {

    if (status === "available") {
        const db = getDatabase();
        const reference = ref(db, `trips/${tripID}`)
        set(reference, {
            driverID: driverID,
            passengers: {},
        })

        return true;
    }

    return false;
}

export function storeTripRequest(tripID, passengerID) {
    const db = getDatabase();
    update(ref(db), {[`/trips/${tripID}/passengers/${passengerID}`]: {passengerId: passengerID}});
}

export function setupTripRequestListener(tripId) {
    const db = getDatabase();
    const reference = ref(db, `trips/${tripId}`);
    onValue(reference, (snapshot) => {
        console.log(snapshot);
    })
}
