import CreateGoogleAutocompleteInput from "./CreateGoogleAutocompleteInput";
import {v4} from "uuid";
import {useAppDispatch, useAppSelector} from "../../hooks";

function LocationInputGroup({isTripToDCU, campusSelected}) {
    const trips = useAppSelector(state => state.trips);

    return (
        <>
            {trips.locations.startingLocation.info.isEntered || trips.locations.destLocation.info.isEntered ?
                isTripToDCU ?
                    <CreateGoogleAutocompleteInput
                    key={v4()}
                    locationObjName={"startingLocation"}
                    placeholder="Enter your starting point..."
                    style={{rounded: 5}}
                    />
                    :
                    <CreateGoogleAutocompleteInput
                    key={v4()}
                    locationObjName={"destLocation"}
                    placeholder="Enter your destination..."
                    />
                : null
            }

            {trips.role === "driver" && trips.locations.startingLocation.info.isEntered && trips.locations.destLocation.info.isEntered &&
                Object.keys(trips.locations).sort().map((key) => {
                      if (trips.locations[key].type === "waypoint") {
                          if (parseInt(key.charAt(key.length - 1)) <= trips.numberOfWaypoints) {
                              return (
                                  <CreateGoogleAutocompleteInput
                                      key={v4()}
                                      locationObjName={key}
                                  />
                              );
                          }
                      }
                })
            }
        </>
    )
}

export default LocationInputGroup;