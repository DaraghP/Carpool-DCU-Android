import TripAlertModal from "./TripAlertModal";
import {updateStatus, updateUserState} from "../../reducers/user-reducer";
import {getDatabase, ref, update} from "firebase/database";
import {useAppDispatch, useAppSelector} from "../../hooks";
import {resetTripState} from "../../reducers/trips-reducer";

function TripScreenAlertModals({setIsResetAfterTripComplete, setHideMap}) {
    const db = getDatabase();
    const dispatch = useAppDispatch();
    const user = useAppSelector(state => state.user);
    const trips = useAppSelector(state => state.trips);


    return (
        <>
            {trips.role === "passenger" && user.tripRequestStatus === "accepted" && user.tripStatus === "in_trip" &&
                <TripAlertModal
                    headerText="Trip Alert"
                    bodyText="Your trip request has been accepted"
                    btnAction={{
                        action: () => {
                            dispatch(updateUserState({tripRequestStatus: ""}));
                            update(ref(db, `/users/`), {[`/${user.id}`]: {tripRequested: {tripID: trips.id, requestStatus: "", status: "in_trip"}}});
                            setHideMap(false);
                        },
                        text: "OK"
                    }}
                />
            }


            {trips.role === "passenger" && user.tripRequestStatus === "declined" &&
              <>
                  <TripAlertModal
                      headerText="Trip Alert"
                      bodyText={`Your request has been declined by Driver.\nTry request a different trip.`}
                      btnAction={{
                          action: () => {
                            update(ref(db, `/users/`), {[`/${user.id}`]: {tripRequested: null}});
                            dispatch(updateStatus("available"))
                          },
                          text: "OK"
                      }}
                  />
              </>
            }

            {user.tripStatus == "trip_complete" &&
                <TripAlertModal
                  headerText="Trip Alert"
                  bodyText="Your previous trip has ended"
                  btnAction={{
                      action: () => {
                        dispatch(updateUserState({status: "available", tripStatus: ""}));
                        dispatch(resetTripState());
                        update(ref(db, `/users/`), {[`/${user.id}`]: {tripRequested: null}});
                        setIsResetAfterTripComplete(false);
                      },
                      text: "OK"
                  }}
                />
            }

        </>
    )
}

export default TripScreenAlertModals;