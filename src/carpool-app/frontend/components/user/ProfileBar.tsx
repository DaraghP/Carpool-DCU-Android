import {Avatar, Box, Heading, HStack, Icon, Text, VStack} from "native-base";
import {TouchableOpacity} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import {useEffect} from "react";
import ProfileIcon from "./ProfileIcon";

function ProfileBar({showUserModal, setShowUserModal, profileData}) {
    useEffect(() => {
        console.log("test profiledata")
    }, [profileData])
    return (
        <Box padding="5" bg="muted.100" borderBottomWidth={1} borderBottomColor={"muted.500"}>
            <HStack space={3} alignItems="center">
                <ProfileIcon setShowUserModal={(value) => {setShowUserModal(value)}}/>
                <VStack paddingRight={5} marginRight={5}>
                    <HStack space={1}>
                        {/**/}
                        <Heading size="md">{profileData?.username}</Heading>

                        <TouchableOpacity onPress={() => {setShowUserModal(true)}}>
                            <Icon color="muted.500" size={6} as={Ionicons} name="create-outline"/>
                        </TouchableOpacity>
                    </HStack>
                    <Text color="muted.600" paddingRight={5} numberOfLines={2}>{profileData?.profile_description !== "" ? profileData?.profile_description : "Tell us about yourself..."}</Text>
                </VStack>
            </HStack>

        </Box>
    )
}

export default ProfileBar;