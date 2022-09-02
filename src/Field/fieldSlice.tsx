import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../Store/store";

import { Units } from "./mathUtils";

export interface Field {
    width: number;
    height: number;
}

export const fieldSlice = createSlice({
    name: "field",
    initialState: { width: 12 * Units.FEET + 2 * Units.INCH, height: 12 * Units.FEET + 2 * Units.INCH },
    reducers: {
        fieldWidthChanged: (fieldState, action: PayloadAction<number>) => {
            fieldState.width = action.payload;
        },
        fieldHeightChanged: (fieldState, action: PayloadAction<number>) => {
            fieldState.height = action.payload;
        }
    }
});

export const {
    fieldWidthChanged,
    fieldHeightChanged
} = fieldSlice.actions;

export const selectFieldWidth = (state: RootState) => state.field.width;
export const selectFieldHeight = (state: RootState) => state.field.height;
