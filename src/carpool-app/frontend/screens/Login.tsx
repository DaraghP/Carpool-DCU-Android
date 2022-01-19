import {StyleSheet, View} from "react-native";
import {Box, Button, Center, FormControl, Input, Heading} from "native-base";
import {useContext, useEffect, useRef, useState} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {GlobalContext} from "../Contexts";


function LoginScreen({ navigation }) {
  const {globals, changeGlobals} = useContext(GlobalContext);
  const backendURL = globals.backendURL;

  const usernameInput = useRef("");
  const passwordInput = useRef("");
  const [usernameText, setUsernameText] = useState("");
  const [passwordText, setPasswordText] = useState("");
  const [errorFound, setErrorFound] = useState(false);


  const login = () => {
    fetch(`${backendURL}/token`, {
      method: "POST",
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          // Might need 'Authorization' here
      },
      body: JSON.stringify({username: usernameText, password: passwordText})
    }).then(response => response.json())
    .then(async (res) => {
        if (res.token) {
            usernameInput.current.clear();
            passwordInput.current.clear();

            await AsyncStorage.setItem("token", res.token);
            await AsyncStorage.getItem("token");

            changeGlobals({username: usernameText, token: res.token});

            navigation.navigate("Home");
        }
        else {

            // TODO: display some warning
            console.log("Incorrect Username or Password");
        } //
    }).catch((e) => {
        console.error(e)
        console.log("Incorrect Username or Password")
    })//

    //     .then(() => {
    //     if (response) {
    //         usernameInput.current.clear();
    //         passwordInput.current.clear();
    //         console.log(response.token);
    //     }
    //     else {
    //         // TODO: display some warning
    //     }

        // navigation.navigate("Home");
  }

  return (
      <View style={styles.container}>
        <Center>
            <Heading size="md" mb="3">Login</Heading>

            <Box>

                <FormControl isInvalid={errorFound}>
                    <FormControl.Label isRequired>Username</FormControl.Label>
                    <Input key={1} mb="5" placeholder="Username" ref={usernameInput} onChangeText={(text: string) => {setUsernameText(text)}}/>
                </FormControl>

                <FormControl>
                    <FormControl.Label isRequired>Password</FormControl.Label>

                        <Input key={2} type="password" placeholder="Password" ref={passwordInput} onChangeText={(text: string) => {setPasswordText(text)}}/>
                </FormControl>
                    <Button mt="5" onPress={() => {login()}}>
                        Login
                    </Button>

                    <Button variant="subtle" colorScheme="tertiary" mt="3" onPress={() => navigation.navigate("Register")}>
                        Don't have an account?
                    </Button>

            </Box>
        </Center>
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