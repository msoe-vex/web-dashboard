import { AutonCreator } from "./AutonManager";
import { handleDragOverEvent, handleFileSelectEvent } from "./Events";
import { FieldCanvas } from "./FieldCanvas";
import { updateInput } from "./Input";

export function initialize(activeAutonCreator: AutonCreator) {
    let fieldCanvas = new FieldCanvas(document.getElementById("windowCanvas") as HTMLCanvasElement);
    
    let windowDiv = document.getElementById("windowDiv");
    windowDiv.addEventListener("dragover", handleDragOverEvent, false);
    windowDiv.addEventListener("drop", (activeAutonCreator) => handleFileSelectEvent, false);

    activeAutonCreator.autonCreatorInit();
    loop(fieldCanvas, activeAutonCreator);

    windowDiv.scrollTop = windowDiv.scrollHeight;
};

function loop(fieldCanvas: FieldCanvas, activeAutonCreator: AutonCreator) {
    updateInput();

    fieldCanvas.clearRect(0, 0);
    fieldCanvas.rect(0, 0);
    
    activeAutonCreator.autonCreatorDataLoop(fieldCanvas);
    activeAutonCreator.autonCreatorDrawLoop(fieldCanvas);

    requestAnimationFrame(() => {
        loop(fieldCanvas, activeAutonCreator);
    });
}
