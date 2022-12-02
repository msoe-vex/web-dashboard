import { Dictionary, EntityAdapter, EntityId, EntitySelectors, EntityState, Update } from "@reduxjs/toolkit";

interface SimpleSelectors<T, V> {
    selectById: (state: V, id: EntityId) => T;
    selectIds: (state: V) => EntityId[];
    selectAll: (state: V) => T[];
    selectEntities: (state: V) => Dictionary<T>;
}

export function getSimpleSelectors<T>(adapter: EntityAdapter<T>): SimpleSelectors<T, EntityState<T>> {
    const selectors = adapter.getSelectors();
    return {
        ...selectors,
        selectById: (state: EntityState<T>, id: EntityId) =>
            assertValid(selectors.selectById(state, id))
    };
}

interface ValidSelectors<T, V> extends EntitySelectors<T, V> {
    selectByValidId: (state: V, id: EntityId) => T;
}

export function addValidIdSelector<T>(selectors: EntitySelectors<T, any>): ValidSelectors<T, any> {
    return {
        ...selectors,
        selectByValidId: (state: EntityState<T>, id: EntityId) =>
            assertValid(selectors.selectById(state, id))
    }
}

export function assertValid<T>(value: T | undefined): T {
    // explicit check to prevent issues with null and false
    if (value === undefined) {
        throw new Error("Expected valid value.");
    }
    return value;
}

export function makeUpdate<T>(id: EntityId, changes: T): Update<T> {
    return { id, changes };
}

export function addReversedArray<T>(array: T[], arrayToAdd: T[]) {
    array.push(...Array.of(...arrayToAdd).reverse());
}

/**
 * @returns true if every item in subItems is in items.
 */
export function includesAll<T>(items: T[], subItems: T[]) {
    return subItems.every(subItem => items.includes(subItem));
}

export function includesArray<T>(arrays: T[][], subArray: T[]) {
    return arrays.some(array => array.every((val, i) => val === subArray[i]));
}

/**
 * @returns true if every array in subArrays is in arrays.
 */
export function includesAllArrays<T>(arrays: T[][], subArrays: T[][]) {
    return subArrays.every(subArray =>
        arrays.some(array => array.every((val, i) => val === subArray[i])));
}

export function remove<T>(items: T[], itemToRemove: T): T[] {
    return items.filter(item => item !== itemToRemove);
}

export function removeAll<T>(items: T[], itemsToRemove: T[]): T[] {
    return items.filter(item => !itemsToRemove.includes(item));
}

/**
 * Returns each instance of the array itemToRemove from items.
 * All arrays are assumed to be the same size.
 */
export function removeArray<T>(arrays: T[][], arrayToRemove: T[]): T[][] {
    // remove every array which has every value in arrayToRemove
    return arrays.filter(array =>
        !array.every((val, i) => val === arrayToRemove[i]));
}

/**
 * Returns the next valid default name of an object, e.g. Robot 1, Path 2, Routine 5, etc.
 * @param items - An array of items with a valid name to check against.
 * @param itemName - The name of the object. Should start with a capital letter.
 * @returns {string} - The next valid instance of the name followed by a string.
 */
export function getNextName(items: { name: string }[], itemName: string): string {
    const checkName = (newName: string) =>
        items.every(item => item.name !== newName);

    for (let i = 1; ; ++i) {
        if (checkName(itemName + " " + i)) { return itemName + " " + i; }
    }
}
