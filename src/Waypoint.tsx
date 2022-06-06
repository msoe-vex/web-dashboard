import { DisplayStyle } from './DisplayStyle';

export enum WaypointType {
    MIDDLE,
    END
}

export abstract class Waypoint {
    private _name: string;
    private _x: number; // meters
    private _y: number; // meters
    private _angle: number; // radians
    private _heading: number; // radians
    private _displayStyle: DisplayStyle;

    constructor(
        name: string,
        x: number = 0,
        y: number = 0,
        angle: number = 0,
        heading: number = 0,
        displayStyle: DisplayStyle = DisplayStyle.SHOW
    ) {
        this._name = name;
        this._x = x;
        this._y = y;
        this._angle = angle;
        this._heading = heading;
        this._displayStyle = displayStyle;
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

    set displayStyle(displayStyle: DisplayStyle) { this._displayStyle = displayStyle; }
    get displayStyle(): DisplayStyle { return this._displayStyle; }

    abstract get maxVelocity(): number;
    abstract get controlPath(): boolean;
    abstract get waypointType(): WaypointType;
}
