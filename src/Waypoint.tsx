export class Waypoint {
    private _name: string | undefined;

    set Name(name: string | undefined) {
        this._name = name;
    }

    get name(): string | undefined {
        return this._name;
    }
    
}