import {SafeAreaView, ScrollView, StyleSheet, Text, View} from "react-native";
import {Stack, Button, Center, FormControl, Heading, Input} from "native-base";
import {useRef, useEffect, useState} from "react";
import {updateUserState} from "../reducers/user-reducer";
import {useAppDispatch, useAppSelector} from "../hooks";

function RegisterScreen({ navigation }) {
  const dispatch = useAppDispatch();
  const mounted = useRef(true);
  const user = useAppSelector(state => state.user);
  const backendURL = useAppSelector(state => state.globals.backendURL);

  const firstNameInput = useRef("");
  const surnameInput = useRef("");
  const phoneNoInput = useRef("");
  const usernameInput = useRef("");
  const passwordInput = useRef("");
  const reEnterPasswordInput = useRef("");
  const [firstNameText, setFirstNameText] = useState("");
  const [surnameText, setSurnameText] = useState("");
  const [phoneNoText, setPhoneNoText] = useState("");
  const [usernameText, setUsernameText] = useState("");
  const [passwordText, setPasswordText] = useState("");
  const [reEnteredPasswordText, setReEnteredPasswordText] = useState("");
  const [errorType, setErrorType] = useState("");
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    return () => {
        mounted.current = false;
    }
  }, [])

  const register = () => {
      fetch(`${backendURL}/register`, {
      method: "POST",
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({first_name: firstNameText, last_name: surnameText, phone_no:phoneNoText, username: usernameText, password: passwordText, reEnteredPassword: reEnteredPasswordText})
    }).then(response => response.json())
    .then((res) => {    
        if (!("errorType" in res)) {
            firstNameInput.current.clear();
            surnameInput.current.clear();
            phoneNoInput.current.clear();
            usernameInput.current.clear();
            passwordInput.current.clear();
            reEnterPasswordInput.current.clear(); 

            // prevents memory leak
            if (mounted.current) {
                dispatch(updateUserState({id: res.id, username: res.username, token: res.token}));
            }

            setErrorType("");
            setErrorText("");
        }
        else {
            setErrorType(res.errorType);
            setErrorText(res.errorMessage);
        }
    }).catch((e) => {
        console.error(e);
    });
  };

  return (
      <SafeAreaView style={styles.container}>
          <ScrollView>
            <Stack direction="column" width="250">
                <Center>
                    <Heading size="md" mb="3">Register</Heading>

                    <FormControl isInvalid={errorType === "first_name"}>
                        <FormControl.Label>First Name</FormControl.Label>
                        <Input placeholder="First name" ref={firstNameInput} onChangeText={(text: string) => {setFirstNameText(text)}}/>
                        <FormControl.ErrorMessage>{errorText}</FormControl.ErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={errorType === "last_name"}>
                        <FormControl.Label mt="5">Surname</FormControl.Label>
                        <Input placeholder="Surname" ref={surnameInput} onChangeText={(text: string) => {setSurnameText(text)}}/>
                        <FormControl.ErrorMessage>{errorText}</FormControl.ErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={errorType === "phone"}>
                        <FormControl.Label mt="5">Phone Number</FormControl.Label>
                        <Input placeholder="Phone No" ref={phoneNoInput} onChangeText={(text: string) => {setPhoneNoText(text)}}/>
                        <FormControl.ErrorMessage>{errorText}</FormControl.ErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={errorType === "username"}>
                        <FormControl.Label mt="5">Username</FormControl.Label>
                        <Input placeholder="Username" ref={usernameInput} onChangeText={(text: string) => {setUsernameText(text)}}/>
                        <FormControl.ErrorMessage>{errorText}</FormControl.ErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={errorType === "password" || errorType === "non_matching_passwords"}>
                        <FormControl.Label mt="5">Password</FormControl.Label>
                        <Input type="password" placeholder="Password" ref={passwordInput} onChangeText={(text: string) => {setPasswordText(text)}}/>
                        <FormControl.ErrorMessage>{errorText}</FormControl.ErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={errorType === "non_matching_passwords"}>
                        <FormControl.Label mt="5">Re-enter password</FormControl.Label>
                        <Input type="password" placeholder="Password" ref={reEnterPasswordInput} onChangeText={(text: string) => {setReEnteredPasswordText(text)}}/>
                        <FormControl.ErrorMessage>{errorText}</FormControl.ErrorMessage>
                    </FormControl>

                    <Button mt="5" width="100%" onPress={() => {register()}}>
                        Register
                    </Button>

                    <Button width="100%" variant="subtle" colorScheme="tertiary" mt="3" onPress={() => navigation.navigate("Login")}>
                        Already have an account?
                    </Button>
                </Center>
          </Stack>
        </ScrollView>
      </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RegisterScreen;