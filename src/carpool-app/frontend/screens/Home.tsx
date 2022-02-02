import {StyleSheet, View, SafeAreaView, TouchableOpacity} from "react-native";
import {Text, Heading, Button, Center, HStack, Box} from "native-base";
import userReducer from "../reducers/user-reducer";
import {useAppDispatch, useAppSelector} from "../hooks";

function HomeScreen({ navigation }) {
    const dispatch = useAppDispatch();
    const user = useAppSelector(state => state.user);

    return (
        <View style={styles.container}>
            
            <Heading padding="5" size="md">
                Hi {user.username}! {'\n'}
                Select a role below to start carpooling 
            </Heading>
            
            <Center paddingX={"7"}>
                <HStack space={10} justifyContent="space-between">

                    <Box bg="primary.500" rounded="md" height="1200%" width="50%">
                        <TouchableOpacity>
                            <Heading paddingX="2" marginTop="1" color="white">Driver</Heading>
                        </TouchableOpacity>
                    </Box>
                   
                    <Box bg="primary.500" rounded="md" height="1200%" width="50%">
                        <TouchableOpacity>
                            <Heading paddingX="2" marginTop="1" color="white">Passenger</Heading>
                        </TouchableOpacity>
                    </Box>
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
  });

export default HomeScreen;