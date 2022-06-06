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
    private _followPath: boolean = true;
    private _displayStyle: DisplayStyle = DisplayStyle.SHOW;
    private _pathLocation: PathLocation = PathLocation.MIDDLE;

    constructor(name: string, followPath: boolean, displayStyle: DisplayStyle, pathLocation: PathLocation) {
        this._name = name;
        this._followPath = followPath;
        this._displayStyle = displayStyle;
        this._pathLocation = pathLocation;
    }

    set name(name: string) {
        this._name = name;
    }

    get name(): string {
        return this._name;
    }

    set followPath(followPath: boolean) {
        this._followPath = followPath;
    }

    get followPath(): boolean {
        return this._followPath;
    }

    set displayStyle(displayStyle: DisplayStyle) {
        this._displayStyle = displayStyle;
    }

    get displayStyle(): DisplayStyle {
        return this._displayStyle;
    }

    set pathLocation(pathLocation: PathLocation) {
        this._pathLocation = pathLocation;
    }

    get pathLocation(): PathLocation {
        return this._pathLocation;
    }
}
