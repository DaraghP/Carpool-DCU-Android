import {Alert, TouchableOpacity, TouchableWithoutFeedback, View} from "react-native"
import {Text, Button, HStack, VStack, Heading, Input, Icon, Box, FormControl} from "native-base";
import {updateUserState} from "../reducers/user-reducer";
import {useAppDispatch, useAppSelector} from "../hooks";
import TripAlertModal from "../components/trip/TripAlertModal";
import {useEffect, useRef, useState} from "react";
import Ionicons from "@expo/vector-icons/Ionicons";

function AccountScreen({ navigation }) {
    const dispatch = useAppDispatch();
    const user = useAppSelector(state => state.user);
    const backendURL = useAppSelector(state => state.globals.backendURL);
    const [showRestrictedModal, setShowRestrictedModal] = useState(false)
    const mounted = useRef(true);
    const phoneNoInput = useRef("");
    const [phoneNoText, setPhoneNoText] = useState("");
    const [errorType, setErrorType] = useState("");
    const [showPhoneInput, setShowPhoneInput] = useState(false);

    const [updatedNumber, setUpdatedNumber] = useState<boolean | undefined>(undefined);

    const restrictedAccountsForUserTesting = new Set([2, 3, 4]);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        }
      }, [])

    const deleteAlert = () => {
        Alert.alert(
            "Delete Account",
            "Are you sure you want to delete your account?\n\nThere is no way of getting back your account if you do so.",
            [
                {
                    text: "Delete",
                    onPress: () => {deleteAccount()}
                },
                {
                    text: "Cancel",
                }
            ],
            {
                cancelable: true
            }

        )
    }

    const deleteAccount = () => {
        fetch(`${backendURL}/delete`, {
            method: "GET",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Token ${user.token}`
            },
            body: null
        }).then(response => ({ status: response.status }))
          .then((data) => {
            if (data.status === 200) {
                // navigates back to Login screen once token is an empty string (see App.tsx)
                dispatch(updateUserState({username: "", token: ""}));
            }
          }).catch((e) => {
              console.error(e);
          });
    }

    const updatePhoneNumber = () => {
        console.log(phoneNoText)
        fetch(`${backendURL}/update_phone`, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Token ${user.token}`,
            },
            body: JSON.stringify({phoneNumber: phoneNoText})
        }).then(response => response.json())
            .then((res) => {
                console.log("request completed")
                if ("phone_number" in res) {

                    if (mounted.current) {
                        dispatch(updateUserState({phoneNumber: phoneNoText}));
                    }

                    setErrorType("");
                } else {
                    console.log("phone")
                    setErrorType("phone");
                }
            }).catch((e) => {
                console.error(e);
            });
    }

    return (
        <View>
            <VStack p={5} ml={5}>
                <Heading>First Name</Heading>
                <Text>{user.firstName}</Text>
            </VStack>

            <VStack pl={5} p={2} ml={5}>
                <Heading>Last Name</Heading>
                <Text>{user.lastName}</Text>
            </VStack>

            <VStack p={5} ml={5}>
                <HStack flexDirection="row" alignItems="center">
                    <Heading>Phone Number</Heading>
                    <HStack ml="auto">
                        {showPhoneInput &&
                            <HStack space={2}>
                                <TouchableOpacity onPress={() => {setShowPhoneInput(false); setErrorType(""); setUpdatedNumber(false);}}>
                                    <Icon as={Ionicons} name={"close"} size={6}/>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => {updatePhoneNumber(); setShowPhoneInput(false); setUpdatedNumber(true)}}>
                                    <Icon as={Ionicons} name={"save"} size={6} color={"blueGray.500"}/>
                                </TouchableOpacity>
                            </HStack>
                        }

                    </HStack>
                </HStack>
                <Box borderBottomWidth={1}>
                    {showPhoneInput
                        ?
                        <FormControl isInvalid={errorType === "phone"}>
                             <Input mt={2} placeholder="Enter your new phone number" ref={phoneNoInput} onChangeText={(text: string) => {setPhoneNoText(text)}}/>
                             <FormControl.ErrorMessage>Please enter a valid Irish phone number.</FormControl.ErrorMessage>
                        </FormControl>

                        :
                        <TouchableWithoutFeedback onPress={() => {setShowPhoneInput(true)}}>
                            <View>
                                {updatedNumber ?
                                    <Text mt={2} style={errorType==="phone" ? {color:"red"} : {color:"green"}}>{errorType==="phone" ? "Error! Please enter a valid Irish phone number." : `Phone number updated : ${user.phoneNumber}` }</Text>
                                : <Text mt={2}>{user.phoneNumber}</Text>
                                }
                            </View>

                        </TouchableWithoutFeedback>
                    }
                </Box>
            </VStack>

            <Text alignSelf="center">{'\n'} Date Created: {user.dateCreated}{'\n'}</Text>
            <Button width="80%" alignSelf="center" bg={"red.500"} onPress={() => {
                {!(restrictedAccountsForUserTesting.has(user.id)) ?
                    deleteAlert()
                : setShowRestrictedModal(true)
                }
            }}>
                Delete Account
            </Button>

            {showRestrictedModal &&
                <TripAlertModal
                    headerText={"Unable to delete account."}
                    bodyText={"This account was created for user testing."}
                    btnAction={{action: () => {setShowRestrictedModal(false)}, text: "OK"}}
                />
            }

            {showRestrictedModal &&
                <TripAlertModal
                    headerText={"Error."}
                    bodyText={"Please enter a valid Irish phone number."}
                    btnAction={{action: () => {setShowRestrictedModal(false)}, text: "OK"}}
                />
            }
        </View>
    )
}

export default AccountScreen;
