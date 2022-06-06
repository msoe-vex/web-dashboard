import { DisplayStyle } from './DisplayStyle';

/**
 * An enum defining the location of a waypoint in a path. 
 */
export enum PathLocation {
    START,
    MIDDLE,
    END
}

export class Waypoint {
    private _name: string;
    private _x: number; // meters
    private _y: number; // meters
    private _angle: number; // radians
    private _heading: number; // radians

    private _followPath: boolean;
    private _maxVelocity: number;

    private _displayStyle: DisplayStyle;
    private _pathLocation: PathLocation;

    constructor(
        name: string,
        x: number = 0,
        y: number = 0,
        angle: number = 0,
        heading: number = 0,

        followPath: boolean = false,
        maxVelocity: number = 0,

        displayStyle: DisplayStyle = DisplayStyle.SHOW,
        pathLocation: PathLocation = PathLocation.MIDDLE
    ) {
        this._name = name;
        this._x = x;
        this._y = y;
        this._angle = angle;
        this._heading = heading;

        this._followPath = followPath;
        this._maxVelocity = maxVelocity;

        this._displayStyle = displayStyle;
        this._pathLocation = pathLocation;
    }

    set name(name: string) { this._name = name; }
    get name(): string { return this._name; }

    set x(x: number) { this._x = x; }
    get x(): number { return this._x; }

    set y(y: number) { this._y = y; }
    get y(): number { return this._y; }

    set angle(angle: number) { this._angle = angle; }
    get angle(): number { return this._angle; }

    set heading(heading: number) { this._heading = heading; }
    get heading(): number { return this._heading; }

    set maxVelocity(maxVelocity: number) { this._maxVelocity = maxVelocity; }
    get maxVelocity(): number { return this._maxVelocity; }

    set followPath(followPath: boolean) { this._followPath = followPath; }
    get followPath(): boolean { return this._followPath; }

    set displayStyle(displayStyle: DisplayStyle) { this._displayStyle = displayStyle; }
    get displayStyle(): DisplayStyle { return this._displayStyle; }

    set pathLocation(pathLocation: PathLocation) { this._pathLocation = pathLocation; }
    get pathLocation(): PathLocation { return this._pathLocation; }
}
