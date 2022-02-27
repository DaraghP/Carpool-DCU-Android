import {Box, Button, Heading, Text} from "native-base";
import {getDatabase, ref, remove, update} from "firebase/database";
import {updateUserState} from "../../reducers/user-reducer";
import {updateTripState} from "../../reducers/trips-reducer";
import {useAppDispatch, useAppSelector} from "../../hooks";
import {View} from "react-native";

function PassengerCancelRequestButton({setPreviousTripID}) {
    const db = getDatabase();
    const dispatch = useAppDispatch();
    const trips = useAppSelector(state => state.trips);
    const user = useAppSelector(state => state.user);


    return (
        (trips.role === "passenger" && user.tripRequestStatus === "waiting" ?
          <View>
            <Box padding="5">
                <Heading size="md" alignSelf="center" mt="3">Awaiting Response from Driver </Heading>
                <Button
                        width="50%"
                        alignSelf="center"
                        mt="2"
                        onPress={() => {
                            remove(ref(db, `/tripRequests/${trips.id}/${user.id}`));
                            update(ref(db, `/users/`), {[`/${user.id}`]: {tripRequested: null}})
                            dispatch(updateUserState({tripRequestStatus: "", status: "available"}));
                            setPreviousTripID(trips.id);
                            dispatch(updateTripState({id: null}))
                        }}
                >
                    Cancel Request
                </Button>
            </Box>
          </View>
        : null)
    )
}

export default PassengerCancelRequestButton;