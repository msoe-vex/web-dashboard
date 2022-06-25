import { Command } from './Command'
import { Routine } from './Routine';

export class CreateRoutineCommand implements Command {
    private _routines: Routine[];
    private _newRoutine: Routine;
    constructor(routines: Routine[], newRoutine: Routine) {
        this._routines = routines;
        this._newRoutine = newRoutine;
    }

    undo(): boolean {
        const i: number = this._routines.findIndex((routine: Routine): boolean => {
            return routine.name === this._newRoutine.name;
        }, this);
        if (i === -1) { return false; }
        this._routines.splice(i);
        return true;
    }
    execute(): boolean {
        this._routines.unshift(this._newRoutine);
        return true;
    }
}