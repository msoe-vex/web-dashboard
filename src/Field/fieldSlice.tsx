import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../Store/store";
import { Units } from "./mathUtils";

export interface Field {
    // image: Image;
    fieldDimensions: FieldDimensions;
    splinePointCount: number;
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
            width: 12 * Units.FEET + 2 * Units.INCH,
        },
        splinePointCount: 10
    } as Field,
    reducers: {
        fieldDimensionsChanged(fieldState, action: PayloadAction<FieldDimensions>) {
            fieldState.fieldDimensions = action.payload;
        },
        splinePointCountChanged(fieldState, action: PayloadAction<number>) {
            fieldState.splinePointCount = action.payload;
        }
    }
});

export const {
    fieldDimensionsChanged,
    splinePointCountChanged
} = fieldSlice.actions;

export function selectFieldDimensions(state: RootState) {
    return state.history.present.field.fieldDimensions;
}

export function selectSplinePointCount(state: RootState) {
    return state.history.present.field.splinePointCount;
}