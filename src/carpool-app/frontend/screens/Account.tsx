import {Alert, View} from "react-native"
import {Text, Button} from "native-base";
import {useContext, useState} from "react";
import {GlobalContext} from "../Contexts";

function AccountScreen({ navigation }) {
    const {globals, changeGlobals} = useContext(GlobalContext);
    let backendURL = globals.backendURL;

    const delete_alert = () => {
        Alert.alert(
            "Delete Account",
            "Are you sure you want to delete your account?\nThere is no way of getting back your account if you do so.",
            [
                {
                    text: "Delete",
                    onPress: () => {delete_account()}
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

    const delete_account = () => {
        fetch(`${backendURL}/delete`, {
            method: "GET",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Token ${globals.token}`
            },//
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
        <View>
            <Text>Date Created: 00/00/0000</Text>

            <Button colorScheme="secondary" onPress={() => {delete_alert()}}>Delete Account</Button>
        </View>
    )
}

export default AccountScreen;