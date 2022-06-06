import { DisplayStyle } from './DisplayStyle';

export class Waypoint {
    private _name: string | undefined;
    private _followPath: boolean = true;
    private _displayStyle: DisplayStyle = DisplayStyle.SHOW;

    constructor(name: string | undefined, followPath: boolean, displayStyle: DisplayStyle) {
        this._name = name;
        this._followPath = followPath;
        this._displayStyle = displayStyle;
    }

    set name(name: string | undefined) {
        this._name = name;
    }

    get name(): string | undefined {
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
}
