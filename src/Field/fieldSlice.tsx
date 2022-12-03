import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../Store/store";
import { FEET, INCH } from "./mathUtils";

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
            height: 12 * FEET + 2 * INCH,
            width: 12 * FEET + 2 * INCH,
        },
        splinePointCount: 10
    } as Field,
    reducers: {
        fieldUpdated(fieldState, action: PayloadAction<Partial<Field>>) {
            // return to replace entire field
            return Object.assign(fieldState, action.payload);
        },
        fieldDimensionsChanged(fieldState, action: PayloadAction<FieldDimensions>) {
            fieldState.fieldDimensions = action.payload;
        },
        splinePointCountChanged(fieldState, action: PayloadAction<number>) {
            fieldState.splinePointCount = action.payload;
        }
    }
});

export const {
    fieldUpdated,
    fieldDimensionsChanged,
    splinePointCountChanged
} = fieldSlice.actions;

export function selectFieldDimensions(state: RootState) {
    return state.history.present.field.fieldDimensions;
}

export function selectSplinePointCount(state: RootState) {
    return state.history.present.field.splinePointCount;
}