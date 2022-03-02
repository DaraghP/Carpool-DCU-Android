import {
    StyleSheet,
    View,
    TouchableOpacity,
    StatusBar,
    TouchableWithoutFeedback,
} from "react-native";
import {
    Text,
    Heading,
    Button,
    Center,
    HStack,
    Box,
    Avatar,
    Icon,
    VStack,
    Divider,
    ScrollView,
    Modal,
    TextArea
} from "native-base";
import {updateUserDescription} from "../reducers/user-reducer";
import {updateRole} from "../reducers/trips-reducer";
import {useAppDispatch, useAppSelector} from "../hooks";
import Ionicons from '@expo/vector-icons/Ionicons';
import {useEffect, useState} from "react";
import Profile from "../components/user/Profile";
import ProfileModal from "../components/user/ProfileModal";
import {heightPercentageToDP, widthPercentageToDP} from "react-native-responsive-screen";

function HomeScreen({ navigation }) {
    const dispatch = useAppDispatch();
    const user = useAppSelector(state => state.user);
    const backendURL = useAppSelector(state => state.globals.backendURL);
    const [showUserModal, setShowUserModal] = useState(false);
    const [editDescription, setEditDescription] = useState(false);
    const [userDescriptionText, setUserDescriptionText] = useState("");
    const [profileData, setProfileData] = useState<object>({username: "", profile_description: "", first_name: ""});

    const getProfileDescription = (uid) => {
        fetch(`${backendURL}/get_profile_description`, {
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
                dispatch(updateUserDescription(res.data.profile_description));
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
        .then(response => response.json().then(data => ({status: response.status, data: data})))
        .then((res) => {
            if (res.status === 200) {
                dispatch(updateUserDescription(profileDescription));
            }
            setProfileData(res.data);
        })
    }

    const createPassenger = () => {
        fetch(`${backendURL}/create_passenger`, {
            method: "GET",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Token ${user.token}`
            },
        }).then(response => response.json())
        .then((res) => {
        if (!("errorType" in res)) {
            console.log("New Passenger created.");
        }
        else {
            console.log("Passenger Already Exists");
        }
        }).catch((e) => {
            console.error(e);
        });
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false} stickyHeaderIndices={[0]} keyboardShouldPersistTaps="always">
            <Profile uid={user.id} mode="bar" showPhoneNumber={true}/>

            <VStack space={0} zIndex={-1}>

                <Heading color="muted.100" marginX={2} padding={3} marginTop={5} size="lg" bg="muted.800">
                    Ready to Carpool {user.firstName}?
                </Heading>

                <Box mt="2" bg="white" padding={5} width={"95%"} alignSelf="center" shadow={2}>

                    <HStack space={1} alignItems="center">
                        <VStack width={"50%"}>
                            <Heading alignSelf="center" size="md" letterSpacing={widthPercentageToDP(0.3)}>Sharing a ride?</Heading>
                            <Divider mt="1"/>
                            <TouchableOpacity onPress={() => {
                                dispatch(updateRole("driver"));
                                navigation.navigate("Driver");
                            }}>

                                <Box bg="muted.800" mt="1" paddingY={200} alignItems="center">
                                    <Ionicons name="car-outline" size={80} color="white"/>
                                    <Heading style={{letterSpacing: widthPercentageToDP(0.5)}} color="white" textAlign="center">Driver</Heading>
                                </Box>
                            </TouchableOpacity>
                        </VStack>

                        <VStack width={"50%"}>
                            <Heading size="md" alignSelf="center" letterSpacing={widthPercentageToDP(0.1)}>Looking to ride?</Heading>
                            <Divider mt="1"/>
                            <TouchableOpacity onPress={() => {
                                createPassenger();
                                dispatch(updateRole("passenger"));
                                navigation.navigate("Passenger");
                            }}>

                                <Box bg="muted.700" mt="1" paddingY={200} alignItems="center">
                                     <Ionicons style={{textAlign: "center"}} name="body" size={80} color="white"/>
                                     <Heading style={{letterSpacing: 2.5}} color="white" textAlign="center">Passenger</Heading>
                               </Box>
                            </TouchableOpacity>
                        </VStack>
                    </HStack>
                </Box>

            </VStack>
            {/**/}
            {/* */}
            {/*<Modal isOpen={showUserModal} scrollEnabled={false} keyboardShouldPersistTaps="always" onClose={() => {setUserDescriptionText(""); setEditDescription(false); setShowUserModal(false)}}>*/}
            {/*    <Modal.Content marginY={"auto"}>*/}
            {/*        <Modal.Header bg="muted.900" alignItems="center">*/}
            {/*            <Avatar bg="muted.800" size="xl" alignItems="center" alignSelf="center">*/}
            {/*                <Icon size={50} color="white" as={Ionicons} name="person-outline"/>*/}
            {/*                <Avatar.Badge style={{width: 25, height: 25}} borderColor="muted.600" bg="green.300"/>*/}
            {/*            </Avatar>*/}

            {/*            <Modal.CloseButton/>*/}
            {/*        </Modal.Header>*/}
            {/*        <Modal.Body bg={"white"}>*/}

            {/*                <Heading size={"md"}>Profile</Heading>*/}

            {/*                <Divider my="4" shadow={1}/>*/}

            {/*                <HStack space={2} alignItems="center">*/}
            {/*                    <Heading size={"md"} mb={2}>Description</Heading>*/}
            {/*                    {editDescription &&*/}
            {/*                        <>*/}
            {/*                            <TouchableOpacity>*/}
            {/*                                <Icon as={Ionicons} name={"save"} size={5} mb={2} color={"blueGray.500"} onPress={() => {setProfileDescription(userDescriptionText); setEditDescription(false);}}/>*/}
            {/*                            </TouchableOpacity>*/}
            {/*                            <TouchableOpacity style={{flexDirection: "row", marginLeft: "auto"}} onPress={() => {setEditDescription(false)}}>*/}
            {/*                                <Icon as={Ionicons} name={"close"} size={6} mb={2}/>*/}
            {/*                            </TouchableOpacity>*/}
            {/*                        </>*/}

            {/*                    }*/}
            {/*                </HStack>*/}
            {/*                <Box borderBottomWidth={1} shadow={0.5}>*/}
            {/*                    <HStack mb={1} alignItems="center">*/}
            {/*                        {!editDescription ?*/}
            {/*                            <>*/}
            {/*                                <TouchableWithoutFeedback onPress={() => {setEditDescription(true)}}>*/}
            {/*                                    <Text width={"80%"}>{user.description !== "" ? user.description : "Tell us about yourself..."}</Text>*/}
            {/*                                </TouchableWithoutFeedback>*/}

            {/*                                <TouchableOpacity onPress={() => {setEditDescription(false);}} style={{marginTop: "auto", marginLeft: "auto"}}>*/}
            {/*                                    <Icon color="muted.500" size={6} as={Ionicons} name="create-outline"/>*/}
            {/*                                </TouchableOpacity>*/}
            {/*                            </>*/}
            {/*                            :*/}
            {/*                            <>*/}
            {/*                                <VStack mt={2} width={"100%"}>*/}

            {/*                                    <View>*/}
            {/*                                        <TextArea maxLength={1000} onChangeText={(text) => {console.log(text); setUserDescriptionText(text)}} placeholder={user.description !== "" ? user.description : "Tell us about yourself..."}/>*/}
            {/*                                    </View>*/}
            {/*                                </VStack>*/}
            {/*                            </>*/}


            {/*                        }*/}
            {/*                    </HStack>*/}
            {/*                </Box>*/}

            {/*        </Modal.Body>*/}

            {/*    </Modal.Content>*/}
            {/*</Modal>*/}
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      flexGrow: 1,
      height: heightPercentageToDP(100),
      width: widthPercentageToDP(100),
      marginTop: StatusBar.currentHeight
    }
  });

export default HomeScreen;