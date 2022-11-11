import { AnyAction, EntityId, EntitySelectors } from "@reduxjs/toolkit";
import { AppDispatch } from "./store";

export interface ErrorlessSelectors<T, V> extends EntitySelectors<T, V> {
    selectByIdErrorless: (state: V, id: EntityId) => T;
}

export function getErrorlessSelectors<T>(selectors: EntitySelectors<T, any>): ErrorlessSelectors<T, any> {
    return {
        ...selectors,
        selectByIdErrorless: (state: any, id: EntityId): T =>
         verifyValueIsValid(selectors.selectById(state, id))
    };
}

export function verifyValueIsValid<T>(value: T | undefined): T {
    // explicit check to prevent issues with null and false
    if (value === undefined) { 
        throw new Error("Expected valid value."); 
    }
    return value;
}