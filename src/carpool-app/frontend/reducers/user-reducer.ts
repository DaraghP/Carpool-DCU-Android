import {createAction, createSlice} from "@reduxjs/toolkit";

const initialState = {
    username: "",
    token: "",
    startingLocation: "",
    destinationLocation: "",
    destination: ""
}

export const updateUserState = createAction<object>("user/update_state");
export const updateUsername = createAction<string>("user/update_username");
export const updateToken = createAction<string>("user/update_token");

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
        }
    }
})

export default UserSlice.reducer;