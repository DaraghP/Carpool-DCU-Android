import {StyleSheet, View} from "react-native";
import {Box, Button, Center, FormControl, Input, Heading} from "native-base";
import {useEffect, useRef, useState} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
const {manifest} = Constants;

function LoginScreen({ navigation }) {
  const usernameInput = useRef("");
  const passwordInput = useRef("");
  const [usernameText, setUsernameText] = useState("");
  const [passwordText, setPasswordText] = useState("");
  const ip = manifest.debuggerHost.split(":")[0];
  const url = `http://${ip}:8000`;


  const login = () => {
    let response = null;
    let token = null;

    fetch(`${url}/token`, {
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
            token = await AsyncStorage.getItem("token");
            console.log(token); //
            response = res; //
        }
        else {
            // TODO: display some warning
        }
    }).catch((e) => {console.error(e)})//

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
                <FormControl.Label>Username</FormControl.Label>
                <Input mb="5" placeholder="Username" ref={usernameInput} onChangeText={(text: string) => {setUsernameText(text)}}/>

                <FormControl.Label>Password</FormControl.Label>
                <Input placeholder="Password" ref={passwordInput} onChangeText={(text: string) => {setPasswordText(text)}}/>

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