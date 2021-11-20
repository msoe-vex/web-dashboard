import { Point } from "./Point";

export enum CursorTypes {
    DEFAULT = "default",
    CROSSHAIR = "crosshair",
	MOVE = "move"
};

export class State {
	private active = false;
	private old = false;
	private rising = false;
	private falling = false;

	public held() {
		return this.active;
	}

	public pressed() {
		return this.rising;
	}

	public released() {
		return this.falling;
	}

	public setPressed() {
		this.active = true;
	}

	public setReleased() {
		this.active = false;
	}

	public updateState() {
		this.rising = this.active && !this.old;
		this.falling = !this.active && this.old;
		this.old = this.active;
	}
}

export type Mouse = {
	[index: string] : State;
	l: State;
	m: State;
	r: State;
}

export type Keyboard = {
	[index: string] : State;
	shift: State;
	control: State;
	delete: State;
	z: State;
	y: State;
}

export class InputState {
	static fieldMousePos: Point = new Point(0, 0);

	static mouse: Mouse;
	static keyboard: Keyboard;

	static update() {
		for (const key in InputState.mouse) {
			InputState.mouse[key].updateState();
		}
		for (const key in InputState.keyboard) {
			InputState.keyboard[key].updateState();
		}
	}
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
	InputState.update();
}