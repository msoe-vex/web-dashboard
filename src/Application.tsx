import { Robot } from './Robot'
import { Command } from './Command'
import { Routine } from './Routine'
import { History } from './History'

/**
 * A class defining the top level application.
 */
export class Application {
    _robots: Robot[] = [];
    _routines: Routine[] = [];
    _activeRoutine: Routine | undefined;

    _history: History = new History();

    constructor(robots: Robot[], routines: Routine[]) {
        this._robots = robots;
        this._routines = routines;
    }

    get history(): History {
        return this._history;
    }

    set robots(robots: Robot[]) {
        this._robots = robots;
    }

    get robots(): Robot[] {
        return this._robots;
    }

    set routines(routines: Routine[]) {
        this._routines = routines;
    }

    get routines(): Routine[] {
        return this._routines;
    }

    executeCommand(command: Command) {
        command.execute();
        this.history.push(command);
    }
}