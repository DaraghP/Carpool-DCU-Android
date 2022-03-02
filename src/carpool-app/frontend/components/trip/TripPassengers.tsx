import {HStack, ScrollView, Text, VStack} from "native-base";
import Profile from "../user/Profile";
import {v4} from "uuid";
import {useEffect, useState} from "react";
import {useAppSelector} from "../../hooks";

function TripPassengers({passengers, showPhoneNumbers = false}) {
    return (
        <HStack color="white" alignItems="center" p={1}>
            <ScrollView horizontal={true} keyboardShouldPersistTaps="handled">

                <HStack>
                    {Object.keys(passengers).map((passengerKey, index) => {
                        return (
                            <>
                                <VStack key={v4()}>
                                    <Profile uid={parseInt(passengerKey.slice("passenger".length))} mode="iconModal"
                                             showPhoneNumber={showPhoneNumbers}/>
                                    <Text color="white" bold>{passengers[passengerKey].passengerName}{"    "}</Text>
                                </VStack>
                            </>
                        )
                    })}
                </HStack>

            </ScrollView>

        </HStack>
    )
}

export default TripPassengers;