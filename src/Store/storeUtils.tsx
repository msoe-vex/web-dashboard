import { Dictionary, EntityId, EntitySelectors } from "@reduxjs/toolkit";

export interface ErrorlessSelectors<T, V> {
    selectById: (state: V, id: EntityId) => T;
    selectIds: (state: V) => EntityId[];
    selectAll: (state: V) => T[];
    selectEntities: (state: V) => Dictionary<T>;
}

export function getErrorlessSelectors<T>(selectors: EntitySelectors<T, any>): ErrorlessSelectors<T, any> {
    const errorlessSelectById = (state: any, id: EntityId): T => {
        const result = selectors.selectById(state, id);
        if (result === undefined) {
            console.log(id);
            console.log(state.history.present);
        }
        return verifyValueIsValid(result);
    };

    return {
        selectById: errorlessSelectById,
        selectIds: selectors.selectIds,
        selectAll: selectors.selectAll,
        selectEntities: selectors.selectEntities
    };
}

export function verifyValueIsValid<T>(value: T | undefined): T {
    if (value === undefined) { 
        throw new Error("Expected valid value."); 
    }
    return value;
}