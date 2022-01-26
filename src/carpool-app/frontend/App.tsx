import {Provider} from "react-redux";
import {store} from "./store";
import Index from "./index";

export default function App() {
  return (
    <Provider store={store}>
      <Index/>
    </Provider>
  );
}

