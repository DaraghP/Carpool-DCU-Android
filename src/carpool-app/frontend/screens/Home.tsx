import {StyleSheet, View, SafeAreaView, TouchableOpacity} from "react-native";
import {Text, Heading, Button, Center, HStack, Box} from "native-base";
import userReducer from "../reducers/user-reducer";
import {useAppDispatch, useAppSelector} from "../hooks";
import Ionicons from '@expo/vector-icons/Ionicons';

function HomeScreen({ navigation }) {
    const dispatch = useAppDispatch();
    const user = useAppSelector(state => state.user); 

    return (
        <View style={styles.container}>
            <Heading padding="5" size="md">
                Hi {user.username}! {'\n'}
                Select a role below to start carpooling
            </Heading>
            
            <Center paddingX={"5"}>
                 <HStack space={5}>
                        <Button width="50%" height="350%" onPress = {() => console.log("Driver role selected")}>
                            <Ionicons name="car-outline" size={80} color="white"/>
                            <Heading style={{letterSpacing: 2.5}} color="white" textAlign="center">Driver</Heading> 
                        </Button>

                        <Button width="50%" height="350%" onPress = {() => console.log("Passenger role selected")}> 
                            <Ionicons style={{textAlign: "center"}} name="body" size={80} color="white"/>
                            <Heading style={{letterSpacing: 2.5}} color="white" textAlign="center">Passenger</Heading> 
                        </Button>
                        
                </HStack>
            </Center>

            


        </View>
        
    )
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      flexGrow: 1,
    },
    button: {
        padding: 10,
        backgroundColor: "blue",
        height: "1200%",
        width: "40%",
        margin: "2.5%",// 
    }, 
    label: {
        color: "white",
        textAlign: "center",
        fontSize: 20,
    }
  });

export default HomeScreen;