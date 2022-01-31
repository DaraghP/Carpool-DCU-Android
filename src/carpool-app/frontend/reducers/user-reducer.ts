import {createAction, createSlice} from "@reduxjs/toolkit";

const initialState = {
    username: "",
    token: "",
    startingLocation: "",
    destinationLocation: "",
    waypoints: {
        waypoint1: "",
        waypoint2: "",
        waypoint3: "",
        waypoint4: "",
    },
    destination: "",
    markerRefs: {},
    numberOfWaypoints: 0
}

export const updateUserState = createAction<object>("user/update_state");
export const updateUsername = createAction<string>("user/update_username");
export const updateToken = createAction<string>("user/update_token");
export const setNumberOfWaypoints = createAction<number>("user/set_number_of_waypoints");


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
            state.numberOfWaypoints = action.payload;
        }
    }
})

export default UserSlice.reducer;