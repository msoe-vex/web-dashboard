import { addListener, createListenerMiddleware, isAnyOf, TypedAddListener, TypedStartListening } from "@reduxjs/toolkit";
import { RootState, AppDispatch } from "./store";

export const listenerMiddleware = createListenerMiddleware();
export type AppStartListening = TypedStartListening<RootState, AppDispatch>;
export const startAppListening = listenerMiddleware.startListening as AppStartListening;

startAppListening({
    predicate: () => true, 
    // matcher: isAnyOf(tempUiSlice.actions.allItemsDeselected),
    // actionCreator: tempUiSlice.actions,
    effect: (_action, listenerApi) => {
        localStorage.setItem("store", JSON.stringify(listenerApi.getState().history.present));
    }
});

export const addAppListener = addListener as unknown as TypedAddListener<RootState, AppDispatch>;