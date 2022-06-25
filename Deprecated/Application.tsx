import React from 'react';
import { Robot } from './Robot';
import { Command } from './Command';
import { Routine } from './Routine';
import { History } from './History';

/**
 * A class defining the top level application.
 */
export class Application {
    _robots: Robot[];
    _routines: Routine[];

    _history: History = new History();

    static getDefaultApp = (): Application => {
        let routines: Routine[] = [
            new Routine("Routine 1"),
            new Routine("Routine 2")
        ];
        let robots: Robot[] = [];
        return new Application(robots, routines);
    }

    constructor(robots: Robot[] = [], routines: Routine[] = []) {
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

    static reducer(app: Application, command: Command) {
        app.executeCommand(command);
        return app;
    }

    static AppDispatch: React.Context<React.Dispatch<Command>>;
    //  = React.createContext<React.Dispatch<Command>>({
    //     (val: Command): void => {}
    // } as React.Context<React.Dispatch<Command>>);

    executeCommand(command: Command) {
        command.execute();
        this._history.push(command);
    }
}