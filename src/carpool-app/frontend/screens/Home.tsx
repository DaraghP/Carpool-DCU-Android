import {StyleSheet, View, Text} from "react-native";


function HomeScreen({ navigation }) {
  return (
      <View style={styles.container}>
        <Text> Successfully logged in </Text>
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