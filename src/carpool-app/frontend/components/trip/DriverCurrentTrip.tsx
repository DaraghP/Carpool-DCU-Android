import {View} from "react-native";
import {Button, Heading, Text} from "native-base";
import {v4} from "uuid";
import {getDatabase, get, ref, remove, update} from "firebase/database";
import {removeFirebaseTrip, useAppDispatch, useAppSelector} from "../../hooks";
import {resetTripState} from "../../reducers/trips-reducer";
import {updateStatus} from "../../reducers/user-reducer";
import {useEffect} from "react";

function DriverCurrentTrip({isTripDeparted, setIsTripToDCU, setCampusSelected}) {
    const db = getDatabase();
    const dispatch = useAppDispatch();
    const trips = useAppSelector(state => state.trips);
    const user = useAppSelector(state => state.user);
    const backendURL = useAppSelector(state => state.globals.backendURL);

    // cancel
    const cancelTrip = () => {
        // console.log("Trip Cancelled.");

        // alert "are you sure" then delete from db
        fetch(`${backendURL}/remove_trip`, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Token ${user.token}`
            },
            body: JSON.stringify({})
        }).then(response => response.json().then(data => ({status: response.status, data: data})))
        .then(res => {
            // console.log(res);
            if (res.status === 200) {
                removeFirebaseTrip(trips.id, res.data.uids);
            }
            dispatch(updateStatus("available"));
        })
    }


    // end
    const endTrip = () => {
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
    }

    // useEffect(() => {

    //     console.log(trips.initialETA)
    //     console.log(trips.ETA)
    // }, [trips.initialETA, trips.ETA])

    const timedate = (date) => { 
        return `${new Date(date).toLocaleTimeString().slice(0, 5)} ${new Date(date).toLocaleDateString()}` 
    } //

    return (
             <View style={{padding: 10}}>
                  <Heading mb={2}>Current Trip</Heading>
                  <Heading size="md">From:</Heading>
                  <Text>{trips.locations.startingLocation.marker.description}</Text>
                  <Text>To: {trips.locations.destLocation.marker.description}</Text>
                  <Text>Departure Time:</Text>
                  <Text style={{fontWeight: "bold"}}>{timedate(trips.timeOfDeparture)}</Text>

                  <Text style={{fontWeight: "bold"}}>ETA: {timedate(trips.ETA)}</Text>
                  <Text>Passengers: {Object.keys(trips.passengers).map((passengerKey) => {
                      return (<Text fontWeight="bold" key={v4()}>{trips.passengers[passengerKey].passengerName}  </Text>)
                    })// 
                  }
                  </Text>

                  <Text>{trips.availableSeats} Empty seats</Text>

                  <Button>View Route</Button>


                 {isTripDeparted ?
                     <Button onPress={() => {
                         endTrip()
                     }}>
                         Trip Complete
                     </Button>
                     :
                     <>
                         <Button onPress={() => {
                            

                             update(ref(db, `/trips/${trips.id}`), {[`/status`]: "departed"}) 
                             get(ref(db, `/tripRequests/${trips.id}`)).then((snapshot) => { 
                                if (snapshot.val() !== null) {
                                    let passengerKeys = Object.keys(snapshot.val());
                                    passengerKeys.map((key) => {
                                        update(ref(db, `/users/`), {[`/${key}`]: {tripRequested: {tripID: trips.id, requestStatus: "declined", status: ""}}});
                                    }) // 
                                }
                                remove(ref(db, `/tripRequests/${trips.id}`)); 
                            })
                            
                         }}>
                             START Trip
                         </Button>
                         <Button colorScheme="red" onPress={() => {cancelTrip()}}>Cancel Trip</Button>
                     </>

                 }

             </View>
    )
}

export default DriverCurrentTrip;