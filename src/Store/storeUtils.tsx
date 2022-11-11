import { EntityId, EntitySelectors } from "@reduxjs/toolkit";

export interface ErrorlessSelectors<T, V> extends EntitySelectors<T, V> {
    errorlessSelectById: (state: V, id: EntityId) => T;
}

export function getErrorlessSelectors<T>(selectors: EntitySelectors<T, any>): ErrorlessSelectors<T, any> {
    return {
        ...selectors,
        errorlessSelectById: (state: any, id: EntityId): T =>
         verifyValueIsValid(selectors.selectById(state, id))
    };
}

export function verifyValueIsValid<T>(value: T | undefined): T {
    if (value === undefined) { 
        throw new Error("Expected valid value."); 
    }
    return value;
}