export class Routine {
    private _name: string;
    private _history: History = new History();

    constructor(name: string) {
        this._name = name;
    }

    get history(): History {
        return this._history;
    }

    set name(name: string) {
        this._name = name;
    }

    get name(): string {
        return this._name;
    }
}