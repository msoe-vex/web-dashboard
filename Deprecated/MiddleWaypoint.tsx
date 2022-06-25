import { Waypoint, WaypointType } from './Waypoint';
import { DisplayStyle } from './DisplayStyle';

export class MiddleWaypoint extends Waypoint {
    private _controlPath: boolean;
    private _maxVelocity: number;

    constructor(
        name: string,
        x: number = 0,
        y: number = 0,
        angle: number = 0,
        heading: number = 0,
        displayStyle: DisplayStyle = DisplayStyle.SHOW,

        controlPath: boolean = false,
        maxVelocity: number = 0
    ) {
        super(name, x, y, angle, heading, displayStyle);

        this._controlPath = controlPath;
        this._maxVelocity = maxVelocity;
    }

    set maxVelocity(maxVelocity: number) { this._maxVelocity = maxVelocity; }
    get maxVelocity(): number { return this._maxVelocity; }

    set controlPath(controlPath: boolean) { this._controlPath = controlPath; }
    get controlPath(): boolean { return this._controlPath; }

    get waypointType(): WaypointType { return WaypointType.MIDDLE; }
}
