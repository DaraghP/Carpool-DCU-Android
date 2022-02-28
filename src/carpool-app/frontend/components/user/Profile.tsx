import {Avatar, Box, Divider, Heading, HStack, Icon, Modal, Text, TextArea, VStack} from "native-base";
import Ionicons from "@expo/vector-icons/Ionicons";
import {TouchableOpacity, TouchableWithoutFeedback, View} from "react-native";
import {useEffect, useState} from "react";
import {updateUserDescription} from "../../reducers/user-reducer";
import {getProfile, setProfileDescription, useAppDispatch, useAppSelector} from "../../hooks";

function Profile({uid}) {
    const dispatch = useAppDispatch();
    const user = useAppSelector(state => state.user);
    const backendURL = useAppSelector(state => state.globals.backendURL);

    const [profileData, setProfileData] = useState<object>({username: "", profile_description: "", first_name: ""});
    const [showUserModal, setShowUserModal] = useState(false);
    const [editDescription, setEditDescription] = useState(false);
    const [userDescriptionText, setUserDescriptionText] = useState("");

    const getProfile = (uid) => {
        fetch(`${backendURL}/get_profile`, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Token ${user.token}`
            },
            body: JSON.stringify({uid: uid})
        }).then(response => response.json().then(data => ({status: response.status, data: data})))
        .then((res) => {
            if (res.status === 200) {
                if (user.id === uid) {
                    dispatch(updateUserDescription(res.data.profile_description));
                }
                console.log(res.data)
                setProfileData(res.data);
            }
        })
    }

    const setProfileDescription = (profileDescription) => {
        fetch(`${backendURL}/set_profile_description`, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Token ${user.token}`
            },
            body: JSON.stringify({profileDescription: profileDescription})
        })
        .then(response => {return {status: response.status}})
        .then((res) => {
            if (res.status === 200) {
                dispatch(updateUserDescription(profileDescription));
                setProfileData({...profileData, profile_description: profileDescription});
                console.log(res.status, profileDescription)
            }
        })
    }

    useEffect(() => {
        getProfile(uid);
    }, [])

    return (
        <>
            <Box padding="5" bg="muted.100" borderBottomWidth={1} borderBottomColor={"muted.500"}>
                <HStack space={3} alignItems="center">
                    <TouchableOpacity onPress={() => {setShowUserModal(true)}}>
                        <Avatar bg="muted.800" size="md">
                            <Icon color="white" as={Ionicons} name="person-outline"/>
                            <Avatar.Badge borderColor="muted.600" bg="green.300"/>
                        </Avatar>
                    </TouchableOpacity>
                    <VStack paddingRight={5} marginRight={5}>
                        <HStack space={1}>
                            {/**/}
                            <Heading size="md">{profileData?.username}</Heading>

                            <TouchableOpacity onPress={() => {setShowUserModal(true)}}>
                                <Icon color="muted.500" size={6} as={Ionicons} name="create-outline"/>
                            </TouchableOpacity>
                        </HStack>
                        <Text color="muted.600" paddingRight={5} numberOfLines={2}>{profileData?.profile_description !== "" ? profileData?.profile_description : "Tell us about yourself..."}</Text>
                    </VStack>
                </HStack>

            </Box>

            <Modal isOpen={showUserModal} scrollEnabled={false} keyboardShouldPersistTaps="always" onClose={() => {setUserDescriptionText(""); setEditDescription(false); setShowUserModal(false)}}>
                <Modal.Content marginY={"auto"}>
                    <Modal.Header bg="muted.900" alignItems="center">
                        <Avatar bg="muted.800" size="xl" alignItems="center" alignSelf="center">
                            <Icon size={50} color="white" as={Ionicons} name="person-outline"/>
                            <Avatar.Badge style={{width: 25, height: 25}} borderColor="muted.600" bg="green.300"/>
                        </Avatar>

                        <Modal.CloseButton/>
                    </Modal.Header>
                    <Modal.Body bg={"white"}>

                            <Heading size={"md"}>Profile</Heading>

                            <Divider my="4" shadow={1}/>

                            <HStack space={2} alignItems="center">
                                <Heading size={"md"} mb={2}>Description</Heading>
                                {editDescription &&
                                    <>
                                        <TouchableOpacity>
                                            <Icon as={Ionicons} name={"save"} size={5} mb={2} color={"blueGray.500"} onPress={() => {setProfileDescription(userDescriptionText); setEditDescription(false);}}/>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={{flexDirection: "row", marginLeft: "auto"}} onPress={() => {setEditDescription(false)}}>
                                            <Icon as={Ionicons} name={"close"} size={6} mb={2}/>
                                        </TouchableOpacity>
                                    </>

                                }
                            </HStack>
                            <Box borderBottomWidth={1} shadow={0.5}>
                                <HStack mb={1} alignItems="center">
                                    {!editDescription ?
                                        <>
                                            <TouchableWithoutFeedback onPress={() => {setEditDescription(true)}}>
                                                <Text width={"80%"}>{profileData.profile_description !== "" ? profileData.profile_description : "Tell us about yourself..."}</Text>
                                            </TouchableWithoutFeedback>

                                            <TouchableOpacity onPress={() => {setEditDescription(false);}} style={{marginTop: "auto", marginLeft: "auto"}}>
                                                <Icon color="muted.500" size={6} as={Ionicons} name="create-outline"/>
                                            </TouchableOpacity>
                                        </>
                                        :
                                        <>
                                            <VStack mt={2} width={"100%"}>
                                                <View>
                                                    <TextArea maxLength={1000} onChangeText={(text) => {console.log(text); setUserDescriptionText(text)}} placeholder={profileData.profile_description !== "" ? profileData.profile_description : "Tell us about yourself..."}/>
                                                </View>
                                            </VStack>
                                        </>

                                    // should log trips.route from driverCurrentTrip whenever passenger/joins/leaves
                                    }
                                </HStack>
                            </Box>

                    </Modal.Body>

                </Modal.Content>
            </Modal>
        </>
    )
}

export default Profile;