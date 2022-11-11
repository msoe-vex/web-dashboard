import { createListenerMiddleware, TypedStartListening } from "@reduxjs/toolkit";
import { RootState, AppDispatch } from "./store";

export const listenerMiddleware = createListenerMiddleware();
type AppStartListening = TypedStartListening<RootState, AppDispatch>;
const startAppListening = listenerMiddleware.startListening as AppStartListening;

startAppListening({
    // listen to every action
    predicate: () => true,
    effect: (_action, listenerApi) => {
        localStorage.setItem("store", JSON.stringify(listenerApi.getState().history.present));
    }
});

// const addAppListener = addListener as TypedAddListener<RootState, AppDispatch>;