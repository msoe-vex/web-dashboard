/**
 * Returns the next valid default name of an object, e.g. Robot 1, Path 2, Routine 5, etc.
 * @param items - An array of items with a valid name to check against.
 * @param itemName - The name of the object. Should start with a capital letter.
 * @returns {string} - The next valid instance of the name followed by a string.
 */
export function getNextName(items: { name: string }[], itemName: string): string {
    const checkName = (newName: string): boolean =>
        items.every(item => item.name !== newName);

    for (let i = 1; ; ++i) {
        if (checkName(itemName + " " + i)) { return itemName + " " + i; }
    }
}