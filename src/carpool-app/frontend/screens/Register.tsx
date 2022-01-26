import {StyleSheet, Text, View} from "react-native";
import {Stack, Button, Center, FormControl, Heading, Input} from "native-base";
import {useRef, useState} from "react";
import {updateUserState} from "../reducers/user-reducer";
import {useAppDispatch, useAppSelector} from "../hooks";

function RegisterScreen({ navigation }) {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.user);
  const backendURL = useAppSelector(state => state.globals.backendURL);

  const usernameInput = useRef("");
  const passwordInput = useRef("");
  const reEnterPasswordInput = useRef("");
  const [usernameText, setUsernameText] = useState("");
  const [passwordText, setPasswordText] = useState("");
  const [reEnteredPasswordText, setReEnteredPasswordText] = useState("");
  const [errorType, setErrorType] = useState("");
  const [errorText, setErrorText] = useState("");

  const register = () => {
      fetch(`${backendURL}/register`, {
      method: "POST",
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({username: usernameText, password: passwordText, reEnteredPassword: reEnteredPasswordText})
    }).then(response => response.json())
    .then((res) => {
        if (!("errorType" in res)) {
            usernameInput.current.clear();
            passwordInput.current.clear();
            reEnterPasswordInput.current.clear();

            dispatch(updateUserState({username: res.username, token: res.token}));

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
      <View style={styles.container}>
          <Stack direction="column" width="250">
                <Center>
                    <Heading size="md" mb="3">Register</Heading>

                    <FormControl isInvalid={errorType === "username"}>
                        <FormControl.Label>Username</FormControl.Label>
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
      </View>
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