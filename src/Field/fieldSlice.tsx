import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../Store/store";
import { Units } from "./mathUtils";

export interface Field {
    // image: Image;
    fieldDimensions: FieldDimensions;
}

export interface FieldDimensions {
    height: number;
    width: number;
}

export const fieldSlice = createSlice({
    name: "field",
    initialState: {
        fieldDimensions: {
            height: 12 * Units.FEET + 2 * Units.INCH,
            width: 12 * Units.FEET + 2 * Units.INCH
        }
    } as Field,
    reducers: {
        fieldDimensionsChanged(fieldState, action: PayloadAction<FieldDimensions>) {
            fieldState.fieldDimensions = action.payload;
        },
    }
});

export const {
    fieldDimensionsChanged
} = fieldSlice.actions;

export function selectFieldDimensions(state: RootState) {
    return state.history.present.field.fieldDimensions;
}