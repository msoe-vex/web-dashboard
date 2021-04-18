import { activeAutonCreator } from "./AutonManager";
import { handleDragOverEvent, handleFileSelectEvent } from "./Events";
import { FieldCanvas } from "./FieldCanvas";
import { updateInput } from "./Input";

$(function () {
    let fieldCanvas = new FieldCanvas(document.getElementById("windowCanvas"));

    let windowDiv = document.getElementById("windowDiv");
    windowDiv.addEventListener("dragover", handleDragOverEvent, false);
    windowDiv.addEventListener("drop", handleFileSelectEvent, false);

    activeAutonCreator.autonCreatorInit();
    loop(fieldCanvas);

    windowDiv.scrollTop = windowDiv.scrollHeight;
});

export function loop(fieldCanvas: FieldCanvas) {
    updateInput();

    fieldCanvas.clearRect(0, 0);
    fieldCanvas.rect(0, 0);

    activeAutonCreator.autonCreatorDataLoop(fieldCanvas);
    activeAutonCreator.autonCreatorDrawLoop(fieldCanvas);

    requestAnimationFrame(() => {
        loop(fieldCanvas);
    });
}
