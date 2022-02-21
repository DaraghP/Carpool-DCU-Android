import {TypedUseSelectorHook, useDispatch, useSelector} from "react-redux";
import {AppDispatch, RootState} from "./store";
import {getDatabase, ref, set, onValue, remove, update} from "firebase/database";


// redux typescript hooks
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;


// hooks 
export const createLocationObj = (key: string, type: string, typeTitle: string, coords: { lat: number, lng: number } = {lat: 0, lng: 0}, name: any = false, isEntered: boolean = false) => {
    const id = type === "waypoint" ? key : type;

    return (
        {
             key: key,
             type: type,
             markerTitle: typeTitle,
             info: {
                coords: coords,
                isEntered: isEntered
             },
             marker: {
                        key: id,
                        coordinate: {
                            latitude: coords.lat,
                            longitude: coords.lng,
                        },
                        title: typeTitle,
                        description: name !== false ? name : "",
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
            status: "waiting",
            driverID: driverID,
            passengers: {},
        })
        return true;
    }

    return false;
}

export function removeFirebaseTrip(status, tripID) {
    if (status !== "available") {
        const db = getDatabase();
        const reference = ref(db, `trips/${tripID}`);
        remove(reference);
    }
}

export function storeTripRequest(tripID, passengerData) {
    const db = getDatabase();
    update(ref(db, `/tripRequests/${tripID}/`), {[`/${passengerData.passengerID}`]: {...passengerData}});
    update(ref(db, `/users/`) , {[`/${passengerData.passengerID}`]: {tripRequested: {tripID: tripID, status: "waiting"}}});
}

export function acceptTripRequest(tripID, passengerData) {
    const db = getDatabase();
    // update(ref(db, `/tripRequests/${tripID}/`), {[`/${passengerData.passengerID}`]: {...passengerData, status: "accepted"}});
    update(ref(db, `/trips/${tripID}/passengers/`), {[`/${passengerData.passengerID}`]: {passengerId: passengerData.passengerID}});
    remove(ref(db, `/tripRequests/${tripID}/${passengerData.passengerID}`));
    update(ref(db, `/users/`) , {[`/${passengerData.passengerID}`]: {tripRequested: {tripID: tripID, status: "accepted"}}})
}

export function setupTripRequestListener(tripId) {
    const db = getDatabase();
    const reference = ref(db, `/tripRequests/${tripId}`);
    onValue(reference, (snapshot) => {
        console.log(snapshot);
    })
}
