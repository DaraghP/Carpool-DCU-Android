/**
* Currently used for storing users current trip info/setup
*/

import {createAction, createSlice} from "@reduxjs/toolkit";


const initialState = {
    locations: {},
    destination: "",
    markerRefs: {},
    numberOfWaypoints: 0
}


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
        }
    }
})

export default TripsSlice.reducer;