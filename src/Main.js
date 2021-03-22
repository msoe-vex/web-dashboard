import { autonCreatorInit, autonCreatorDataLoop } from "./AutonManager.js";

$(function() {
    let fieldCanvas = document.getElementById('windowCanvas');
    let fieldContext = fieldCanvas.getContext('2d');

    createEventListeners(fieldCanvas);

    let windowDiv = document.getElementById('windowDiv');
    windowDiv.addEventListener('dragover', handleDragOver, false);
    windowDiv.addEventListener('drop', handleFileSelect, false);

    let windowWidth = $("#windowCanvas").width();
    let windowHeight = $("#windowCanvas").height();

    autonCreatorInit();
    loop();

    windowDiv.scrollTop = windowDiv.scrollHeight;
});

const createEventListeners = (canvas) => {
    canvas.setAttribute("tabindex", 0);

    canvas.oncontextmenu = function (evt) {
        evt.preventDefault();
        evt.stopPropagation();
    };

    canvas.addEventListener('mousemove', function (evt) {
        const cnv = document.getElementById('windowCanvas');
        const rect = cnv.getBoundingClientRect();
        fieldMousePos = new Point(
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
        }
    }, false);

    canvas.addEventListener('keyup', function (evt) {
        if (evt.key === "Shift") {
            fieldKeyboard.shift = false;
        } else if (evt.key === "Control") {
            fieldKeyboard.control = false;
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
}

export const loop = () => {
    updateInput();

    windowWidth = $(window).width();
    windowHeight = $("#windowCanvas").height();

    fieldContext.clearRect(0, 0, windowWidth, windowHeight);
    fieldContext.rect(0, 0, windowWidth, windowHeight);

    autonCreatorDataLoop();
    autonCreatorDrawLoop();

    requestAnimationFrame(loop);
}

export const handleFileSelect = (evt) => {
    evt.stopPropagation();
    evt.preventDefault();

    var file = evt.dataTransfer.files[0];
    var read = new FileReader();
    read.readAsText(file);

    read.onloadend = function() {
        console.log(read.result);
		loadPath(read.result);
    }
}

export const handleDragOver = (evt) => {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}