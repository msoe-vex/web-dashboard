import { Command } from './Command'
import { Robot } from './Robot'

export class AddRobotCommand implements Command {
    private _robots: Robot[];
    private _newRobotName: string;
    constructor(robots: Robot[]) {
        this._robots = robots;
        this._newRobotName = Robot.getNewRobotName(this._robots);
    }

    undo(): boolean {
        const i: number = this._robots.findIndex((robot: Robot) => { return robot.name === this._newRobotName; }, this);
        if (i === -1) { return false; }
        this._robots.splice(i);
        return true;
    }

    execute(): boolean {
        this._robots.push(new Robot(this._newRobotName));
        return true;
    }
}