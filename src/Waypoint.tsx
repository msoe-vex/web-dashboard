export class Waypoint {
    private name: string | undefined;

    set setName(name: string | undefined) {
        this.name = name;
    }

    get getName(): string | undefined {
        return this.name;
    }
    
}