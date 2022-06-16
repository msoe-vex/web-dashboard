import { Command } from './Command'
import { Routine } from './Routine';

export class SetActiveRoutineCommand implements Command {
    private _routines: Routine[];
    private _newActiveRoutineName: string;
    private _oldActiveRoutineName: string;
    constructor(routines: Routine[], routine: Routine) {
        this._routines = routines;
        this._newActiveRoutineName = routine.name;
        this._oldActiveRoutineName = routines[0].name;
    }

    undo(): boolean {
        const i: number = this._routines.findIndex((routine: Routine): boolean => {
            return routine.name === this._oldActiveRoutineName;
        }, this);
        if (i === -1) { return false; }

        const routine: Routine = this._routines[i];
        this._routines.splice(i);
        this._routines.unshift(routine);
        return true;
    }
    execute(): boolean {
        const i: number = this._routines.findIndex((routine: Routine): boolean => {
            return routine.name === this._newActiveRoutineName;
        }, this);
        if (i === -1) { return false; }

        const routine: Routine = this._routines[i];
        this._routines.splice(i);
        this._routines.unshift(routine);
        return true;
    }
}
