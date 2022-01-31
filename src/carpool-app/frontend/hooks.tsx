import {TypedUseSelectorHook, useDispatch, useSelector} from "react-redux";
import {AppDispatch, RootState} from "./store";
import { Marker } from "react-native-maps";


// redux typescript hooks
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;


// hooks 
export const createLocationObj = (key: string, type: string, typeTitle: string, coords: { lat: number, lng: number } = {lat: 0, lng: 0}, numberofWaypoints: number = 0) => {
    const dispatch = useAppDispatch();
    const user = useAppSelector(state => state.user);
    
    const id = type === "waypoint" ? key : type;
    return (
        {
             key: key,
             type: type,
             markerTitle: typeTitle,
             info: {
                coords: coords,
                isEntered: false
             },
             marker: <Marker 
                        key={id}
                        coordinate={{
                            latitude: coords.lat,
                            longitude: coords.lng,
                        }}
                        title={typeTitle}
                        description={user.key?.address}
                        identifier={id}
                     />
        }
    )
}
