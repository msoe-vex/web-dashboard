let fieldMousePos = { x: 0, y: 0 };

const fieldMouseInitialization = { l: false, m: false, r: false };
let fieldMouseButton = fieldMouseInitialization;
let fieldMouseOld = fieldMouseInitialization;
let fieldMouseRising = fieldMouseInitialization;
let fieldMouseFalling = fieldMouseInitialization;

const fieldKeyboardInitialization = { shift: false, control: false, n: false, delete: false };
let fieldKeyboard = fieldKeyboardInitialization;
let fieldKeyboardOld = fieldKeyboardInitialization;
let fieldKeyboardRising = fieldKeyboardInitialization;
let fieldKeyboardFalling = fieldKeyboardInitialization;

const cursors = {
	default: "default",
	crosshair: "crosshair",
	move: "move"
};

const canvas = document.getElementById('windowCanvas');

canvas.setAttribute("tabindex", 0);

canvas.oncontextmenu = function (evt) {
	evt.preventDefault();
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
	if (evt.key === "Shift") {
		fieldKeyboard.shift = true;
	} else if (evt.key === "Control") {
		fieldKeyboard.control = true;
	} else if (evt.key === "n") {
		fieldKeyboard.n = true;
	} else if (evt.key === "Enter") {
		fieldKeyboard.n = false;
	} else if (evt.key == "Delete") {
		fieldKeyboard.delete = true;
	}
}, false);

canvas.addEventListener('keyup', function (evt) {
	if (evt.key === "Shift") {
		fieldKeyboard.shift = false;
	} else if (evt.key === "Control") {
		fieldKeyboard.control = false;
	} else if (evt.key == "Delete") {
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
	fieldMouseRising.l = fieldMouseButton.l && !fieldMouseOld.l;
	fieldMouseFalling.l = !fieldMouseButton.l && fieldMouseOld.l;
	fieldMouseRising.m = fieldMouseButton.m && !fieldMouseOld.m;
	fieldMouseFalling.m = !fieldMouseButton.m && fieldMouseOld.m;
	fieldMouseRising.r = fieldMouseButton.r && !fieldMouseOld.r;
	fieldMouseFalling.r = !fieldMouseButton.r && fieldMouseOld.r;
	fieldMouseOld.l = fieldMouseButton.l;
	fieldMouseOld.r = fieldMouseButton.r;
	fieldMouseOld.m = fieldMouseButton.m;

	setKeyboardState("shift");
	setKeyboardState("control");
	setKeyboardState("delete");
}

function setKeyboardState(key) {
	setKeypressState(fieldKeyboardRising, fieldKeyboardFalling, fieldKeyboard, fieldKeyboardOld, key);
}

function setKeypressState(risingState, fallingState, standardState, oldState, key) {
	risingState[key] = standardState[key] && !oldState[key];
	fallingState[key] = !standardState[key] && oldState[key];
	oldState[key] = standardState[key];
}
