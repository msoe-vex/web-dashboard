let fieldMousePos = { x: 0, y: 0 };

const fieldMouseInitialization = { l: false, m: false, r: false };
let fieldMouseButton = Object.assign({}, fieldMouseInitialization);
let fieldMouseOld = Object.assign({}, fieldMouseInitialization);
let fieldMouseRising = Object.assign({}, fieldMouseInitialization);
let fieldMouseFalling = Object.assign({}, fieldMouseInitialization);

const fieldKeyboardInitialization = { shift: false, control: false, delete: false };
let fieldKeyboard = Object.assign({}, fieldKeyboardInitialization);
let fieldKeyboardOld = Object.assign({}, fieldKeyboardInitialization);
let fieldKeyboardRising = Object.assign({}, fieldKeyboardInitialization);
let fieldKeyboardFalling = Object.assign({}, fieldKeyboardInitialization);

const cursors = {
	default: "default",
	crosshair: "crosshair",
	move: "move"
};

const canvas = document.getElementById('windowCanvas');

canvas.setAttribute("tabindex", 0);

canvas.oncontextmenu = function (evt) {
	evt.preventDefault(); // disables right click context menu
	evt.stopPropagation();
};

canvas.addEventListener('mousemove', function (evt) {
	const cnv = document.getElementById('windowCanvas');
	const rect = cnv.getBoundingClientRect();
	fieldMousePos = new point(
		Math.floor((evt.clientX - rect.left) / (rect.right - rect.left) * cnv.width),
		Math.floor((evt.clientY - rect.top) / (rect.bottom - rect.top) * cnv.height)
	);
}, false);

canvas.addEventListener('mousedown', function (evt) {
	if (evt.button === 0) {
		fieldMouseButton.l = true;
	} else if (evt.button === 1) {
		fieldMouseButton.m = true;
	} else if (evt.button === 2) {
		fieldMouseButton.r = true;
	}
}, false);

canvas.addEventListener('mouseup', function (evt) {
	if (evt.button === 0) {
		fieldMouseButton.l = false;
	} else if (evt.button === 1) {
		fieldMouseButton.m = false;
	} else if (evt.button === 2) {
		fieldMouseButton.r = false;
	}
}, false);

canvas.addEventListener('keydown', function (evt) {
	if (evt.ctrlKey && evt.key === "z") {
		fieldKeyboard.undo = true;
	}
}, false);

canvas.addEventListener('keyup', function (evt) {
	if (evt.ctrlKey && evt.key === "z") {
		fieldKeyboard.undoWait = false;
		fieldKeyboard.undo = false;
	}
}, false)

canvas.addEventListener('keydown', function (evt) {
	if (evt.ctrlKey && evt.key === "y") {
		fieldKeyboard.redo = true;
	}
}, false);

canvas.addEventListener('keyup', function (evt) {
	if (evt.ctrlKey && evt.key === "y") {
		fieldKeyboard.redoWait = false;
		fieldKeyboard.redo = false;
	}
}, false)

canvas.addEventListener('keydown', function (evt) {
	if (evt.key === "Shift") {
		fieldKeyboard.shift = true;
	} else if (evt.key === "Control") {
		fieldKeyboard.control = true;
	}
}, false);

canvas.addEventListener('keyup', function (evt) {
	if (evt.key === "Shift") {
		fieldKeyboard.shift = false;
	} else if (evt.key === "Control") {
		fieldKeyboard.control = false;
	}
}, false);

/**
 * Global keys use window so that mouse click location does not affect behavior
 */
window.addEventListener('keydown', function (evt) {
	if (evt.key == "Delete") {
		fieldKeyboard.delete = true;
	}
}, false);

window.addEventListener('keyup', function (evt) {
	if (evt.key == "Delete") {
		fieldKeyboard.delete = false;
	}
}, false);

// Set up touch events for mobile, etc
canvas.addEventListener("touchstart", function (e) {

	fieldMousePos = getTouchPos(canvas, e);
	const touch = e.touches[0];
	const mouseEvent = new MouseEvent("mousedown", {
        clientX: touch.clientX,
        clientY: touch.clientY,
        button: 0
    });
    canvas.dispatchEvent(mouseEvent);
}, false);

canvas.addEventListener("touchend", function (e) {
	const mouseEvent = new MouseEvent("mouseup", {
        button: 0
    });
    canvas.dispatchEvent(mouseEvent);
}, false);

canvas.addEventListener("touchmove", function (e) {

	const touch = e.touches[0];
	const mouseEvent = new MouseEvent("mousemove", {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}, false);

// Prevent scrolling when touching the canvas
// Needs Mozernizr
// document.body.addEventListener("touchstart", function (e) {
//     if (e.target === canvas) {
//         e.preventDefault();
//     }
// }, Modernizr.passiveeventlisteners ? {passive: true} : false);
// document.body.addEventListener("touchend", function (e) {
//     if (e.target === canvas) {
//         e.preventDefault();
//     }
// }, Modernizr.passiveeventlisteners ? {passive: true} : false);
// document.body.addEventListener("touchmove", function (e) {
//     if (e.target === canvas) {
//         e.preventDefault();
//     }
// }, Modernizr.passiveeventlisteners ? {passive: true} : false);

// Get the position of a touch relative to the canvas
function getTouchPos(canvasDom, touchEvent) {
    let rect = canvasDom.getBoundingClientRect();
    return new point(
        touchEvent.touches[0].clientX - rect.left,
        touchEvent.touches[0].clientY - rect.top
	);
}


function updateInput() {
	updateMouseState("l");
	updateMouseState("m");
	updateMouseState("r");
	
	updateKeyboardState("shift");
	updateKeyboardState("control");
	updateKeyboardState("delete");
}

/**
 * Sets the key press state of a mouse button.
 */
function updateMouseState(key) {
	updateKeypressState(fieldMouseRising, fieldMouseFalling, fieldMouseButton, fieldMouseOld, key);
}

/**
 * Sets the key press state of a keyboard key.
 */
function updateKeyboardState(key) {
	updateKeypressState(fieldKeyboardRising, fieldKeyboardFalling, fieldKeyboard, fieldKeyboardOld, key);
}

/**
 * Sets the key press state of a set of given objects.
 */
function updateKeypressState(risingState, fallingState, standardState, oldState, key) {
	risingState[key] = standardState[key] && !oldState[key];
	fallingState[key] = !standardState[key] && oldState[key];
	oldState[key] = standardState[key];
}
