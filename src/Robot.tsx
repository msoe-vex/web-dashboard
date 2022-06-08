
export class Robot {
    private _name: string;
    private _maxVelocity: number;
    private _maxAcceleration: number;

    constructor(name: string, maxVelocity: number = 0, maxAcceleration: number = 0) {
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

    /**
     * Returns the first valid robot name of the form "Robot 1", "Robot 2", etc.
     * @param robots - An array of robots to test against.
     */
    static getNewRobotName(robots: Robot[]): string {
        let i = 1;
        const testName = robots.some((robot: Robot): boolean => { return robot.name === "Robot " + i; });
        while (testName) { ++i; }
        return "Robot " + i;
    }
}