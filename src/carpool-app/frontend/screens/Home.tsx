import {StyleSheet, View, Text} from "react-native";
import {useContext} from "react";
import {GlobalContext} from "../Contexts";


function HomeScreen({ navigation }) {
  const {globals, changeGlobals} = useContext(GlobalContext);
  const username = globals.username;

  return (
      <View style={styles.container}>
        <Text>Successfully logged in as: {username}</Text>
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

export default HomeScreen;