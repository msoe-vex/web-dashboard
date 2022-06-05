
export class Robot {
    private _name: string;
    private _maxVelocity: number;
    private _maxAcceleration: number;

    constructor(name: string, maxVelocity: number, maxAcceleration: number) {
        this._name = name;
        this._maxVelocity = maxVelocity;
        this._maxAcceleration = maxAcceleration;
    }

    set name(name: string) {
        this._name = name;
    }

    get name(): string {
        return this._name;
    }

    set maxVelocity(maxVelocity: number) {
        this._maxVelocity = maxVelocity;
    }

    get maxVelocity(): number {
        return this._maxVelocity;
    }

    set maxAcceleration(maxAcceleration: number) {
        this._maxAcceleration = maxAcceleration;
    }

    get maxAcceleration(): number {
        return this._maxAcceleration;
    }
}