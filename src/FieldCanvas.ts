import { CursorTypes, getTouchPos, InputState } from "./Input";
import { Point } from "./Point";

export class FieldCanvas {
    fieldCanvas: HTMLCanvasElement
    fieldContext: CanvasRenderingContext2D

    constructor(canvasElement: HTMLCanvasElement) {
        this.fieldCanvas = <HTMLCanvasElement>canvasElement;
        this.fieldContext = this.fieldCanvas.getContext('2d');

        this.fieldCanvas.setAttribute("tabindex", "0");

        this.fieldCanvas.oncontextmenu = (event: MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();
        };

        this.configureEventHandlers();
    }

    private configureEventHandlers() {
        let canvas = this.fieldCanvas;

        canvas.addEventListener('mousemove', (event: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            InputState.fieldMousePos = new Point(
                Math.floor((event.clientX - rect.left) / (rect.right - rect.left) * canvas.width),
                Math.floor((event.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height)
            );
        }, false);

        canvas.addEventListener('mousedown', (event: MouseEvent) => {
            if (event.button === 0) {
                InputState.mouse.l.setPressed();
            } else if (event.button === 1) {
                InputState.mouse.m.setPressed();
            } else if (event.button === 2) {
                InputState.mouse.r.setPressed();
            }
        }, false);

        canvas.addEventListener('mouseup', (event: MouseEvent) => {
            if (event.button === 0) {
                InputState.mouse.l.setReleased();
            } else if (event.button === 1) {
                InputState.mouse.m.setReleased();
            } else if (event.button === 2) {
                InputState.mouse.r.setReleased();
            }
        }, false);

        canvas.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.key === "Shift") {
                InputState.keyboard.shift.setPressed();
            } else if (event.key === "Control") {
                InputState.keyboard.control.setPressed();
            } else if (event.key === "Delete") {
                InputState.keyboard.delete.setPressed();
            } 
        }, false);

        canvas.addEventListener('keyup', (event: KeyboardEvent) => {
            if (event.key === "Shift") {
                InputState.keyboard.shift.setReleased();
            } else if (event.key === "Control") {
                InputState.keyboard.control.setReleased();
            }
        }, false);

        window.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.key === "Delete") {
                InputState.keyboard.delete.setPressed();
            } 
        }, false);

        window.addEventListener('keyup', (event: KeyboardEvent) => {
            if (event.key === "Delete") {
                InputState.keyboard.delete.setReleased();
            }
        }, false);

        // Set up touch events for mobile, etc
        canvas.addEventListener("touchstart", (event: TouchEvent) => {
            InputState.fieldMousePos = getTouchPos(canvas, event);
            const touch = event.touches[0];
            const mouseEvent = new MouseEvent("mousedown", {
                clientX: touch.clientX,
                clientY: touch.clientY,
                button: 0
            });
            canvas.dispatchEvent(mouseEvent);
        }, false);

        canvas.addEventListener("touchend", (event: TouchEvent) => {
            const mouseEvent = new MouseEvent("mouseup", {
                button: 0
            });
            canvas.dispatchEvent(mouseEvent);
        }, false);

        canvas.addEventListener("touchmove", (event: TouchEvent) => {
            const touch = event.touches[0];
            const mouseEvent = new MouseEvent("mousemove", {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            canvas.dispatchEvent(mouseEvent);
        }, false);
    }

    getWidth(): number {
        return this.fieldCanvas.width;
    }

    getHeight(): number {
        return this.fieldCanvas.height;
    }

    getFieldCanvas(): HTMLCanvasElement {
        return this.fieldCanvas;
    }

    getFieldContext(): CanvasRenderingContext2D {
        return this.fieldContext;
    }

    setCursor(type: CursorTypes) {
        this.fieldCanvas.style.cursor = type;
    }

    rect(x: number, y: number) {
        this.fieldContext.rect(x, y, this.fieldCanvas.width, this.fieldCanvas.height);
    }

    clearRect(x: number, y: number) {
        this.fieldContext.clearRect(x, y, this.fieldCanvas.width, this.fieldCanvas.height);
    }
}