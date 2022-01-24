import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SettingsMenu from "../components/SettingsMenu";
import AccountScreen from "./Account";

const Stack = createNativeStackNavigator();

function SettingsScreen({ navigation }) {

    return (
        <Stack.Navigator initialRouteName="SettingsMenu">
            <Stack.Screen name="SettingsMenu" component={SettingsMenu}/>
            <Stack.Screen name="Account" component={AccountScreen}/>
        </Stack.Navigator>
    )
}

export default SettingsScreen;