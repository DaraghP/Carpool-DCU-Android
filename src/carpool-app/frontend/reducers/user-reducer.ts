/**
* Currently used for storing user info and their trip info
*/

import {createAction, createSlice} from "@reduxjs/toolkit";
import {createLocationObj, useAppDispatch, useAppSelector} from "../hooks";
import {Marker} from "react-native-maps";

const initialState = {
    username: "",
    token: "",
    locations: {},
    destination: "",
    markerRefs: {},
    numberOfWaypoints: 0
}

export const updateUserState = createAction<object>("user/update_state");
export const updateUsername = createAction<string>("user/update_username");
export const updateToken = createAction<string>("user/update_token");
export const setNumberOfWaypoints = createAction<number>("user/set_number_of_waypoints");
export const setLocations = createAction<object>("user/set_locations");


export const UserSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        update_state(state, action) {
          return {...state, ...action.payload};
        },
        update_username(state, action) {
            state.username = action.payload;
        },
        update_token(state, action) {
            state.token = action.payload;
        },
        set_number_of_waypoints(state, action) {
            if (action.payload >= 0 && action.payload < 5) {
                state.numberOfWaypoints = action.payload;
            }
        },
        set_locations(state, action) {
             state.locations = {...state.locations, ...action.payload};
        }
    }
})

export default UserSlice.reducer;