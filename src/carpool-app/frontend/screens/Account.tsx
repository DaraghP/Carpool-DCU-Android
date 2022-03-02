import {Alert, View} from "react-native"
import {Text, Button} from "native-base";
import {updateUserState} from "../reducers/user-reducer";
import {useAppDispatch, useAppSelector} from "../hooks";

function AccountScreen({ navigation }) {
    const dispatch = useAppDispatch();
    const user = useAppSelector(state => state.user);
    const backendURL = useAppSelector(state => state.globals.backendURL);

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
                'Authorization': `Token ${user.token}`
            },//
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

    return (
        <View>
            <Text alignSelf="center">{'\n'} Date Created: {user.dateCreated}{'\n'}</Text>

            <Button width="80%" alignSelf="center" colorScheme="secondary" onPress={() => {delete_alert()}}>Delete Account</Button>
        </View>
    )
}

export default AccountScreen;