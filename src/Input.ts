import { Point } from "./Point";

export enum CursorTypes {
	DEFAULT = "default",
	CROSSHAIR = "crosshair",
	MOVE = "move",
}

export class State {
	private active: boolean = false;
	private old: boolean = false;
	private rising: boolean = false;
	private falling: boolean = false;

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

export class Mouse {
	[ index : string ] : State;
	l: State = new State();
	m: State = new State();
	r: State = new State();
}

export class Keyboard {
	[ index : string ] : State;
	shift: State = new State();
	control: State = new State();
	delete: State = new State();
}

export class InputState {
	static fieldMousePos: Point = new Point(0, 0);

	static mouse: Mouse = new Mouse();
	static keyboard: Keyboard = new Keyboard();

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