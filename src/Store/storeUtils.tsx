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

export function makeUpdate<T>(id: EntityId, changes: Partial<T>): Update<T> {
    return { id, changes };
}

/**
 * @returns true if items includes item.
 */
export function includes<T>(items: T[], item: T) {
    return items.some(containedItem => containedItem === item);
}

/**
 * @returns true if every item in subItems is in items.
 */
export function includesAll<T>(items: T[], subItems: T[]) {
    return subItems.every(subItem => includes(items, subItem));
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
