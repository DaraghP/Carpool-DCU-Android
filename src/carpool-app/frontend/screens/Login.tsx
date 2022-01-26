import {StyleSheet, View, Alert} from "react-native";
import {Box, VStack, Button, Center, FormControl, Input, Heading, Stack} from "native-base";
import {useRef, useState} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {updateUserState} from "../reducers/user-reducer";
import {useAppDispatch, useAppSelector} from "../hooks";

function LoginScreen({ navigation }) {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.user);
  const backendURL = useAppSelector(state => state.globals.backendURL);
  const usernameInput = useRef("");
  const passwordInput = useRef("");
  const [usernameText, setUsernameText] = useState("");
  const [passwordText, setPasswordText] = useState("");
  const [errorFound, setErrorFound] = useState(false);

  const login = () => {
    if (usernameText === "" || passwordText === "") {
        setErrorFound(true);
        return;
    }

    fetch(`${backendURL}/login`, {
      method: "POST",
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({username: usernameText, password: passwordText})
    }).then(response => response.json())
    .then(async (res) => {
        if (res.token) {
            usernameInput.current.clear();
            passwordInput.current.clear();

            await AsyncStorage.setItem("token", res.token);
            await AsyncStorage.getItem("token");

            // navigates to home screen once globals.user.token updates
            dispatch(updateUserState({username: usernameText, token: res.token}));

            setErrorFound(false);
        }
        else {
            setErrorFound(true);
        }
    }).catch((e) => {
        console.error(e)
    })
  }

  return (
      <View style={styles.container}>
        <Stack direction="column" width="250">
            <Center>
                <Heading size="md" mb="3">Login</Heading>

                <FormControl isInvalid={errorFound}>
                    <FormControl.Label isRequired>Username</FormControl.Label>
                    <Input key={1} mb="5" placeholder="Username" ref={usernameInput} onChangeText={(text: string) => {setUsernameText(text)}}/>
                </FormControl>

                <FormControl isInvalid={errorFound}>
                    <FormControl.Label isRequired>Password</FormControl.Label>
                    <Input key={2} type="password" placeholder="Password" ref={passwordInput} onChangeText={(text: string) => {setPasswordText(text)}}/>
                    <FormControl.ErrorMessage>Incorrect Username or Password</FormControl.ErrorMessage>
                </FormControl>

                <Button width="100%" mt="5" onPress={() => {login()}}>
                    Login
                </Button>

                <Button width="100%" variant="subtle" colorScheme="tertiary" mt="3" onPress={() => navigation.navigate("Register")}>
                    Don't have an account?
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

export default LoginScreen;