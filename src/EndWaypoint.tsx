import { Waypoint, WaypointType } from './Waypoint';
import { DisplayStyle } from './DisplayStyle';

export class EndWaypoint extends Waypoint {
    constructor(
        name: string,
        x: number = 0,
        y: number = 0,
        angle: number = 0,
        heading: number = 0,
        displayStyle: DisplayStyle = DisplayStyle.SHOW
    ) {
        super(name, x, y, angle, heading, displayStyle);
    }

    // velocity at start and end of path is always 0
    get maxVelocity(): number { return 0; }
    // endPoints should always be able to control the path
    get controlPath(): boolean { return false; }

    get waypointType(): WaypointType { return WaypointType.END; }
}
