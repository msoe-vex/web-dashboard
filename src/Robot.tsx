
export class Robot {
    private name: string;
    private maxVelocity: number;
    private maxAcceleration: number;

    constructor(name: string, maxVelocity: number, maxAcceleration: number) {
        this.name = name;
        this.maxVelocity = maxVelocity;
        this.maxAcceleration = maxAcceleration;
    }

    set setName(name: string) {
        this.name = name;
    }

    get getName(): string {
        return this.name;
    }

    set setMaxVelocity(maxVelocity: number) {
        this.maxVelocity = maxVelocity;
    }

    get getMaxVelocity(): number {
        return this.maxVelocity;
    }
}