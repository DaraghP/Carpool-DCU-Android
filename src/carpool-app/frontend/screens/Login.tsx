import {StyleSheet, View} from "react-native";
import {Box, Button, Center, FormControl, Input, Heading} from "native-base";


function LoginScreen({ navigation }) {

  return (
      <View style={styles.container}>
        <Center>
            <Heading size="md" mb="3">Login</Heading>

            <Box>
                <FormControl.Label>Username</FormControl.Label>
                <Input mb="5" placeholder="Username" />

                <FormControl.Label>Password</FormControl.Label>
                <Input placeholder="Password"/>

                <Button mt="5" onPress={() => login()}>
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