/**
* Currently used for storing users current trip info/setup
*/

import {createAction, createSlice} from "@reduxjs/toolkit";
import { createLocationObj } from "../hooks";

const locations = {
    startingLocation: createLocationObj("startingLocation", "start", "Starting Point", {lat: 53.1424, lng: -7.6921}),
    destLocation: createLocationObj("destLocation", "destination", "Destination Point"),
    waypoint1: createLocationObj("waypoint1", "waypoint", "Waypoint 1"),
    waypoint2: createLocationObj("waypoint2", "waypoint", "Waypoint 2"),
    waypoint3: createLocationObj("waypoint3", "waypoint", "Waypoint 3"),
    waypoint4: createLocationObj("waypoint4", "waypoint", "Waypoint 4"),
} 
// try now maybe
const initialState = {
    role: "",
    locations: locations,
    markerRefs: {},
    numberOfWaypoints: 0
}


export const resetState = createAction("trips/reset_state");
export const updateRole = createAction<string>("trips/update_role");
export const setNumberOfWaypoints = createAction<number>("trips/set_number_of_waypoints");
export const setLocations = createAction<object>("trips/set_locations");

export const TripsSlice = createSlice({
    name: "trips",
    initialState,
    reducers: {
        update_state(state, action) {
          return {...state, ...action.payload};
        },
        set_number_of_waypoints(state, action) {
            if (action.payload >= 0 && action.payload < 5) {
                state.numberOfWaypoints = action.payload;
            }
        },
        set_locations(state, action) {
             state.locations = {...state.locations, ...action.payload};
        },
        update_role(state, action) {
            state.role = action.payload;
        },
        reset_state(state) {
            return {
                role: state.role,
                locations: locations,
                markerRefs: {},
                numberOfWaypoints: 0
            };
        }
    }
})

export default TripsSlice.reducer;