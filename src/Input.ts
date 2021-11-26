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

	public held(): boolean {
		return this.active;
	}

	public pressed(): boolean {
		return this.rising;
	}

	public released(): boolean {
		return this.falling;
	}

	public setPressed(): void {
		this.active = true;
	}

	public setReleased(): void {
		this.active = false;
	}

	public updateState(): void {
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
};

export type Keyboard = {
	[index: string] : State;
	shift: State;
	control: State;
	delete: State;
	z: State;
	y: State;
};

export class InputState {
	static fieldMousePos: Point = new Point(0, 0);

	static mouse: Mouse;
	static keyboard: Keyboard;

	static update(): void {
		for (const key in InputState.mouse) {
			InputState.mouse[key].updateState();
		}
		for (const key in InputState.keyboard) {
			InputState.keyboard[key].updateState();
		}
	}
}

// Get the position of a touch relative to the canvas
export function getTouchPos(canvasDom: HTMLCanvasElement, touchEvent: TouchEvent): Point {
    let rect = canvasDom.getBoundingClientRect();
    return new Point(
        touchEvent.touches[0].clientX - rect.left,
        touchEvent.touches[0].clientY - rect.top
	);
}

export function updateInput(): void {
	InputState.update();
}