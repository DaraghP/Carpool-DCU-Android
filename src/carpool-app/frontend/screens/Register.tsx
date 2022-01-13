import {StyleSheet, Text, View} from "react-native";

function RegisterScreen({ navigation }) {
  return (
      <View style={styles.container}>
        <Text>Register Here</Text>
        <Text onPress={() => navigation.navigate("Login")}>Already have an account? Click me</Text>
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

export default RegisterScreen;