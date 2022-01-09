// Import for images
import * as _ from 'lodash';

// Import our styles
import * as $ from "jquery";
import './scss/style.scss';
import 'bootstrap';

// Project loading/code
import { AutonCreator } from "./AutonManager";
import { handleDragOverEvent, handleFileSelectEvent } from "./Events";
import { FieldCanvas } from "./FieldCanvas";
import { InputState } from "./Input";


 function initialize(activeAutonCreator: AutonCreator) {
    let fieldCanvas = new FieldCanvas(document.getElementById("windowCanvas") as HTMLCanvasElement);
    
    let windowDiv = document.getElementById("windowDiv");
    windowDiv.addEventListener("dragover", handleDragOverEvent, false);
    windowDiv.addEventListener("drop", (activeAutonCreator) => handleFileSelectEvent, false);

    activeAutonCreator.autonCreatorInit();
    loop(fieldCanvas, activeAutonCreator);

    windowDiv.scrollTop = windowDiv.scrollHeight;
};
    
function loop(fieldCanvas: FieldCanvas, activeAutonCreator: AutonCreator) {
    InputState.update();

    fieldCanvas.clearRect(0, 0);
    fieldCanvas.rect(0, 0);
    
    activeAutonCreator.autonCreatorDataLoop(fieldCanvas);
    activeAutonCreator.autonCreatorDrawLoop(fieldCanvas);

    requestAnimationFrame(() => {
        loop(fieldCanvas, activeAutonCreator);
    });
};

let autonCreator = new AutonCreator();
initialize(autonCreator);
$(document).ready(function() {
    $("#newPath").click(function(){
        autonCreator.createNewPath();
    });

    $("#newWaypoint").click(function(){
        autonCreator.newWaypoint();
    });

    $("#newSharedWaypoint").click(function(){
        autonCreator.newSharedWaypoint();
    });

    $("#removeWaypoint").click(function(){
        autonCreator.removeWaypoint();
    });

    $("#exportPath").click(function(){
        autonCreator.exportPath();
    });

    $("#sendPath").click(function(){
        autonCreator.sendPath();
    });

    $("#close").click(function(){
        autonCreator.loadConfig();
    });

    $("#close2").click(function(){
        autonCreator.loadConfig();
    });

    $("#tankDrive").click(function(){
        autonCreator.setSwerve();
    });

    $("#save").click(function(){
        autonCreator.saveConfig();
    });

    $("#save2").click(function(){
        autonCreator.saveWaypointConfig();
    });
});
