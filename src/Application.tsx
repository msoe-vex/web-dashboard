import { Robot } from "./Robot"
import { Command } from "./Command"
import { Routine } from "./Routine"
import { History } from "./History"

/**
 * A class defining the top level application.
 */
export class Application {
    robots: Robot[] = [];
    routines: Routine[] = [];
    activeRoutine: Routine | undefined;

    history: History = new History();

    constructor(robots: Robot[], routines: Routine[]) {
        this.robots = robots;
        this.routines = routines;
    }

    getHistory(): History {
        return this.history;
    }

    executeCommand(command: Command) {
        command.execute();
        this.history.push(command);
    }
}