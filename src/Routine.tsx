export class Routine {
    private name: string;
    private history: History = new History();

    constructor(name: string) {
        this.name = name;
    }

    get getHistory(): History {
        return this.history;
    }
}