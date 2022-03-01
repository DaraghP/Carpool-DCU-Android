import TripAlertModal from "./TripAlertModal";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import {setTimeOfDeparture} from "../../reducers/trips-reducer";
import {useEffect, useState} from "react";
import {useAppDispatch, useAppSelector} from "../../hooks";
import {Button, Text} from "native-base";

function DepartureTimePicker() {
    const dispatch = useAppDispatch();
    const trips = useAppSelector(state => state.trips);
    const [dateToday, setDateToday] = useState(new Date());
    const [showTimeAlertModal, setShowTimeAlertModal] = useState(false);
    const [isTimeSelected, setIsTimeSelected] = useState(false);
    const [isTimePickerVisible, setTimePickerVisibility] = useState(false);

    useEffect(() => {
      const setTimeInterval = setInterval(() => {
          let date = new Date();
          date.setMinutes(date.getMinutes() + 5);
          setDateToday(date);
      }, 60000*5)

      return () => {
          clearInterval(setTimeInterval);
      }
    }, [])

    return (
        <>
              <Button pl={5} bg="muted.900" style={{alignItems: "flex-start", justifyContent: "flex-start"}} rounded={20} onPress={() => {
                  setTimePickerVisibility(true);
                  let date = new Date();
                  date.setMinutes(date.getMinutes() + 5);
                  setDateToday(date)
              }}>
                  <Text textAlign="left" color="white" fontSize={15}>
                    Time of Departure:{"   "}
                    <Text fontWeight="bold">
                        {!isTimeSelected ? "Now" : `${new Date(trips.timeOfDeparture).toLocaleTimeString().slice(0, 5)} ${new Date(trips.timeOfDeparture).toLocaleDateString()}`}
                    </Text>
                  </Text>
              </Button>

              {showTimeAlertModal &&
                  <TripAlertModal
                      headerText={"Time Selection Error"}
                      bodyText={`Please enter a time in the future.\nPress OK to continue.`}
                      btnAction={
                          {
                              action: () => {
                                  setShowTimeAlertModal(false);
                                  setTimePickerVisibility(true);
                              },
                              text: "OK"
                          }
                      }
                  />
              }

              <DateTimePickerModal
                  mode="datetime"
                  date={dateToday}
                  is24Hour={false}
                  minimumDate={dateToday}
                  maximumDate={new Date(dateToday.getFullYear(), dateToday.getMonth(), dateToday.getDate()+7)}
                  minuteInterval={5}
                  isVisible={isTimePickerVisible}
                  onConfirm={(time) => {
                      console.log("Time selected:", time.toString());
                      let msecSelected = Date.parse(time.toString())
                      let msecNow = Date.parse(new Date().toString())
                      console.log((msecSelected - msecNow) >= 0)
                      if ((msecSelected - msecNow) >= 0) {
                          dispatch(setTimeOfDeparture(time.toString()));
                          setTimePickerVisibility(false);
                          setIsTimeSelected(true);
                      }
                      else {
                          setTimePickerVisibility(false);
                          setShowTimeAlertModal(true)
                      }
                  }}
                  onCancel={() => {
                      setTimePickerVisibility(false);
                  }}/>
        </>
    )
}

export default DepartureTimePicker;