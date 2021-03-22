let fieldMousePos = { x: 0, y: 0 };
let fieldMouseButton = { l: false, m: false, r: false };
let fieldMouseOld = { l: false, m: false, r: false };
let fieldMouseRising = { l: false, m: false, r: false };
let fieldMouseFalling = { l: false, m: false, r: false };

let fieldKeyboard = { shift: false, control: false, n: false };
let fieldKeyboardOld = { shift: false, control: false, n:false };
let fieldKeyboardRising = { shift: false, control: false, n: false };
let fieldKeyboardFalling = { shift: false, control: false, n: false };

export const cursors = {
	default: "default",
	crosshair: "crosshair",
	move: "move"
};

// Get the position of a touch relative to the canvas
export const getTouchPos = (canvasDom, touchEvent) => {
    let rect = canvasDom.getBoundingClientRect();
    return new point(
        touchEvent.touches[0].clientX - rect.left,
        touchEvent.touches[0].clientY - rect.top
	);
}

export const updateInput = () => {
	fieldMouseRising.l = fieldMouseButton.l && !fieldMouseOld.l;
	fieldMouseFalling.l = !fieldMouseButton.l && fieldMouseOld.l;
	fieldMouseRising.m = fieldMouseButton.m && !fieldMouseOld.m;
	fieldMouseFalling.m = !fieldMouseButton.m && fieldMouseOld.m;
	fieldMouseRising.r = fieldMouseButton.r && !fieldMouseOld.r;
	fieldMouseFalling.r = !fieldMouseButton.r && fieldMouseOld.r;
	fieldMouseOld.l = fieldMouseButton.l;
	fieldMouseOld.r = fieldMouseButton.r;
	fieldMouseOld.m = fieldMouseButton.m;
	fieldMouseOld.n = fieldMouseButton.n;

	fieldKeyboardRising.shift = fieldKeyboard.shift && !fieldKeyboardOld.shift;
	fieldKeyboardFalling.shift = !fieldKeyboard.shift && fieldKeyboardOld.shift;
	fieldKeyboardOld.shift = fieldKeyboard.shift;

	fieldKeyboardRising.control = fieldKeyboard.control && !fieldKeyboardOld.control;
	fieldKeyboardFalling.control = !fieldKeyboard.control && fieldKeyboardOld.control;
	fieldKeyboardOld.control = fieldKeyboard.control;
}

