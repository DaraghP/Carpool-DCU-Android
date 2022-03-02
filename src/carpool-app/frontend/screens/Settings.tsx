import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SettingsMenu from "../components/settings/SettingsMenu";
import AccountScreen from "./Account";

const Stack = createNativeStackNavigator();

function SettingsScreen({ navigation }) {

    return (
        <Stack.Navigator initialRouteName="Settings Menu">
            <Stack.Screen name="Settings Menu" component={SettingsMenu}/>
            <Stack.Screen name="Account" component={AccountScreen}/>
        </Stack.Navigator>
    )
}

export default SettingsScreen;