import {Avatar, Box, Button, Heading, HStack, Icon, Text, VStack} from "native-base";
import {TouchableOpacity} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import {useEffect} from "react";
import ProfileIcon from "./ProfileIcon";
import {updateUserState} from "../../reducers/user-reducer";
import {resetTripState} from "../../reducers/trips-reducer";
import {showNumberOfSeatsAndTimePicker, showWaypoints} from "../../reducers/collapsibles-reducer";
import {useAppDispatch, useAppSelector} from "../../hooks";

function ProfileBar({showUserModal, setShowUserModal, profileData, logoutBtn}) {
    const dispatch = useAppDispatch();
    const backendURL = useAppSelector(state => state.globals.backendURL);
    const user = useAppSelector(state => state.user);

    const logout = () => {
        fetch(`${backendURL}/logout`, {
            method: "GET",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Token ${user.token}`
            },
            body: null
        }).then(response => ({ status: response.status }))
          .then((data) => {
            if (data.status === 200 || data.status === 401) {
                // navigates back to Login screen once token is an empty string (see App.tsx)
                dispatch(updateUserState({username: "", token: "", status: "available", tripRequestStatus: "", tripStatus: ""}));
                dispatch(resetTripState());
                dispatch(showWaypoints(false));
                dispatch(showNumberOfSeatsAndTimePicker(false));
            }
          }).catch((e) => {
              console.error(e);
          });
    }
    //
    return (
        <Box padding="5" bg="muted.100" borderBottomWidth={1} borderBottomColor={"muted.500"}>
            <HStack space={3} alignItems="center">
                <ProfileIcon setShowUserModal={(value) => {setShowUserModal(value)}}/>
                <VStack paddingRight={5} marginRight={5}>
                    <HStack space={1} alignItems="center">
                        <Heading size="md">{profileData?.username}</Heading>

                        <HStack alignItems="center">

                            <TouchableOpacity onPress={() => {setShowUserModal(true)}}>
                                <Icon color="muted.500" size={6} as={Ionicons} name="create-outline"/>
                            </TouchableOpacity>

                        </HStack>
                    </HStack>

                    <Text color="muted.600" paddingRight={5} numberOfLines={2}>{profileData?.profile_description !== "" ? profileData?.profile_description : "Tell us about yourself..."}</Text>
                </VStack>
                <TouchableOpacity onPress={() => {logout()}}>
                    <Box rounded={20} bg="red.500" flexDirection={"row"} justifyContent="flex-end" ml={"auto"} p={1}>Logout</Box>
                </TouchableOpacity>
            </HStack>

        </Box>
    )
}

export default ProfileBar;