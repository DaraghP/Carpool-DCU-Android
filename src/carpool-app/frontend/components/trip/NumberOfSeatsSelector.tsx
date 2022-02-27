import {setAvailableSeats} from "../../reducers/trips-reducer";
import Ionicons from "@expo/vector-icons/Ionicons";
import {Icon, Select} from "native-base";
import {v4} from "uuid";
import {useAppDispatch, useAppSelector} from "../../hooks";

function NumberOfSeatsSelector() {
    const dispatch = useAppDispatch();
    const user = useAppSelector(state => state.user);
    const trips = useAppSelector(state => state.trips);

    return (
        (trips.role === "driver" && user.status !== "driver_busy" ?
              <Select
                  key={v4()}
                  dropdownIcon={<Icon as={Ionicons} name="chevron-down" size={5} color={"gray.400"}/>}
                  placeholder="Choose your number of available seats"
                  onValueChange={value => dispatch(setAvailableSeats(parseInt(value)))}
              >
                  {[...Array(5).keys()].splice(1).map((number) => {
                      return (<Select.Item key={v4()} label={`${number} seats`} value={`${number}`}/>);
                  })
                  }
              </Select>
        : null)
    )
}

export default NumberOfSeatsSelector;