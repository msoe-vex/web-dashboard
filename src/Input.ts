import { Point } from "./Point";

export type MouseState = {
	l: boolean;
	m: boolean;
	r: boolean;
	n: boolean;
};

export type KeyboardState = {
	shift: boolean;
	control: boolean;
	n: boolean;
};

export enum CursorTypes {
    DEFAULT = "default",
    CROSSHAIR = "crosshair",
	MOVE = "move"
};

export class InputState {
	static fieldMousePos: Point = new Point(0, 0);
	
	static fieldMouseButton: MouseState = { l: false, m: false, r: false, n: false };
	static fieldMouseOld: MouseState = { l: false, m: false, r: false, n: false };
	static fieldMouseRising: MouseState = { l: false, m: false, r: false, n: false };
	static fieldMouseFalling: MouseState = { l: false, m: false, r: false, n: false };
	
	static fieldKeyboard: KeyboardState = { shift: false, control: false, n: false };
	static fieldKeyboardOld: KeyboardState = { shift: false, control: false, n:false };
	static fieldKeyboardRising: KeyboardState = { shift: false, control: false, n: false };
	static fieldKeyboardFalling: KeyboardState = { shift: false, control: false, n: false };
}

// Get the position of a touch relative to the canvas
export function getTouchPos(canvasDom: HTMLCanvasElement, touchEvent: TouchEvent) {
    let rect = canvasDom.getBoundingClientRect();
    return new Point(
        touchEvent.touches[0].clientX - rect.left,
        touchEvent.touches[0].clientY - rect.top
	);
}

export function updateInput() {
	InputState.fieldMouseRising.l = InputState.fieldMouseButton.l && !InputState.fieldMouseOld.l;
	InputState.fieldMouseFalling.l = !InputState.fieldMouseButton.l && InputState.fieldMouseOld.l;
	InputState.fieldMouseRising.m = InputState.fieldMouseButton.m && !InputState.fieldMouseOld.m;
	InputState.fieldMouseFalling.m = !InputState.fieldMouseButton.m && InputState.fieldMouseOld.m;
	InputState.fieldMouseRising.r = InputState.fieldMouseButton.r && !InputState.fieldMouseOld.r;
	InputState.fieldMouseFalling.r = !InputState.fieldMouseButton.r && InputState.fieldMouseOld.r;
	InputState.fieldMouseOld.l = InputState.fieldMouseButton.l;
	InputState.fieldMouseOld.r = InputState.fieldMouseButton.r;
	InputState.fieldMouseOld.m = InputState.fieldMouseButton.m;
	InputState.fieldMouseOld.n = InputState.fieldMouseButton.n;

	InputState.fieldKeyboardRising.shift = InputState.fieldKeyboard.shift && !InputState.fieldKeyboardOld.shift;
	InputState.fieldKeyboardFalling.shift = !InputState.fieldKeyboard.shift && InputState.fieldKeyboardOld.shift;
	InputState.fieldKeyboardOld.shift = InputState.fieldKeyboard.shift;

	InputState.fieldKeyboardRising.control = InputState.fieldKeyboard.control && !InputState.fieldKeyboardOld.control;
	InputState.fieldKeyboardFalling.control = !InputState.fieldKeyboard.control && InputState.fieldKeyboardOld.control;
	InputState.fieldKeyboardOld.control = InputState.fieldKeyboard.control;
}