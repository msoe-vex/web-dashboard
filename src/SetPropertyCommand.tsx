import { Command } from "./Command"

/**
 * A generic command which can be used to update the value of a property 
 * on a class via a passed in setter function.
 */
export class SetPropertyCommand<PropertyType> implements Command {
    value: PropertyType;
    oldValue: PropertyType;
    setter: (value: PropertyType) => void;

    constructor(value: PropertyType,
        oldValue: PropertyType,
        setter: (value: PropertyType) => void) {
        this.value = value;
        this.oldValue = oldValue;
        this.setter = setter;
    }

    undo(): boolean {
        this.setter(this.oldValue);
        return true;
    }

    execute(): boolean {
        this.setter(this.value);
        return true;
    }
}