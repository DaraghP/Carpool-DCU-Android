import {useContext} from "react";
import {GlobalContext} from "../Contexts";
import {StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {Button, Divider, Heading, ScrollView} from "native-base";


function SettingsMenu({ navigation }) {
    const {globals, changeGlobals} = useContext(GlobalContext);
    let backendURL = globals.backendURL;
    let username = globals.username;

    const logout = () => {
        fetch(`${backendURL}/logout`, {
            method: "GET",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Token ${globals.token}`
            },
            body: null
        }).then(response => ({ status: response.status }))
          .then((data) => {
            if (data.status === 200) {
                // navigates back to Login screen once token is an empty string (see App.tsx)
                changeGlobals({username: "", token: ""});
            }
          }).catch((e) => {
              console.error(e);
          });
    }

    return (
        <View style={styles.container}>
            <ScrollView my="5">
                <Heading mt="5" ml="2" mb="2">
                    <Text style={{fontWeight: "800", letterSpacing: 2}}>{username}</Text>
                    <Button colorScheme="secondary" onPress={() => {logout()}}>Logout</Button>
                </Heading>

                <TouchableOpacity style={[styles.settingsButton, {borderTopColor: "#e4e4eb", borderTopWidth: 0.5}]}>
                    <View>
                        <Text>Edit Profile</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingsButton} onPress={() => {navigation.navigate("Account")}}>
                    <View>
                        <Text>Account Info</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingsButton}>
                    <View>
                        <Text>Logout</Text>
                    </View>
                </TouchableOpacity>

            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  settingsButton: {
      width: '100%',
      height: 53,
      padding: 15,
      marginBottom: 3,
      borderBottomColor: "#e4e4eb",
      borderBottomWidth: 0.5
    }
});


export default SettingsMenu;