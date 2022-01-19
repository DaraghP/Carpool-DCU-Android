import {StyleSheet, Text, View} from "react-native";
import {Box, Button, Center, FormControl, Heading, Input} from "native-base";
import {useContext, useEffect, useRef, useState} from "react";
import {GlobalContext} from "../Contexts";

function RegisterScreen({ navigation }) {
  const {globals, changeGlobals} = useContext(GlobalContext);
  const backendURL = globals.backendURL;

  const usernameInput = useRef("");
  const passwordInput = useRef("");
  const reEnterPasswordInput = useRef("");
  const [usernameText, setUsernameText] = useState("");
  const [passwordText, setPasswordText] = useState("");
  const [reEnteredPasswordText, setReEnteredPasswordText] = useState("");

  const register = () => {
      fetch(`${backendURL}/register`, {
      method: "POST",
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          // Might need 'Authorization' here
      },
      body: JSON.stringify({username: usernameText, password: passwordText, reEnteredPassword: reEnteredPasswordText})
    }).then(response => response.json())
    .then((res) => {
        if (!("error" in res)) {
            changeGlobals(res);
            navigation.navigate("Home");
        }
    });
  };

  return (
      <View style={styles.container}>
        <Center>
            <Heading size="md" mb="3">Register</Heading>

            <Box>
                <FormControl.Label>Username</FormControl.Label>
                <Input mb="5" placeholder="Username" ref={usernameInput} onChangeText={(text: string) => {setUsernameText(text)}}/>

                <FormControl.Label>Password</FormControl.Label>
                <Input placeholder="Password" ref={passwordInput} onChangeText={(text: string) => {setPasswordText(text)}}/>

                <FormControl.Label>Re-enter password</FormControl.Label>
                <Input placeholder="Password" ref={reEnterPasswordInput} onChangeText={(text: string) => {setReEnteredPasswordText(text)}}/>

                <Button mt="5" onPress={() => {register()}}>
                    Register
                </Button>

                <Button variant="subtle" colorScheme="tertiary" mt="3" onPress={() => navigation.navigate("Login")}>
                    Already have an account?
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

export default RegisterScreen;