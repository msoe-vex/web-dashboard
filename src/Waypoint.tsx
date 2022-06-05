import { DisplayStyle } from './DisplayStyle';

export class Waypoint {
    private _name: string | undefined;
    private _actions: string[] | undefined;
    private _followsPath: boolean = true;
    private _displayStyle: DisplayStyle = DisplayStyle.SHOW;

    constructor(name: string | undefined, actions: string[] | undefined, followsPath: boolean, displayStyle: DisplayStyle) {
        this._name = name;
        this._actions = actions;
        this._followsPath = followsPath;
        this._displayStyle = displayStyle;
    }

    set name(name: string | undefined) {
        this._name = name;
    }

    get name(): string | undefined {
        return this._name;
    }

    set actions(actions: string[] | undefined) {
        this._actions = actions;
    }

    get actions(): string[] | undefined {
        return this._actions;
    }

    set followsPath(followsPath: boolean) {
        this._followsPath = followsPath;
    }

    get followsPath(): boolean {
        return this._followsPath;
    }

    set displayStyle(displayStyle: DisplayStyle) {
        this._displayStyle = displayStyle;
    }

    get displayStyle(): DisplayStyle {
        return this._displayStyle;
    }
}
